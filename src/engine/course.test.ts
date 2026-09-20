import { expect, it } from 'vitest';
import { MAIN_TRAILS } from '../curriculum';
import { fresh } from '../state/save';
import { KeyModel } from './keymodel';
import { applyRun, stageFor, trailUnlocked } from './progress';
import { generate } from './textgen';

it('the complete generated course can be learned at an unhurried pace without a coverage dead end', () => {
  const state = fresh(), model = new KeyModel();
  let now = 1_700_000_000_000, total = 0;
  for (const trail of MAIN_TRAILS) {
    expect(state.trail).toBe(trail.id);
    expect(trailUnlocked(state, trail)).toBe(true);
    let runs = 0;
    while (!state.trails[trail.id]?.cleared && runs < 35) {
      const stage = stageFor(trail, model, now);
      const text = generate(trail, stage, { seed: ++runs, heat: model.heatMap(now) });
      for (const ch of text) { now += ch === ' ' ? 1900 : 1200; model.record(ch, true, ch === ' ' ? null : 1200, now); }
      applyRun(state, model, { hits: text.length, attempts: text.length, maxCombo: text.length, wpm: 8, acc: 100, rhythm: 0.2, now, stage });
      model.endRun(); total++;
    }
    expect(state.trails[trail.id]?.cleared, `${trail.id} stalled after ${runs} runs`).toBe(true);
  }
  expect(total).toBeGreaterThan(72);
  expect(total).toBeLessThan(300);
  expect(Object.values(state.trails).filter(p => p.cleared)).toHaveLength(36);
});
