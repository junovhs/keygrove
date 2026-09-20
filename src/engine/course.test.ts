import { lessonExercises } from '../curriculum/lesson-flow';
import { expect, it } from 'vitest';
import { MAIN_TRAILS, gateFor, trailsInGrove } from '../curriculum';
import { METHODS, setMethod, DEFAULT_METHOD_ID } from '../curriculum/method';
import { fresh } from '../state/save';
import { KeyModel } from './keymodel';
import { applyRun, currentStage, exerciseIndex, trailUnlocked } from './progress';
import { generate } from './textgen';
import { Run } from './run';

for (const method of METHODS) it(`${method.name}: the complete course and optional branch can be learned slowly, with recoverable mistakes`, () => {
  setMethod(method.id);
  try {
    const state = fresh(), model = new KeyModel();
    let now = 1_700_000_000_000, total = 0;
    const path = [...MAIN_TRAILS, ...trailsInGrove('code')];
    for (const trail of path) {
      if (trail.id === 'braces') { state.settings.codeGrove = true; state.trail = trail.id; }
      expect(state.trail).toBe(trail.id);
      expect(trailUnlocked(state, trail)).toBe(true);
      let runs = 0;
      while (!state.trails[trail.id]?.cleared && runs < lessonExercises(trail).length + 1) {
        const stage = currentStage(state, model, now);
        const text = generate(trail, stage, { seed: ++runs, heat: model.heatMap(now), exercise: lessonExercises(trail)[exerciseIndex(state)] });
        const run = new Run(text); run.begin(now);
        if (runs === 1 && trail.n % 3 === 0) {
          now += 1200; const miss = text[0] === 'f' ? 'j' : 'f'; run.type(miss, now); model.record(text[0]!, false, null, now, miss);
        }
        for (const ch of text) { now += ch === ' ' ? 1900 : 1200; run.type(ch, now); model.record(ch, true, ch === ' ' ? null : 1200, now); }
        const metrics = run.metrics(now);
        const outcome = applyRun(state, model, { hits: run.hits, attempts: run.attempts, maxCombo: run.maxCombo, wpm: metrics.wpm, acc: metrics.acc, rhythm: run.rhythm(), now, stage });
        const passed = metrics.acc >= (trail.checkpoint ? 97 : gateFor(trail).passAcc);
        expect(outcome.passed, `${trail.id}: passing must immediately advance an exercise`).toBe(passed);
        if (passed) expect(state.lessonSteps[trail.id]).toBe(runs);
        model.endRun(); total++;
      }
      expect(state.trails[trail.id]?.cleared, `${trail.id} stalled after ${runs} runs`).toBe(true);
    }
    expect(total).toBeGreaterThanOrEqual(40);
    expect(total).toBeLessThanOrEqual(160);
    expect(Object.values(state.trails).filter(p => p.cleared)).toHaveLength(40);
  } finally { setMethod(DEFAULT_METHOD_ID); }
});
