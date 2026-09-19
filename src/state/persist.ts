import { FINGERS, LESSONS } from '../curriculum/lessons';

export const KEY = 'keygrove.v4';
const PREV = ['keygrove.v3', 'keygrove.v2'];

export interface Stats {
  runs: number; chars: number; attempts: number; bestWpm: number; bestAcc: number; xp: number; streak: number; bestCombo: number;
}
export interface FingerStat { runs: number; hits: number; attempts: number; bestWpm: number; bestAcc: number }
export interface State {
  selected: string;
  completed: string[];
  focus: string;
  fingerStats: Record<string, FingerStat>;
  stats: Stats;
}

export const fresh = (): State => ({
  selected: 'home', completed: [], focus: 'all', fingerStats: {},
  stats: { runs: 0, chars: 0, attempts: 0, bestWpm: 0, bestAcc: 0, xp: 0, streak: 0, bestCombo: 0 },
});

const num = (v: unknown): number => Math.max(0, Number(v) || 0);

export function clean(x: unknown): State {
  const s = fresh();
  if (!x || typeof x !== 'object') return s;
  const o = x as Record<string, unknown>;
  s.selected = LESSONS.some((l) => l.id === o.selected) ? (o.selected as string) : 'home';
  s.completed = Array.isArray(o.completed) ? [...new Set(o.completed.filter((id): id is string => LESSONS.some((l) => l.id === id)))] : [];
  s.focus = o.focus === 'all' || FINGERS.some((f) => f.id === o.focus) ? (o.focus as string) : 'all';
  const q = (o.stats && typeof o.stats === 'object' ? o.stats : {}) as Record<string, unknown>;
  for (const k of Object.keys(s.stats) as (keyof Stats)[]) s.stats[k] = num(q[k]);
  if (o.fingerStats && typeof o.fingerStats === 'object') {
    const fs = o.fingerStats as Record<string, unknown>;
    for (const f of FINGERS) {
      const v = fs[f.id];
      if (v && typeof v === 'object') {
        const r = v as Record<string, unknown>;
        s.fingerStats[f.id] = { runs: num(r.runs), hits: num(r.hits), attempts: num(r.attempts), bestWpm: num(r.bestWpm), bestAcc: num(r.bestAcc) };
      }
    }
  }
  return s;
}

export function load(): State {
  try {
    const current = localStorage.getItem(KEY);
    if (current) return clean(JSON.parse(current));
    for (const k of PREV) {
      const v = localStorage.getItem(k);
      if (v) return clean(JSON.parse(v));
    }
  } catch { /* fall through */ }
  return fresh();
}

export function save(state: State): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota / private mode */ }
}
