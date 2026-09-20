import { fingerById } from '../curriculum/fingers';
import { fingerOf, type FingerId } from '../curriculum/method';
import { fingerLevels, fingerCourseId, pairCompleted, FINGER_PASS_ACC, type FingerPair } from '../curriculum/finger-course';
import type { Run } from './run';

/** Require enough correct target presses to distinguish familiarity from a few lucky hits. */
export const MIN_FINGER_HITS = 20;
/** Snapshot of the sides deliberately exercised by this passage; incidental word letters cannot earn a level. */
export interface FingerPractice { text: string; sides: readonly FingerId[] }

/** Alternate both sides' tokens, or concentrate on the unfinished side after a partial pass. */
export function fingerPractice(pair: FingerPair, level: number, progress: Readonly<Record<string, number>>): FingerPractice {
  const pending = pair.sides.filter(id => (progress[fingerCourseId(id)] ?? 0) <= level);
  const sides = pending.length ? pending : pair.sides; // Completed levels replay both sides.
  const passages = sides.map(id => {
    const original = fingerLevels(fingerById(id)!)[level]!.text;
    const hits = [...original].filter(k => fingerOf(k) === id).length;
    // Each existing level includes its own landmark/reaches, so hits is always positive.
    const repeats = Math.max(1, Math.ceil(MIN_FINGER_HITS / hits));
    return Array.from({ length: repeats }, () => original).join(' ').split(' ');
  });
  const tokens: string[] = [];
  for (let i = 0; i < Math.max(...passages.map(p => p.length)); i++) {
    for (const passage of passages) if (passage[i]) tokens.push(passage[i]!);
  }
  return { text: tokens.join(' '), sides };
}

/** Record per-side passes from a completed passage, never from its aggregate accuracy or the mistyped key's owner. */
export function completeFingerPractice(
  progress: Record<string, number>, pair: FingerPair, level: number,
  practice: FingerPractice, run: Pick<Run, 'status' | 'text' | 'strokes'>,
): { passed: boolean; newlyPassed: FingerId[] } {
  const newlyPassed: FingerId[] = [];
  if (run.status !== 'complete' || run.text !== practice.text) return { passed: false, newlyPassed };
  for (const id of practice.sides) {
    if (!pair.sides.includes(id as Exclude<FingerId, 'thumb'>)) continue;
    const strokes = run.strokes.filter(s => fingerOf(s.key) === id);
    const hits = strokes.filter(s => s.correct).length;
    const key = fingerCourseId(id);
    // Exact ratio: 94.6% must not pass because the display rounds it to 95%.
    // Contiguous records retain all earned progress and cannot skip prerequisites.
    if (hits >= MIN_FINGER_HITS && hits * 100 >= strokes.length * FINGER_PASS_ACC && (progress[key] ?? 0) === level) {
      progress[key] = level + 1;
      newlyPassed.push(id);
    }
  }
  return { passed: pairCompleted(progress, pair) > level, newlyPassed };
}
