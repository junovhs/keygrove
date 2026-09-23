import { afterEach, expect, it } from 'vitest';
import { FINGER_PAIRS, fingerCourseId, pairCompleted, FINGER_LEVEL_COUNT, fingerLevels } from '../curriculum/finger-course';
import { DEFAULT_METHOD_ID, METHODS, fingerOf, setMethod } from '../curriculum/method';
import { fingerById } from '../curriculum/fingers';
import { fresh, sanitize } from '../state/save';
import { mergeProgress } from '../state/progress-sync';
import { Run } from './run';
import { completeFingerPractice, fingerPractice, MIN_FINGER_HITS, type FingerPractice } from './finger-practice';

const index = FINGER_PAIRS[0]!;
afterEach(() => setMethod(DEFAULT_METHOD_ID));
function typePassage(text: string, misses: Record<string, number> = {}): Run {
  const run = new Run(text);
  let time = 1;
  run.begin(time);
  for (const key of text) {
    const id = fingerOf(key) ?? '';
    for (let i = 0; i < (misses[id] ?? 0); i++) run.type(key === 'j' ? 'f' : 'j', time += 200);
    delete misses[id];
    run.type(key, time += 200);
  }
  return run;
}

it('does not let high overall accuracy carry the weaker side, then targets only that side', () => {
  const progress: Record<string, number> = {};
  const practice = fingerPractice(index, 0, progress);
  const run = typePassage(practice.text, { li: 2 });
  expect(run.metrics(10000).acc).toBeGreaterThanOrEqual(95);
  expect(completeFingerPractice(progress, index, 0, practice, run)).toEqual({ passed: false, newlyPassed: ['ri'] });
  expect(pairCompleted(progress, index)).toBe(0);
  const retry = fingerPractice(index, 0, progress);
  expect(retry.sides).toEqual(['li']);
  expect([...retry.text].every(k => k === ' ' || fingerOf(k) === 'li')).toBe(true);
  expect(completeFingerPractice(progress, index, 0, retry, typePassage(retry.text)).passed).toBe(true);
  expect(pairCompleted(progress, index)).toBe(1);
  expect(fingerPractice(index, 1, progress).sides).toEqual(['li', 'ri']);
});

it('qualifies the left independently when the right misses, using wanted rather than typed keys', () => {
  const progress: Record<string, number> = {};
  const practice = fingerPractice(index, 0, progress);
  // Misses on J are typed F; they must be charged to the right, not the left.
  const result = completeFingerPractice(progress, index, 0, practice, typePassage(practice.text, { ri: 2 }));
  expect(result).toEqual({ passed: false, newlyPassed: ['li'] });
  expect(fingerPractice(index, 0, progress).sides).toEqual(['ri']);
});

it('requires sufficient evidence and an exact 95% ratio', () => {
  for (const [hits, misses, qualifies] of [[19, 0, false], [20, 0, true], [38, 2, true], [35, 2, false]] as const) {
    const progress: Record<string, number> = {};
    const practice: FingerPractice = { text: 'f'.repeat(hits), sides: ['li'], helperKeys: [] };
    completeFingerPractice(progress, index, 0, practice, typePassage(practice.text, { li: misses }));
    expect(progress[fingerCourseId('li')] === 1).toBe(qualifies);
    expect(progress[fingerCourseId('ri')]).toBeUndefined();
  }
});

it('never credits an aborted run or a different passage; a clean later level credits the ones before it (FIX-03)', () => {
  const progress: Record<string, number> = {};
  const practice = fingerPractice(index, 0, progress);
  const aborted = new Run(practice.text); aborted.begin(1);
  for (const k of practice.text.slice(0, -1)) aborted.type(k, 100);
  expect(completeFingerPractice(progress, index, 0, practice, aborted).passed).toBe(false);
  expect(completeFingerPractice(progress, index, 0, practice, typePassage('f'.repeat(40))).passed).toBe(false);
  expect(progress).toEqual({});
  const skipped = fingerPractice(index, 3, progress);
  expect(completeFingerPractice(progress, index, 3, skipped, typePassage(skipped.text)).passed).toBe(true);
  expect(pairCompleted(progress, index)).toBe(4);
});

for (const method of METHODS) it(`all paired levels are passable with enough complete coverage under ${method.name}`, () => {
  setMethod(method.id);
  for (const pair of FINGER_PAIRS) {
    const progress: Record<string, number> = {};
    for (let level = 0; level < FINGER_LEVEL_COUNT; level++) {
      const practice = fingerPractice(pair, level, progress);
      for (const id of pair.sides) {
        expect([...practice.text].filter(k => fingerOf(k) === id).length).toBeGreaterThanOrEqual(MIN_FINGER_HITS);
        if (level === 9) for (let n = 33; n <= 126; n++) {
          const key = String.fromCharCode(n);
          if (fingerOf(key) === id) expect(practice.text).toContain(key);
        }
      }
      expect(completeFingerPractice(progress, pair, level, practice, typePassage(practice.text)).passed).toBe(true);
      expect(pairCompleted(progress, pair)).toBe(level + 1);
    }
    const replay = fingerPractice(pair, 0, progress);
    expect(replay.sides).toEqual(pair.sides);
    completeFingerPractice(progress, pair, 0, replay, typePassage(replay.text, { [pair.sides[0]]: 50 }));
    expect(pairCompleted(progress, pair)).toBe(10); // Replay never takes away earned work.
  }
});

it('retains partial passes through reload and sync without making progress visible as separate courses', () => {
  const local = fresh(), remote = fresh();
  const practice = fingerPractice(index, 0, local.fingerCourses);
  completeFingerPractice(local.fingerCourses, index, 0, practice, typePassage(practice.text, { li: 2 }));
  const reloaded = sanitize(JSON.parse(JSON.stringify(local)));
  expect(pairCompleted(reloaded.fingerCourses, index)).toBe(0);
  expect(fingerPractice(index, 0, reloaded.fingerCourses).sides).toEqual(['li']);
  completeFingerPractice(remote.fingerCourses, index, 0, practice, typePassage(practice.text, { ri: 2 }));
  const merged = mergeProgress(reloaded, remote);
  expect(pairCompleted(merged.fingerCourses, index)).toBe(1);
  expect(merged.trail).toBe('anchors'); expect(merged.trails).toEqual({});
});

it('preserves older unequal side courses and only makes their shared levels available', () => {
  const save = sanitize({ fingerCourses: { [fingerCourseId('li')]: 10, [fingerCourseId('ri')]: 3 } });
  expect(pairCompleted(save.fingerCourses, index)).toBe(3);
  expect(fingerPractice(index, 3, save.fingerCourses).sides).toEqual(['ri']);
  expect(fingerPractice(index, 2, save.fingerCourses).sides).toEqual(['li', 'ri']);
});
