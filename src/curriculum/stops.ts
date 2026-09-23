import { MAIN_TRAILS, allowedChars } from './index';
import { FINGER_LEVEL_COUNT, FINGER_PAIRS, LEVEL_NEEDS, fingerLevels, type FingerPair } from './finger-course';
import { fingerById } from './fingers';
import { fingerOf } from './method';

/** Every finger-course level is woven into the main path (DEC-20); there is no separate practice view. */
export const STOP_LEVELS = FINGER_LEVEL_COUNT;
/** At most this many stops follow one lesson; the rest move to later lessons, keeping each pair's levels in order. */
export const STOPS_PER_LESSON = 2;
/** A required stop: one finger-pair level, run after a main lesson that has taught every key it needs. */
export interface Stop { id: string; pair: FingerPair; level: number; after: string }

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
/** Characters a level needs before it can appear on the main path. */
function needs(pair: FingerPair, level: number): Set<string> {
  const kind = LEVEL_NEEDS[level]!;
  if (kind === 'text') return new Set(pair.sides.flatMap(id => [...fingerLevels(fingerById(id)!)[level]!.text]));
  const out = new Set([...LETTERS]);
  if (kind === 'capitals' || kind === 'symbols') out.add('A');
  if (kind === 'symbols') {
    // Only the number and symbol keys the main path actually teaches; the rest belong to the optional Code chapter.
    const taught = allowedChars(MAIN_TRAILS.at(-1)!);
    for (const k of taught) if (/[^a-zA-Z ]/.test(k) && (pair.sides as readonly string[]).includes(fingerOf(k) ?? '')) out.add(k);
  }
  return out;
}
const earliest = (pair: FingerPair, level: number): number => {
  const chars = needs(pair, level);
  const i = MAIN_TRAILS.findIndex(t => [...chars].every(c => allowedChars(t).has(c)));
  if (i < 0) throw new Error(`No main lesson teaches ${pair.id} level ${level + 1}`);
  return i;
};

/** Placement is derived, never authored: earliest lesson that covers the level, spread so no lesson carries more than two stops. */
function place(): Stop[] {
  // A level never comes before the pair's previous level, so its earliest slot is the running maximum.
  const wanted = FINGER_PAIRS.flatMap(pair => { let at = 0; return Array.from({ length: STOP_LEVELS }, (_, level) => ({ pair, level, at: (at = Math.max(at, earliest(pair, level))) })); })
    .sort((a, b) => a.at - b.at || a.level - b.level);
  const load = new Map<number, number>(), last = new Map<string, number>();
  // A stop after the final lesson would gate nothing, so the last possible slot is the lesson before it.
  const lastSlot = MAIN_TRAILS.length - 2;
  return wanted.map(({ pair, level, at }) => {
    let i = Math.max(at, last.get(pair.id) ?? 0);
    while (i < lastSlot && (load.get(i) ?? 0) >= STOPS_PER_LESSON) i++;
    load.set(i, (load.get(i) ?? 0) + 1); last.set(pair.id, i);
    return { id: `stop-${pair.id}-${level + 1}`, pair, level, after: MAIN_TRAILS[i]!.id };
  }).sort((a, b) => MAIN_TRAILS.findIndex(t => t.id === a.after) - MAIN_TRAILS.findIndex(t => t.id === b.after));
}
/** Stops in path order; stable sort keeps each pair's levels in order after one lesson. */
export const STOPS: readonly Stop[] = place();

export const stopsAfter = (trailId: string): Stop[] => STOPS.filter(s => s.after === trailId);
