import { expect, it } from 'vitest';
import { MAIN_TRAILS, allowedChars, nextTrail, trailById } from './index';
import { FINGER_PAIRS, fingerCourseId, pairCompleted } from './finger-course';
import { STOPS, STOPS_PER_LESSON } from './stops';
import { completeFingerPractice, fingerPractice } from '../engine/finger-practice';
import { Run } from '../engine/run';
import { blockingStop, pendingStop, trailUnlocked } from '../engine/progress';
import { fresh, freshProgress } from '../state/save';

const at = (id: string) => MAIN_TRAILS.findIndex(t => t.id === id);

it('weaves all forty finger levels into the main path, in order, at most two after a lesson (DEC-20)', () => {
  expect(STOPS).toHaveLength(40);
  for (const pair of FINGER_PAIRS) {
    const mine = STOPS.filter(s => s.pair.id === pair.id);
    expect(mine.map(s => s.level)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let i = 1; i < mine.length; i++) expect(at(mine[i]!.after)).toBeGreaterThanOrEqual(at(mine[i - 1]!.after));
  }
  for (const t of MAIN_TRAILS) expect(STOPS.filter(s => s.after === t.id).length).toBeLessThanOrEqual(STOPS_PER_LESSON);
  expect(STOPS.some(s => s.after === MAIN_TRAILS.at(-1)!.id)).toBe(false);
  // Pinned: the first stops follow the lessons that teach their keys.
  expect(STOPS.slice(0, 3).map(s => [s.id, s.after])).toEqual([['stop-middle-1', 'inner-pair'], ['stop-middle-2', 'middle-up'], ['stop-index-1', 'index-reach']]);
});

it('every stop uses only keys its lesson has taught', () => {
  for (const stop of STOPS) {
    const i = at(stop.after);
    const known = new Set(MAIN_TRAILS.slice(0, i + 1).flatMap(t => [...t.newKeys]));
    const allowed = allowedChars(trailById(stop.after));
    for (const seed of [1, 2, 3]) {
      const text = fingerPractice(stop.pair, stop.level, {}, { known, seed }).text;
      const stray = [...new Set(text)].filter(k => !allowed.has(k));
      expect(stray, `${stop.id}: ${text}`).toEqual([]);
    }
  }
});

it('holds a fresh learner at a stop, never a learner already inside the next lesson, and shares credit with the finger course', () => {
  const s = fresh();
  for (const id of ['anchors', 'inner-pair']) s.trails[id] = { ...freshProgress(), runs: 1, cleared: true };
  s.trail = nextTrail(trailById('inner-pair'))!.id;
  expect(pendingStop(s)?.id).toBe('stop-middle-1');
  expect(trailUnlocked(s, trailById('middle-up'))).toBe(false);

  // A legacy learner who had already begun the lesson keeps going.
  const legacy = structuredClone(s); legacy.lessonSteps['middle-up'] = 1;
  expect(blockingStop(legacy, trailById('middle-up'))).toBeNull();
  expect(trailUnlocked(legacy, trailById('middle-up'))).toBe(true);

  // Passing the level on both sides — the same record the finger course keeps — clears the stop.
  const middle = FINGER_PAIRS.find(p => p.id === 'middle')!;
  for (const id of middle.sides) s.fingerCourses[fingerCourseId(id)] = 1;
  expect(pairCompleted(s.fingerCourses, middle)).toBe(1);
  expect(pendingStop(s)).toBeNull();
  expect(trailUnlocked(s, trailById('middle-up'))).toBe(true);
});

it('never traps a learner: a stop reached with earlier levels skipped still passes with a clean run (FIX-03)', () => {
  // A save from before the stops existed: lessons through X and Comma cleared, the next lesson not yet started,
  // and no finger-course record at all. The pending stop sits at level 3 of 10 for the middle fingers.
  const s = fresh();
  const upTo = MAIN_TRAILS.findIndex(t => t.id === 'middle-down');
  for (const t of MAIN_TRAILS.slice(0, upTo + 1)) { s.trails[t.id] = { ...freshProgress(), runs: 1, cleared: true }; if (t.id !== 'middle-down') s.lessonSteps[t.id] = 3; }
  s.trail = MAIN_TRAILS[upTo + 1]!.id;
  const stop = pendingStop(s)!;
  expect(stop.pair.id).toBe('middle');
  expect(stop.level).toBeGreaterThan(0);
  const known = new Set(MAIN_TRAILS.slice(0, upTo + 1).flatMap(t => [...t.newKeys]));
  const practice = fingerPractice(stop.pair, stop.level, s.fingerCourses, { known, seed: 1 });
  const run = new Run(practice.text); run.begin(0);
  let now = 0; for (const ch of practice.text) run.type(ch, (now += 300));
  expect(completeFingerPractice(s.fingerCourses, stop.pair, stop.level, practice, run).passed).toBe(true);
  expect(pairCompleted(s.fingerCourses, stop.pair)).toBe(stop.level + 1);
  expect(pendingStop(s)?.id).not.toBe(stop.id);
});
