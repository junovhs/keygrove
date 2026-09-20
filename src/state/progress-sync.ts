// New accounts inherit the current guest course. Existing accounts retain their
// own history. Sign-out creates a fresh guest session, isolating account data.

import type { Session } from '@supabase/supabase-js';
import type { KeyStat } from '../engine/keymodel';
import { fresh, sanitize, type SaveV6, type TrailProgress } from './save';
import type { Client } from './supabase';

/** What the account row holds: a SaveV6 under a schema version of its own. */
export interface ProgressState { schemaVersion: 1; save: SaveV6 }

export type SyncStatus =
  | { kind: 'off' }
  | { kind: 'syncing' }
  | { kind: 'synced'; runs: number }
  | { kind: 'unavailable'; reason: 'not-installed' | 'offline' | 'error' };

const TABLE = 'keygrove_progress';
const SAVE_RPC = 'keygrove_save_progress';
/** Local writes within this window collapse into one push. */
const PUSH_DELAY_MS = 800;

/** What the account holds, read defensively: anything malformed reads as a fresh save. */
export function readProgressState(value: unknown): ProgressState {
  if (!value || typeof value !== 'object') return { schemaVersion: 1, save: fresh() };
  const candidate = value as Partial<ProgressState>;
  if (candidate.schemaVersion !== 1) return { schemaVersion: 1, save: fresh() };
  return { schemaVersion: 1, save: sanitize(candidate.save) };
}

export const toProgressState = (save: SaveV6): ProgressState => ({ schemaVersion: 1, save: sanitize(save) });

const totalRuns = (s: SaveV6): number => s.stats.runs;

/** Two records of the same trail: the best of each, run-order fields from the side that has run it more. */
function mergeTrail(a: TrailProgress, b: TrailProgress): TrailProgress {
  const lead = a.runs >= b.runs ? a : b;
  return {
    runs: Math.max(a.runs, b.runs),
    cleared: a.cleared || b.cleared,
    stars: Math.max(a.stars, b.stars) as 0 | 1 | 2 | 3,
    bestWpm: Math.max(a.bestWpm, b.bestWpm),
    bestAcc: Math.max(a.bestAcc, b.bestAcc),
    fails: Math.max(a.fails, b.fails),
    recent: [...lead.recent],
    cleanStreak: lead.cleanStreak,
  };
}

/** Per-key stats are EMAs that cannot be added; the side with more evidence is the one to keep. */
const mergeKey = (a: KeyStat, b: KeyStat): KeyStat => ({ ...(a.seen >= b.seen ? a : b) });

/**
 * Union of two saves. Progress only ever grows: every trail keeps its best,
 * every key keeps the richer record, lifetime stats take the larger value, and
 * confusion counts add. Settings and the current trail are the local ones —
 * a device preference, and the place this person was just working — unless
 * the remote side has done much more, in which case its position wins.
 */
export function mergeProgress(local: SaveV6, remote: SaveV6): SaveV6 {
  const out = fresh();
  for (const id of new Set([...Object.keys(local.fingerCourses), ...Object.keys(remote.fingerCourses)])) {
    out.fingerCourses[id] = Math.max(local.fingerCourses[id] ?? 0, remote.fingerCourses[id] ?? 0);
  }
  const remoteLeads = totalRuns(remote) > totalRuns(local);
  out.trail = remoteLeads ? remote.trail : local.trail;
  for (const id of new Set([...Object.keys(local.trails), ...Object.keys(remote.trails)])) {
    const a = local.trails[id], b = remote.trails[id];
    out.trails[id] = a && b ? mergeTrail(a, b) : { ...(a ?? b)! };
  }
  for (const k of new Set([...Object.keys(local.keys), ...Object.keys(remote.keys)])) {
    const a = local.keys[k], b = remote.keys[k];
    out.keys[k] = a && b ? mergeKey(a, b) : { ...(a ?? b)! };
  }
  for (const k of new Set([...Object.keys(local.confusions), ...Object.keys(remote.confusions)])) {
    out.confusions[k] = (local.confusions[k] ?? 0) + (remote.confusions[k] ?? 0);
  }
  for (const k of ['runs', 'chars', 'attempts', 'bestWpm', 'bestAcc', 'xp', 'days', 'bestCombo'] as const) {
    out.stats[k] = Math.max(local.stats[k], remote.stats[k]);
  }
  out.stats.lastDay = local.stats.lastDay > remote.stats.lastDay ? local.stats.lastDay : remote.stats.lastDay;
  out.settings = { ...local.settings };
  for (const k of new Set([...Object.keys(local.transitions), ...Object.keys(remote.transitions)])) {
    const a = local.transitions[k], b = remote.transitions[k];
    out.transitions[k] = { ...(a && b ? (a.seen >= b.seen ? a : b) : (a ?? b)!) };
  }
  for (const c of Object.keys(out.errors) as (keyof typeof out.errors)[]) out.errors[c] = Math.max(local.errors[c], remote.errors[c]);
  return sanitize(out);
}

export function sameProgress(a: SaveV6, b: SaveV6): boolean {
  return JSON.stringify(sanitize(a)) === JSON.stringify(sanitize(b));
}

const errorCode = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';

/** The table or function is not there: the migration has not been applied. */
const notInstalled = (error: unknown): boolean => {
  const code = errorCode(error);
  // 42P01 undefined_table, 42883 undefined_function, PGRST202 function not in schema cache, PGRST205 table not in schema cache
  return code === '42P01' || code === '42883' || code === 'PGRST202' || code === 'PGRST205';
};

/** The app's own store, as sync sees it. `write` must not call back into `wrote`. */
export interface LocalProgress {
  read(): SaveV6;
  /** Replace what the device holds with the account's copy; the app re-renders from it. */
  write(save: SaveV6): void;
}

export interface ProgressSync {
  /** Tell sync who is signed in; null on sign-out. */
  session(session: Session | null, client: Client): void;
  /** The app saved locally; push after a short quiet period. */
  wrote(): void;
  onStatus(listener: (status: SyncStatus) => void): void;
  status(): SyncStatus;
}

export function createProgressSync(local: LocalProgress): ProgressSync {
  let client: Client | null = null;
  let userId: string | null = null;
  let revision = 0;
  let status: SyncStatus = { kind: 'off' };
  let pushTimer: ReturnType<typeof setTimeout> | undefined;
  let pushing: Promise<void> | null = null;
  let dirty = false;
  const listeners = new Set<(status: SyncStatus) => void>();

  const setStatus = (next: SyncStatus): void => {
    status = next;
    for (const listener of listeners) listener(next);
  };

  const applyRemote = (save: SaveV6): void => {
    if (sameProgress(local.read(), save)) return;
    local.write(save);
  };

  const failed = (error: unknown): void => {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    setStatus({ kind: 'unavailable', reason: notInstalled(error) ? 'not-installed' : offline ? 'offline' : 'error' });
  };

  /** The account's row, or null when the account has none yet. */
  const pull = async (): Promise<{ save: SaveV6; revision: number } | null> => {
    if (!client || !userId) return null;
    const { data, error } = await client.from(TABLE).select('state, revision').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { save: readProgressState(data.state).save, revision: Number(data.revision) || 0 };
  };

  const push = async (save: SaveV6): Promise<void> => {
    if (!client) return;
    const { data, error } = await client.rpc(SAVE_RPC, { expected_revision: revision, next_state: toProgressState(save) });
    if (error) throw error;
    revision = Number((data as { revision?: unknown } | null)?.revision) || revision + 1;
  };

  /** Push what is local; on a lost race, take the account's copy in, merge, and push that. */
  const flush = async (): Promise<void> => {
    if (!client || !userId) return;
    if (pushing) { dirty = true; return; }
    dirty = false;
    setStatus({ kind: 'syncing' });
    pushing = (async () => {
      try {
        let save = local.read();
        try {
          await push(save);
        } catch (error) {
          if (errorCode(error) !== 'PT409') throw error;
          const remote = await pull();
          if (remote) {
            revision = remote.revision;
            save = mergeProgress(save, remote.save);
            applyRemote(save);
          }
          await push(save);
        }
        setStatus({ kind: 'synced', runs: totalRuns(save) });
      } catch (error) {
        dirty = true;
        failed(error);
      } finally {
        pushing = null;
        if (dirty && status.kind !== 'unavailable') void flush();
      }
    })();
    await pushing;
  };

  const schedulePush = (): void => {
    if (!userId) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void flush(), PUSH_DELAY_MS);
  };

  /** A fresh grove that keeps this device's settings: they are preferences, not progress. */
  const freshHere = (): SaveV6 => ({ ...fresh(), settings: { ...local.read().settings } });

  /** Sign-in: the account's progress replaces whatever this device held. */
  const activate = async (id: string): Promise<void> => {
    userId = id;
    revision = 0;
    setStatus({ kind: 'syncing' });
    try {
      const remote = await pull();
      let save: SaveV6;
      if (remote) {
        revision = remote.revision;
        save = remote.save;
        applyRemote(save);
      } else {
        save = sanitize(local.read());
        applyRemote(save);
        await push(save);
      }
      setStatus({ kind: 'synced', runs: totalRuns(save) });
    } catch (error) {
      failed(error);
    }
  };

  /** Sign-out: nothing of the account stays on the device. */
  const deactivate = (): void => {
    userId = null;
    revision = 0;
    clearTimeout(pushTimer);
    applyRemote(freshHere());
    setStatus({ kind: 'off' });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { if (userId && status.kind === 'unavailable' && status.reason === 'offline') void flush(); });
  }

  return {
    session(session, loaded) {
      client = loaded;
      const next = session?.user.id ?? null;
      if (next === userId) return;
      if (next) void activate(next);
      else deactivate();
    },
    wrote: schedulePush,
    onStatus(listener) { listeners.add(listener); listener(status); },
    status: () => status,
  };
}
