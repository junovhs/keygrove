import { afterEach, expect, it } from 'vitest';
import { MAIN_TRAILS, TRAILS, allowedChars, trailById } from '../curriculum';
import { lessonExercises } from '../curriculum/lesson-flow';
import { DEFAULT_METHOD_ID, METHODS, fingerOf, setMethod } from '../curriculum/method';
import { FINGER_PAIRS } from '../curriculum/finger-course';
import { PRACTICE_WORDS, readablePhrases } from '../curriculum/language';
import { generate } from './textgen';
import { fingerPractice } from './finger-practice';
afterEach(() => setMethod(DEFAULT_METHOD_ID));

it('every planned course exercise covers its focus using only taught keys, at a bounded length', () => {
  for (const method of METHODS) {
    setMethod(method.id);
    for (const trail of TRAILS) for (const exercise of lessonExercises(trail)) for (let seed = 0; seed < 10; seed++) {
      const text = generate(trail, exercise.stage, { exercise, seed });
      expect([...text].every(k => allowedChars(trail).has(k)), `${trail.id}/${exercise.name}: ${text}`).toBe(true);
      expect(text.length).toBeGreaterThan(6);
      expect(text.length, `${trail.id}/${exercise.name}/${seed}: ${text}`).toBeLessThan(trail.length * 2 + 100);
      for (const k of trail.newKeys) expect(text.toLowerCase(), `${trail.id}/${exercise.name}`).toContain(k);
      expect(text).not.toContain('  ');
    }
  }
});
it('introduces Space deliberately after the first three short landmark exercises', () => {
  const t = trailById('anchors'), exercises = lessonExercises(t);
  for (const exercise of exercises.slice(0, 3)) {
    const text = generate(t, exercise.stage, { exercise, seed: 3 });
    expect(text).toMatch(/^[fj]+$/); expect(text.length).toBeLessThanOrEqual(30);
  }
  const last = exercises[3]!;
  const text = generate(t, last.stage, { exercise: last, seed: 3 });
  expect(text).toContain(' ');
  expect(text.split(' ').slice(0, -1).every(w => w.length === 6)).toBe(true);
});
it('guarantees real words with E/I and G/H and constrained phrases with G/H', () => {
  for (const id of ['middle-up', 'index-reach']) {
    const t = trailById(id), ex = lessonExercises(t)[2]!;
    const text = generate(t, ex.stage, { exercise: ex, seed: 2 });
    expect(text.split(' ').every(w => PRACTICE_WORDS.includes(w))).toBe(true);
    expect(text).not.toMatch(/\b(iii|diff|ref)\b/);
  }
  const t = trailById('index-reach'), ex = lessonExercises(t)[3]!;
  const text = generate(t, ex.stage, { exercise: ex, seed: 7 });
  expect(readablePhrases(allowedChars(t)).some(p => text.includes(p))).toBe(true);
});
it('paired words use learned pair letters; phrases disclose unfamiliar helper keys', () => {
  for (const method of METHODS) {
    setMethod(method.id);
    for (const pair of FINGER_PAIRS) {
      for (const level of [3, 4]) {
        const p = fingerPractice(pair, level, {}, { seed: 3 });
        expect(p.helperKeys).toEqual([]);
        expect(p.text.split(' ').every(w => PRACTICE_WORDS.includes(w))).toBe(true);
        expect([...p.text].every(k => k === ' ' || pair.sides.some(id => fingerOf(k) === id))).toBe(true);
        expect(p.text.length).toBeLessThan(240);
      }
      const p = fingerPractice(pair, 5, {}, { seed: 2 });
      expect([...p.text].every(k => k === ' ' || pair.sides.some(id => fingerOf(k) === id) || p.helperKeys.includes(k))).toBe(true);
      const familiar = fingerPractice(pair, 5, {}, { known: new Set(p.helperKeys), seed: 2 });
      expect(familiar.helperKeys).toEqual([]);
      expect(fingerPractice(pair, 9, {}, { seed: 2 }).text).toMatch(/[A-Z][a-z ]+\./);
    }
  }
});
it('paired movement practice avoids an exhaustive bigram dump and has no Space in its landmark run', () => {
  const pair = FINGER_PAIRS[0]!;
  expect(fingerPractice(pair, 0, {}).text).toMatch(/^[fj]+$/);
  for (const level of [1, 2]) {
    const text = fingerPractice(pair, level, {}).text;
    expect(text.length).toBeLessThan(140);
    expect(text.split(' ').filter(w => w.length <= 2).length).toBeLessThan(3);
  }
});
it('main path reserves a majority of planned exercises for language/application', () => {
  const exercises = MAIN_TRAILS.flatMap(lessonExercises);
  const meaningful = exercises.filter(e => e.format !== 'movement');
  expect(meaningful.length).toBeGreaterThan(exercises.length / 2);
});
