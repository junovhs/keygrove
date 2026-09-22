import { expect, it } from 'vitest';
import { MAIN_TRAILS, TRAILS, allowedChars, trailById } from './index';
import { lessonExercises } from './lesson-flow';
import { generate } from '../engine/textgen';
import { fresh, sanitize } from '../state/save';

it('visits above and below in the first two lessons, and practices the lower row in Roots', () => {
  const visits = MAIN_TRAILS.slice(0, 2).flatMap((t) => lessonExercises(t)).filter(e => e.assessment === 'guided').map(e => e.guidedKeys).join('');
  for (const k of 'ruvm') expect(visits).toContain(k);
  expect(trailById('core-words').newKeys).toBe('vm');
  expect(lessonExercises(trailById('core-words')).some(e => e.assessment !== 'guided' && generate(trailById('core-words'), e.stage, { exercise: e, seed: 2 }).includes('v'))).toBe(true);
});

it('bounds visits, introduces before assessment, and ends each finite lesson with assessed application', () => {
  for (const t of TRAILS) {
    const exercises = lessonExercises(t);
    expect(exercises.length).toBeLessThanOrEqual(5);
    expect(exercises.at(-1)!.assessment).toBeUndefined();
    if (t.newKeys || t.shift) expect(exercises[0]!.assessment).toBe('guided');
    for (const e of exercises.filter(e => e.assessment === 'guided')) {
      const unfamiliar = [...(e.guidedKeys ?? '')].filter(k => !allowedChars(t).has(k));
      expect(new Set(unfamiliar).size).toBeLessThanOrEqual(2);
      expect(e.text!.length).toBeLessThanOrEqual(32);
    }
  }
});

it('later transfer invites independent recall with metadata that keeps help available', () => {
  for (const t of MAIN_TRAILS.filter(t => t.grove === 'flow')) expect(lessonExercises(t).at(-1)!.guidance).toBe('on-demand');
  for (const t of MAIN_TRAILS.filter(t => t.grove === 'roots')) expect(lessonExercises(t).at(-1)!.guidance).toBeUndefined();
});

it('curriculum reauthoring retains stable completed identities and partial credited exercise counts', () => {
  const old = fresh();
  old.trail = 'core-words'; old.lessonSteps['core-words'] = 1;
  old.trails.anchors = { runs: 4, cleared: true, stars: 1, bestWpm: 8, bestAcc: 95, fails: 0, recent: [95], cleanStreak: 0 };
  old.trails['core-words'] = { ...old.trails.anchors, runs: 1, cleared: false };
  const s = sanitize(old);
  expect(s.trails.anchors!.cleared).toBe(true);
  expect(s.lessonSteps['core-words']).toBe(1);
  expect(s.trails['core-words']!.cleared).toBe(false);
  expect(s.trail).toBe('core-words');
});
