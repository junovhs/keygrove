import { MAIN_TRAILS, TRAILS, trailById } from '../curriculum';
import { KeyModel, type KeyStats } from '../engine/keymodel';

export const KEY = 'keygrove.v5';
const PREV = ['keygrove.v4', 'keygrove.v3', 'keygrove.v2'];

export type Stage = 0 | 1 | 2 | 3; // 0 drill · 1 mix · 2 words · 3 cleared
export interface TrailProgress { stage: Stage; stars: 0 | 1 | 2 | 3; bestWpm: number; bestAcc: number; fails: number }
export interface Stats { runs: number; chars: number; attempts: number; bestWpm: number; bestAcc: number; xp: number; days: number; lastDay: string; bestCombo: number }
export interface Settings { slowMode: boolean; guideStrong: boolean; reviewOn: boolean; codeGrove: boolean }
export interface SaveV5 {
  v: 5;
  trail: string;
  trails: Record<string, TrailProgress>;
  keys: KeyStats;
  stats: Stats;
  settings: Settings;
}

export const freshProgress = (): TrailProgress => ({ stage: 0, stars: 0, bestWpm: 0, bestAcc: 0, fails: 0 });
export const fresh = (): SaveV5 => ({
  v: 5, trail: MAIN_TRAILS[0]!.id, trails: {}, keys: {},
  stats: { runs: 0, chars: 0, attempts: 0, bestWpm: 0, bestAcc: 0, xp: 0, days: 0, lastDay: '', bestCombo: 0 },
  settings: { slowMode: false, guideStrong: false, reviewOn: true, codeGrove: false },
});

const num = (v: unknown, max = Infinity): number => Math.min(max, Math.max(0, Number(v) || 0));
const int = (v: unknown, max: number) => Math.floor(num(v, max));

/** Coerce any object into a valid SaveV5, dropping unknown trails and clamping numbers. */
export function sanitize(x: unknown): SaveV5 {
  const s = fresh();
  if (!x || typeof x !== 'object') return s;
  const o = x as Record<string, unknown>;
  if (typeof o.trail === 'string' && TRAILS.some((t) => t.id === o.trail)) s.trail = o.trail;
  if (o.trails && typeof o.trails === 'object') {
    for (const [id, v] of Object.entries(o.trails as Record<string, unknown>)) {
      if (!TRAILS.some((t) => t.id === id) || !v || typeof v !== 'object') continue;
      const r = v as Record<string, unknown>;
      s.trails[id] = { stage: int(r.stage, 3) as Stage, stars: int(r.stars, 3) as 0 | 1 | 2 | 3, bestWpm: num(r.bestWpm, 400), bestAcc: num(r.bestAcc, 100), fails: int(r.fails, 99) };
    }
  }
  s.keys = KeyModel.fromJSON(o.keys).toJSON();
  const q = (o.stats && typeof o.stats === 'object' ? o.stats : {}) as Record<string, unknown>;
  for (const k of ['runs', 'chars', 'attempts', 'bestWpm', 'bestAcc', 'xp', 'days', 'bestCombo'] as const) s.stats[k] = num(q[k]);
  s.stats.lastDay = typeof q.lastDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q.lastDay) ? q.lastDay : '';
  const st = (o.settings && typeof o.settings === 'object' ? o.settings : {}) as Record<string, unknown>;
  for (const k of ['slowMode', 'guideStrong', 'reviewOn', 'codeGrove'] as const) if (typeof st[k] === 'boolean') s.settings[k] = st[k];
  return s;
}

/** v2–v4 saves: six lessons unlocked at 80%. Map cleared lessons onto the trails they covered. */
const LESSON_TRAILS: Record<string, string[]> = {
  home: ['anchors', 'inner-pair', 'ring-pair', 'outer-pair', 'home-words'],
  reach: ['index-reach', 'roots-checkpoint'],
  top: ['middle-up', 'index-up', 'index-stretch-up', 'ring-up', 'pinky-up', 'canopy-checkpoint'],
  bottom: ['index-down', 'index-stretch-down', 'middle-down', 'ring-down', 'pinky-down', 'undergrowth-checkpoint'],
  words: [], notes: [],
};
const FINGER_KEYS: Record<string, string> = { lp: 'qaz', lr: 'wsx', lm: 'edc', li: 'rftgvb', ri: 'yhnujm', rm: 'ik,', rr: 'ol.', rp: 'p;/' };

export function migrateV4(raw: unknown): SaveV5 {
  const s = fresh();
  if (!raw || typeof raw !== 'object') return s;
  const o = raw as Record<string, unknown>;
  const completed = Array.isArray(o.completed) ? o.completed.filter((x): x is string => typeof x === 'string') : [];
  for (const lesson of completed) for (const id of LESSON_TRAILS[lesson] ?? []) {
    const t = trailById(id);
    // A checkpoint cleared under the old 80% rule counts as ★★ so the next grove stays open.
    s.trails[id] = { stage: 3, stars: t.checkpoint ? 2 : 1, bestWpm: 0, bestAcc: 0, fails: 0 };
  }
  const first = MAIN_TRAILS.find((t) => !s.trails[t.id]);
  s.trail = (first ?? MAIN_TRAILS.at(-1)!).id;
  const q = (o.stats && typeof o.stats === 'object' ? o.stats : {}) as Record<string, unknown>;
  s.stats.runs = num(q.runs); s.stats.chars = num(q.chars); s.stats.attempts = num(q.attempts);
  s.stats.bestWpm = num(q.bestWpm, 400); s.stats.bestAcc = num(q.bestAcc, 100); s.stats.xp = num(q.xp); s.stats.bestCombo = num(q.bestCombo);
  // Seed key heat from per-finger accuracy so remedial offers start informed (deterministic: worst keys first).
  const km = new KeyModel();
  if (o.fingerStats && typeof o.fingerStats === 'object') {
    for (const [fid, v] of Object.entries(o.fingerStats as Record<string, unknown>)) {
      if (!v || typeof v !== 'object') continue;
      const r = v as Record<string, unknown>;
      const attempts = num(r.attempts), hits = num(r.hits);
      if (attempts < 5) continue;
      const misses = Math.round(5 * Math.max(0, Math.min(1, 1 - hits / attempts)));
      for (const k of FINGER_KEYS[fid] ?? '') for (let i = 0; i < 5; i++) km.record(k, i >= misses, 400, 0);
    }
  }
  s.keys = km.toJSON();
  return s;
}

export function load(storage: Pick<Storage, 'getItem'> = localStorage): SaveV5 {
  try {
    const cur = storage.getItem(KEY);
    if (cur) return sanitize(JSON.parse(cur));
    for (const k of PREV) { const v = storage.getItem(k); if (v) return migrateV4(JSON.parse(v)); }
  } catch { /* corrupt or unavailable storage → fresh */ }
  return fresh();
}
export function save(s: SaveV5, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try { storage.setItem(KEY, JSON.stringify(s)); } catch { /* quota / private mode */ }
}
