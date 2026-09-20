import { expect, it } from 'vitest';
import { MAIN_TRAILS, trailsInGrove } from '../curriculum';
import { METHODS, setMethod, DEFAULT_METHOD_ID } from '../curriculum/method';
import { fresh } from '../state/save';
import { KeyModel } from './keymodel';
import { applyRun, stageFor, trailUnlocked } from './progress';
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
      while (!state.trails[trail.id]?.cleared && runs < 35) {
        const stage = stageFor(trail, model, now);
        const text = generate(trail, stage, { seed: ++runs, heat: model.heatMap(now) });
        const run = new Run(text); run.begin(now);
        if (runs === 1 && trail.n % 3 === 0) {
          now += 1200; const miss = text[0] === 'f' ? 'j' : 'f'; run.type(miss, now); model.record(text[0]!, false, null, now, miss);
        }
        for (const ch of text) { now += ch === ' ' ? 1900 : 1200; run.type(ch, now); model.record(ch, true, ch === ' ' ? null : 1200, now); }
        const metrics = run.metrics(now);
        applyRun(state, model, { hits: run.hits, attempts: run.attempts, maxCombo: run.maxCombo, wpm: metrics.wpm, acc: metrics.acc, rhythm: run.rhythm(), now, stage });
        model.endRun(); total++;
      }
      expect(state.trails[trail.id]?.cleared, `${trail.id} stalled after ${runs} runs`).toBe(true);
    }
    expect(total).toBeGreaterThan(80);
    expect(total).toBeLessThan(300);
    expect(Object.values(state.trails).filter(p => p.cleared)).toHaveLength(40);
  } finally { setMethod(DEFAULT_METHOD_ID); }
});
