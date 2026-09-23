import { describe, expect, it } from 'vitest';
import { trailById } from '../curriculum';
import { lessonExercises } from '../curriculum/lesson-flow';
import { fresh } from '../state/save';
import { KeyModel } from './keymodel';
import { PACE_NOTE, medianInterval, paceNoteApplies, relaxedIntervalMs, typedFast } from './pace';
import { applyRun } from './progress';
import { Run } from './run';

/** Type `text` perfectly with `ms` between presses. */
function typed(text: string, ms: number): Run {
  const run = new Run(text); let now = 1_000; run.begin(now);
  for (const c of text) { now += ms; run.type(c, now); }
  return run;
}
const middleUp = trailById('middle-up');

describe('pace note (PACE-01)', () => {
  it('fires well under the relaxed pace and not at a relaxed pace', () => {
    const text = 'ed de ded ed de ded fed feed';
    expect(relaxedIntervalMs(middleUp)).toBe(800); // Roots: 15 WPM
    expect(typedFast(typed(text, 60).strokes, middleUp)).toBe(true);
    expect(typedFast(typed(text, 500).strokes, middleUp)).toBe(false);
    expect(typedFast(typed(text, 390).strokes, middleUp)).toBe(true);
  });
  it('ignores boundaries, retries and pauses, and needs enough presses', () => {
    expect(medianInterval(typed('ed', 50).strokes)).toBeNull();
    const run = new Run('dede dede dede'); let now = 0; run.begin(now);
    for (const c of 'dede dede dede') { now += c === ' ' ? 5_000 : 100; run.type(c, now); }
    expect(medianInterval(run.strokes)).toBe(100);
  });
  it('applies to drills, loops and words in chapters 1–4 only', () => {
    const [find, loop, words, , phrase] = lessonExercises(trailById('ring-pair'));
    for (const e of [find!, loop!, words!]) expect(paceNoteApplies(trailById('ring-pair'), e), e.name).toBe(true);
    expect(paceNoteApplies(trailById('ring-pair'), phrase ?? lessonExercises(trailById('ring-pair')).at(-1)!)).toBe(false);
    expect(paceNoteApplies(trailById('roots-checkpoint'), lessonExercises(trailById('roots-checkpoint'))[0]!)).toBe(false);
    expect(paceNoteApplies(trailById('sentences'), lessonExercises(trailById('sentences'))[0]!)).toBe(false);
    expect(paceNoteApplies(trailById('common-words'), lessonExercises(trailById('common-words'))[0]!)).toBe(false);
  });
  it('never changes passing, stars or XP', () => {
    const text = 'ed de ded ed de ded fed feed';
    const outcomes = [60, 500].map((ms) => {
      const run = typed(text, ms), s = fresh();
      s.trail = 'middle-up';
      const m = run.metrics(run.end);
      const o = applyRun(s, new KeyModel(), { hits: run.hits, attempts: run.attempts, maxCombo: run.maxCombo, wpm: m.wpm, acc: m.acc, rhythm: run.rhythm(), now: run.end });
      return { passed: o.passed, stars: o.stars, xp: o.xp, cleared: s.lessonSteps['middle-up'] };
    });
    expect(outcomes[0]).toEqual(outcomes[1]);
  });
  it('says nothing numeric and claims nothing about the finger used', () => {
    expect(PACE_NOTE).not.toMatch(/\d|wpm/i);
    expect(PACE_NOTE).not.toMatch(/you used|wrong finger/i);
  });
});
