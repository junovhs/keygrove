import { GROVES, MAIN_TRAILS, checkpointOf, cumulativeKeys, gateFor, groveOf, nextTrail, trailById, trailsInGrove, type Trail, type StageName } from '../curriculum';
import { freshProgress, type SaveV6, type TrailProgress } from '../state/save';
import { KeyModel, MASTERED } from './keymodel';
import { bumpStreak, starsFor, swiftBonus, xpFor, type Stars } from './scoring';

export const STAGE_NAMES: readonly StageName[] = ['drill', 'mix', 'words'];
export const progressOf = (s: SaveV6, id: string): TrailProgress => s.trails[id] ?? (s.trails[id] = freshProgress());
export const isCleared = (s: SaveV6, id: string): boolean => !!s.trails[id]?.cleared;

/** Chapter clears are permanent; optional chapters also need the setting. */
export function groveOpen(s: SaveV6, groveId: string): boolean {
  const g = GROVES.find((x) => x.id === groveId)!;
  if (g.optional) { if (!s.settings.codeGrove) return false; const cp = s.trails[g.opensAfter!]; return !!cp && cp.cleared; }
  if (g.n === 1) return true;
  const prev = GROVES.find((x) => !x.optional && x.n === g.n - 1)!;
  const cp = s.trails[checkpointOf(prev.id).id];
  return !!cp && cp.cleared;
}

export function trailUnlocked(s: SaveV6, trail: Trail): boolean {
  if (!groveOpen(s, trail.grove)) return false;
  const inGrove = trailsInGrove(trail.grove);
  const i = inGrove.findIndex((t) => t.id === trail.id);
  return i === 0 || isCleared(s, inGrove[i - 1]!.id);
}

export const currentTrail = (s: SaveV6): Trail => trailById(s.trail);
/** Keys a trail is judged on: its new keys (+ space on trail 1), or the 5 weakest unlocked keys when it adds none. */
export function focusKeys(trail: Trail, model: KeyModel, now = Date.now()): string[] {
  const own = [...trail.newKeys, ...(trail.space ? [' '] : [])];
  if (own.length) return own;
  const unlocked = [...cumulativeKeys(trail).keys];
  return unlocked.map((k) => ({ k, m: model.mastery(k, now) })).sort((a, b) => a.m - b.m).slice(0, 5).map((x) => x.k);
}
export const minMastery = (keys: string[], model: KeyModel, now = Date.now()): number => keys.reduce((m, k) => Math.min(m, model.mastery(k, now)), 1);
/** Stage for the next run comes from evidence, not a counter: drill until the new keys settle, mix until they are solid, then words. */
export function stageFor(trail: Trail, model: KeyModel, now = Date.now()): StageName {
  const m = minMastery(focusKeys(trail, model, now).filter((k) => k !== ' '), model, now);
  if (!trail.newKeys) return m < 0.5 ? 'mix' : 'words';
  return m < 0.35 ? 'drill' : m < 0.7 ? 'mix' : 'words';
}
export const currentStage = (s: SaveV6, model: KeyModel, now = Date.now()): StageName => stageFor(currentTrail(s), model, now);

export interface RunInput { hits: number; attempts: number; maxCombo: number; wpm: number; acc: number; rhythm: number; now: number; stage?: StageName }
export interface Outcome {
  passed: boolean; stars: Stars; xp: number; firstClear: boolean;
  /** What this run unlocked: the trail cleared, the next grove opened, or nothing new yet. */
  advance: 'trail' | 'grove' | 'none';
  /** Mastery of the focus keys after this run, and what still blocks clearing. */
  mastery: { key: string; mastery: number }[];
  blockers: string[];
  nextTrail: Trail | null;
  /** Checkpoint cleared with ★ only — needs ★★ to open the next grove. */
  needsTwoStars: boolean;
  /** 0..1 speed bonus applied to XP this run. */
  swift: number;
}

/** Apply an observation. Accurate repeated evidence plus a transfer passage opens the next lesson. */
export function applyRun(s: SaveV6, model: KeyModel, r: RunInput): Outcome {
  const trail = currentTrail(s);
  const p = progressOf(s, trail.id);
  const gate = gateFor(trail);
  const stars = starsFor(gate, r.acc, r.rhythm);
  const passed = stars >= 1;
  const wasCleared = p.cleared;
  let advance: Outcome['advance'] = 'none';
  let next: Trail | null = null;
  let needsTwoStars = false;
  let firstClear = false;
  p.runs++;
  p.recent = [...p.recent, r.acc].slice(-5);
  p.cleanStreak = r.acc >= 97 && r.rhythm >= 0.6 ? (p.cleanStreak ?? 0) + 1 : 0;
  const focus = focusKeys(trail, model, r.now);
  const mastery = focus.map((k) => ({ key: k, mastery: model.mastery(k, r.now) }));
  const blockers: string[] = [];
  
  const lastTwo = p.recent.slice(-2);
  if (lastTwo.length < 2 || lastTwo.some((a) => a < gate.passAcc)) blockers.push('another accurate sample');
  for (const m of mastery) if (m.mastery < MASTERED) blockers.push(`${m.key === ' ' ? 'Space' : m.key.toUpperCase()} ${Math.round(m.mastery * 100)}%`);
  if ((r.stage ?? stageFor(trail, model, r.now)) !== 'words') blockers.push('use these keys in a fresh context');
  if (trail.checkpoint && r.acc < 97) blockers.push('97% accuracy on the chapter passage');

  if (passed) {
    p.fails = 0;
    p.stars = Math.max(p.stars, stars) as Stars;
    if (!wasCleared && blockers.length === 0) { p.cleared = true; firstClear = true; advance = 'trail'; }
    if (p.cleared) {
      const n = nextTrail(trail);
      if (n) {
        const opens = true;
        if (opens) {
          next = n;
          if (s.trail !== n.id) { s.trail = n.id; advance = trail.checkpoint ? 'grove' : 'trail'; }
        } else needsTwoStars = true;
      }
    }
  } else {
    p.fails++;
  }
  const swift = swiftBonus(r.wpm, gate.swiftWpm);
  const xp = xpFor(r.hits, r.acc, r.maxCombo, firstClear, swift);
  p.bestWpm = Math.max(p.bestWpm, r.wpm); p.bestAcc = Math.max(p.bestAcc, r.acc);
  const st = s.stats;
  st.runs++; st.chars += r.hits; st.attempts += r.attempts; st.xp += xp;
  st.bestWpm = Math.max(st.bestWpm, r.wpm); st.bestAcc = Math.max(st.bestAcc, r.acc); st.bestCombo = Math.max(st.bestCombo, r.maxCombo);
  const streak = bumpStreak(st.days, st.lastDay, r.now); st.days = streak.days; st.lastDay = streak.lastDay;
  return { passed, stars, xp, firstClear, advance, mastery, blockers, nextTrail: next, needsTwoStars, swift };
}

/** Position on the main path, 1-based, for the header. */
export const pathIndex = (trail: Trail): number => { const i = MAIN_TRAILS.findIndex((t) => t.id === trail.id); return i >= 0 ? i + 1 : trailsInGrove(trail.grove).findIndex((t) => t.id === trail.id) + 1; };
export const pathLength = (trail: Trail): number => (groveOf(trail).optional ? trailsInGrove(trail.grove).length : MAIN_TRAILS.length);
