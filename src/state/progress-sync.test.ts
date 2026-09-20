import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAIN_TRAILS } from '../curriculum';
import { createProgressSync, mergeProgress, readProgressState, sameProgress, toProgressState, type LocalProgress } from './progress-sync';
import { fresh, freshProgress, type SaveV6 } from './save';
import type { Client } from './supabase';

const T0 = MAIN_TRAILS[0]!.id, T1 = MAIN_TRAILS[1]!.id, T2 = MAIN_TRAILS[2]!.id;
const DAY = 86_400_000;
const key = (seen: number, err = 0.1) => ({ err, lat: 300, lat2: 90_000, base: 300, spikes: 0, seen, hits: Math.round(seen * (1 - err)), streak: 2, last: 1_700_000_000_000, reviews: 0, interval: DAY, due: 1_700_000_000_000 + DAY });

const saveWith = (patch: Partial<SaveV6>): SaveV6 => ({ ...fresh(), ...patch });

describe('mergeProgress', () => {
  it('keeps the best of every trail, run-order fields from the side that ran it more', () => {
    const local = saveWith({ trails: { [T0]: { ...freshProgress(), runs: 4, cleared: true, stars: 2, bestWpm: 22, bestAcc: 98, recent: [90, 95, 98, 98], cleanStreak: 2 } } });
    const remote = saveWith({ trails: { [T0]: { ...freshProgress(), runs: 2, stars: 3, bestWpm: 30, bestAcc: 100, fails: 1, recent: [100, 100], cleanStreak: 1 }, [T1]: { ...freshProgress(), runs: 1 } } });
    const m = mergeProgress(local, remote);
    expect(m.trails[T0]).toEqual({ runs: 4, cleared: true, stars: 3, bestWpm: 30, bestAcc: 100, fails: 1, recent: [90, 95, 98, 98], cleanStreak: 2 });
    expect(m.trails[T1]).toEqual({ ...freshProgress(), runs: 1 });
  });

  it('keeps the richer key record, adds confusions, takes the larger lifetime stats', () => {
    const local = saveWith({ keys: { f: key(40, 0.05), j: key(3) }, confusions: { 'f>d': 2 }, stats: { ...fresh().stats, runs: 5, xp: 100, lastDay: '2026-09-18', days: 2 } });
    const remote = saveWith({ keys: { f: key(10, 0.5), k: key(8) }, confusions: { 'f>d': 3, 'j>k': 1 }, stats: { ...fresh().stats, runs: 3, xp: 400, lastDay: '2026-09-10', days: 4 } });
    const m = mergeProgress(local, remote);
    expect(m.keys['f']!.seen).toBe(40);
    expect(m.keys['j']!.seen).toBe(3);
    expect(m.keys['k']!.seen).toBe(8);
    expect(m.confusions).toEqual({ 'f>d': 5, 'j>k': 1 });
    expect(m.stats).toMatchObject({ runs: 5, xp: 400, days: 4, lastDay: '2026-09-18' });
  });

  it('settings stay local; the current trail follows whoever has run more', () => {
    const local = saveWith({ trail: T1, settings: { ...fresh().settings, guideStrong: true }, stats: { ...fresh().stats, runs: 2 } });
    const remote = saveWith({ trail: T2, settings: { ...fresh().settings, guideStrong: false }, stats: { ...fresh().stats, runs: 20 } });
    expect(mergeProgress(local, remote)).toMatchObject({ trail: T2, settings: { guideStrong: true } });
    expect(mergeProgress(remote, local)).toMatchObject({ trail: T2, settings: { guideStrong: false } });
    expect(mergeProgress(local, saveWith({ trail: T2 })).trail).toBe(T1);
  });

  it('merging with a fresh save is the identity', () => {
    const local = saveWith({ trail: T1, trails: { [T0]: { ...freshProgress(), runs: 3, cleared: true, stars: 2 } }, keys: { f: key(12) }, stats: { ...fresh().stats, runs: 3 } });
    expect(sameProgress(mergeProgress(local, fresh()), local)).toBe(true);
    expect(sameProgress(mergeProgress(fresh(), local), { ...local, trail: T1 })).toBe(true);
  });
});

describe('readProgressState', () => {
  it('reads a row defensively and round-trips a save', () => {
    expect(readProgressState(null).save).toEqual(fresh());
    expect(readProgressState({ schemaVersion: 2, save: { trail: T1 } }).save.trail).toBe(T0);
    const s = saveWith({ trail: T1, trails: { [T0]: { ...freshProgress(), runs: 2 } } });
    expect(readProgressState(JSON.parse(JSON.stringify(toProgressState(s)))).save).toEqual(s);
    expect(readProgressState({ schemaVersion: 1, save: { trail: 'nope', trails: { bogus: { runs: 1 } } } }).save).toEqual({ ...fresh(), settings: { ...fresh().settings, onboarded: true } });
  });
});

/** A fake account service: one row, revisioned exactly like keygrove_save_progress. */
function fakeClient(initial: { state: unknown; revision: number } | null = null) {
  let row = initial;
  const calls: string[] = [];
  const client = {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => { calls.push('pull'); return { data: row, error: null }; } }) }) }),
    rpc: async (_name: string, args: { expected_revision: number; next_state: unknown }) => {
      calls.push(`push@${args.expected_revision}`);
      const current = row?.revision ?? 0;
      if (args.expected_revision !== current) return { data: null, error: { code: 'PT409' } };
      row = { state: args.next_state, revision: current + 1 };
      return { data: { revision: row.revision }, error: null };
    },
  };
  return { client: client as unknown as Client, calls, row: () => row, setRow(r: typeof row) { row = r; } };
}

const session = (id: string) => ({ user: { id } }) as never;
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('createProgressSync', () => {
  let mem: Map<string, string>;
  let held: SaveV6;
  let local: LocalProgress;
  beforeEach(() => {
    mem = new Map();
    vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); } });
    vi.stubGlobal('navigator', { onLine: true });
    held = saveWith({ trails: { [T0]: { ...freshProgress(), runs: 2 } }, stats: { ...fresh().stats, runs: 2 } });
    local = { read: () => held, write: (s) => { held = s; } };
  });

  it('a new account preserves guest learning and settings', async () => {
    held = { ...held, settings: { ...held.settings, method: 'traditional@1.0', guideStrong: true } };
    const fake = fakeClient();
    const sync = createProgressSync(local);
    sync.session(session('u1'), fake.client);
    await settle();
    expect(fake.calls).toEqual(['pull', 'push@0']);
    expect(fake.row()?.revision).toBe(1);
    const landed = readProgressState(fake.row()?.state).save;
    expect(landed.trails[T0]!.runs).toBe(2);
    expect(landed.stats.runs).toBe(2);
    expect(landed.settings.method).toBe('traditional@1.0');
    expect(landed.settings.guideStrong).toBe(true);
    expect(held.stats.runs).toBe(2);
    expect(sync.status()).toEqual({ kind: 'synced', runs: 2 });
  });

  it('sign-in adopts the account copy as is; sign-out leaves a fresh grove, not the account and not the old guest runs', async () => {
    const remote = saveWith({ trails: { [T0]: { ...freshProgress(), runs: 9, cleared: true, stars: 3 } }, stats: { ...fresh().stats, runs: 9 } });
    const fake = fakeClient({ state: toProgressState(remote), revision: 4 });
    const sync = createProgressSync(local);
    sync.session(session('u1'), fake.client);
    await settle();
    expect(held.trails[T0]!.runs).toBe(9);
    expect(fake.calls).toEqual(['pull']); // nothing to push: the account copy was taken as is
    sync.session(null, fake.client);
    expect(held.trails[T0]).toBeUndefined();
    expect(held.stats.runs).toBe(0);
    expect(sync.status()).toEqual({ kind: 'off' });
  });

  it('a local write pushes; a lost race pulls, merges and pushes again', async () => {
    vi.useFakeTimers();
    const fake = fakeClient();
    const sync = createProgressSync(local);
    sync.session(session('u1'), fake.client);
    await vi.runAllTimersAsync();
    expect(held.stats.runs).toBe(2); // guest learning follows a new account
    // Another device advanced the row meanwhile.
    const other = saveWith({ trails: { [T1]: { ...freshProgress(), runs: 1 } }, stats: { ...fresh().stats, runs: 3 } });
    fake.setRow({ state: toProgressState(other), revision: 2 });
    held = saveWith({ ...held, trails: { ...held.trails, [T0]: { ...held.trails[T0]!, runs: 3 } }, stats: { ...held.stats, runs: 3 } });
    sync.wrote(); sync.wrote();
    await vi.runAllTimersAsync();
    expect(fake.calls).toEqual(['pull', 'push@0', 'push@1', 'pull', 'push@2']);
    const landed = readProgressState(fake.row()?.state).save;
    expect(landed.trails[T0]!.runs).toBe(3);
    expect(landed.trails[T1]!.runs).toBe(1);
    expect(held.trails[T1]!.runs).toBe(1);
    vi.useRealTimers();
  });

  it('a missing migration reads as not installed and progress stays on the device', async () => {
    const client = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: 'PGRST205' } }) }) }) }) } as unknown as Client;
    const sync = createProgressSync(local);
    sync.session(session('u1'), client);
    await settle();
    expect(sync.status()).toEqual({ kind: 'unavailable', reason: 'not-installed' });
    expect(held.trails[T0]!.runs).toBe(2);
  });
});
