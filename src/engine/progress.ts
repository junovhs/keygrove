import { GROVES, MAIN_TRAILS, checkpointOf, gateFor, groveOf, nextTrail, trailById, trailsInGrove, type Trail, type StageName } from '../curriculum';
import { freshProgress, type SaveV5, type Stage, type TrailProgress } from '../state/save';
import { bumpStreak, effectiveGate, starsFor, xpFor, type Stars } from './scoring';

export const STAGE_NAMES: readonly StageName[] = ['drill', 'mix', 'words'];
export const progressOf = (s: SaveV5, id: string): TrailProgress => s.trails[id] ?? (s.trails[id] = freshProgress());
export const isCleared = (s: SaveV5, id: string): boolean => (s.trails[id]?.stage ?? 0) >= 3;

/** Whether a grove's first trail may be played. Checkpoints need ★★; optional groves also need the setting. */
export function groveOpen(s: SaveV5, groveId: string): boolean {
  const g = GROVES.find((x) => x.id === groveId)!;
  if (g.optional) { if (!s.settings.codeGrove) return false; const cp = s.trails[g.opensAfter!]; return !!cp && cp.stage >= 3 && cp.stars >= 2; }
  if (g.n === 1) return true;
  const prev = GROVES.find((x) => !x.optional && x.n === g.n - 1)!;
  const cp = s.trails[checkpointOf(prev.id).id];
  return !!cp && cp.stage >= 3 && cp.stars >= 2;
}

export function trailUnlocked(s: SaveV5, trail: Trail): boolean {
  if (!groveOpen(s, trail.grove)) return false;
  const inGrove = trailsInGrove(trail.grove);
  const i = inGrove.findIndex((t) => t.id === trail.id);
  return i === 0 || isCleared(s, inGrove[i - 1]!.id);
}

export const currentTrail = (s: SaveV5): Trail => trailById(s.trail);
export const currentStage = (s: SaveV5): StageName => STAGE_NAMES[Math.min(2, progressOf(s, s.trail).stage)]!;

export interface RunInput { hits: number; attempts: number; maxCombo: number; wpm: number; acc: number; now: number }
export interface Outcome {
  passed: boolean; stars: Stars; xp: number; firstClear: boolean;
  /** What the pass unlocked: next stage, the trail cleared, the next grove opened, or nothing new. */
  advance: 'stage' | 'trail' | 'grove' | 'none';
  nextTrail: Trail | null;
  /** Checkpoint cleared with ★ only — needs ★★ to open the next grove. */
  needsTwoStars: boolean;
  slowOffer: boolean;
}

/** Apply a finished run of the current trail/stage to the save. Mutates `s`; caller persists. */
export function applyRun(s: SaveV5, r: RunInput): Outcome {
  const trail = currentTrail(s);
  const p = progressOf(s, trail.id);
  const gate = effectiveGate(gateFor(trail), s.settings.slowMode);
  const stars = starsFor(gate, r.wpm, r.acc);
  const passed = stars >= 1;
  const wasCleared = p.stage >= 3;
  let advance: Outcome['advance'] = 'none';
  let next: Trail | null = null;
  let needsTwoStars = false;
  let firstClear = false;

  if (passed) {
    p.fails = 0;
    p.stars = Math.max(p.stars, stars) as Stars;
    if (!wasCleared) {
      p.stage = (p.stage + 1) as Stage;
      if (p.stage >= 3) { firstClear = true; advance = 'trail'; } else advance = 'stage';
    }
    if (p.stage >= 3) {
      const n = nextTrail(trail);
      if (n) {
        const opens = !trail.checkpoint || p.stars >= 2;
        if (opens) {
          next = n;
          if (s.trail !== n.id) { s.trail = n.id; advance = trail.checkpoint ? 'grove' : 'trail'; }
        } else needsTwoStars = true;
      }
    }
  } else {
    p.fails++;
  }
  const xp = xpFor(r.hits, r.acc, r.maxCombo, firstClear);
  p.bestWpm = Math.max(p.bestWpm, r.wpm); p.bestAcc = Math.max(p.bestAcc, r.acc);
  const st = s.stats;
  st.runs++; st.chars += r.hits; st.attempts += r.attempts; st.xp += xp;
  st.bestWpm = Math.max(st.bestWpm, r.wpm); st.bestAcc = Math.max(st.bestAcc, r.acc); st.bestCombo = Math.max(st.bestCombo, r.maxCombo);
  const streak = bumpStreak(st.days, st.lastDay, r.now); st.days = streak.days; st.lastDay = streak.lastDay;
  const slowOffer = !passed && p.fails >= 3 && !s.settings.slowMode;
  return { passed, stars, xp, firstClear, advance, nextTrail: next, needsTwoStars, slowOffer };
}

/** Position on the main path, 1-based, for the header. */
export const pathIndex = (trail: Trail): number => { const i = MAIN_TRAILS.findIndex((t) => t.id === trail.id); return i >= 0 ? i + 1 : trailsInGrove(trail.grove).findIndex((t) => t.id === trail.id) + 1; };
export const pathLength = (trail: Trail): number => (groveOf(trail).optional ? trailsInGrove(trail.grove).length : MAIN_TRAILS.length);
