import { afterEach, expect, it, vi } from 'vitest';
import * as flow from '../curriculum/lesson-flow';
import { trailById } from '../curriculum';
import { fresh, sanitize } from '../state/save';
import { mergeProgress } from '../state/progress-sync';
import { KeyModel } from './keymodel';
import { TransitionModel } from './transitions';
import { Run } from './run';
import { recordPerformance } from './learning';
import { applyRun } from './progress';
import { generate } from './textgen';

afterEach(() => vi.restoreAllMocks());

it('guided mistakes and corrections leave key, confusion and transition evidence untouched', () => {
  const keys = new KeyModel(), transitions = new TransitionModel();
  const run = new Run('rv'); run.begin(100);
  for (const [i, key] of ['x', 'r', 'v'].entries()) {
    run.type(key, 200 + i * 100);
    recordPerformance(run, keys, transitions, 1000, run.text.length);
  }
  expect(run.status).toBe('complete');
  expect(keys.toJSON()).toEqual(new KeyModel().toJSON());
  expect(transitions.toJSON()).toEqual({});
});

it('the first assessed key after assistance has no cross-boundary timing or transition evidence', () => {
  const keys = new KeyModel(), transitions = new TransitionModel(), run = new Run('rif'); run.begin(100);
  for (const [i, key] of [...run.text].entries()) {
    run.type(key, 500 + i * 200); recordPerformance(run, keys, transitions, 1000, 1);
  }
  expect(keys.stat('r')).toBeUndefined();
  expect(keys.stat('i')?.seen).toBe(1);
  expect(transitions.toJSON().ri).toBeUndefined();
  expect(transitions.toJSON().if?.seen).toBe(1);
});

it('guided completion survives reload and sync without performance credit or a legacy auto-clear', () => {
  const s = fresh(), model = new KeyModel();
  const original = flow.lessonExercises(trailById('anchors'));
  vi.spyOn(flow, 'lessonExercises').mockReturnValue([{ ...original[0]!, assessment: 'guided' }, ...original.slice(1)]);
  const before = structuredClone(s.stats);
  const result = applyRun(s, model, { hits: 16, attempts: 80, acc: 20, wpm: 1, maxCombo: 2, rhythm: 0, now: 1000 });
  expect(result).toMatchObject({ passed: true, firstClear: false, stars: 0, xp: 0 });
  expect(s.stats).toEqual(before);
  expect(s.trails.anchors).toMatchObject({ runs: 0, bestAcc: 0, bestWpm: 0, recent: [], cleared: false, fails: 0 });
  const restored = mergeProgress(fresh(), sanitize(JSON.parse(JSON.stringify(s))));
  expect(restored.lessonSteps.anchors).toBe(1);
  expect(restored.trails.anchors?.cleared).toBe(false);
});

it('authored guided text can explicitly introduce a reach but cannot leak it into assessed text', () => {
  const trail = trailById('anchors');
  const exercise: flow.LessonExercise = { name: 'Visit R', stage: 'drill', format: 'movement', length: 8, instruction: 'Try R.', text: 'frfr', assessment: 'guided', guidedKeys: 'r' };
  expect(generate(trail, 'drill', { exercise })).toBe('frfr');
  expect(() => generate(trail, 'drill', { exercise: { ...exercise, assessment: undefined } })).toThrow();
  expect(() => generate(trail, 'drill', { exercise: { ...exercise, text: 'fqfq' } })).toThrow();
});
