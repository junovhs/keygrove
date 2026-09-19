import { describe, expect, it } from 'vitest';
import { fresh } from '../state/save';
import { applyRun, currentStage, currentTrail, focusKeys, groveOpen, stageFor, trailUnlocked, MIN_RUNS } from './progress';
import { KeyModel, MASTERED } from './keymodel';
import { trailById } from '../curriculum';

const T0 = 1_700_000_000_000;
const run = (wpm: number, acc: number, now = T0) => ({ hits: 40, attempts: Math.round(40 / (acc / 100)), maxCombo: 16, wpm, acc, now });
/** One perfect-ish run's worth of presses on `keys`. */
const practise = (m: KeyModel, keys: string, perKey = 10, acc = 1, now = T0) => { for (const k of keys) for (let i = 0; i < perKey; i++) m.record(k, (i % 100) / 100 >= 1 - acc, 300 + ((i * 37) % 61) - 30, now + i * 400); };

describe('mastery-gated progress', () => {
  it('Anchors needs ≥ 5 perfect runs; stage follows mastery (drill → mix → words)', () => {
    const s = fresh(); const m = new KeyModel();
    expect(stageFor(currentTrail(s), m)).toBe('drill');
    let clearedOn = 0; const stages: string[] = [];
    for (let i = 1; i <= 10 && !clearedOn; i++) {
      const now = T0 + i * 60_000;
      practise(m, 'fj ', 10, 1, now);
      const o = applyRun(s, m, run(20, 100, now));
      stages.push(currentStage(s, m, now));
      if (o.firstClear) clearedOn = i; else expect(o.blockers.length).toBeGreaterThan(0);
    }
    expect(clearedOn).toBeGreaterThanOrEqual(5);
    expect(clearedOn).toBeLessThanOrEqual(8);
    expect(stages[0]).toBe('drill');
    expect(stages.includes('mix')).toBe(true);
    expect(s.trail).toBe('inner-pair');
    expect(s.trails['anchors']).toMatchObject({ cleared: true, runs: clearedOn });
  });
  it('sloppy runs never clear: blockers name the keys and their mastery', () => {
    const s = fresh(); const m = new KeyModel();
    for (let i = 1; i <= 12; i++) { practise(m, 'fj ', 10, 0.8, T0 + i * 60_000); applyRun(s, m, run(20, 91, T0 + i * 60_000)); }
    const o = applyRun(s, m, run(20, 91, T0 + 13 * 60_000));
    expect(o.passed).toBe(true);
    expect(o.firstClear).toBe(false);
    expect(o.blockers.join(' ')).toMatch(/F \d+%/);
    expect(s.trails['anchors']!.cleared).toBe(false);
  });
  it('two passed runs in a row are required even with mastered keys', () => {
    const s = fresh(); const m = new KeyModel(); practise(m, 'fj ', 80, 1);
    applyRun(s, m, run(20, 100)); applyRun(s, m, run(20, 100)); applyRun(s, m, run(20, 100));
    let o = applyRun(s, m, run(20, 80));
    expect(o.firstClear).toBe(false);
    o = applyRun(s, m, run(20, 100));
    expect(o.blockers).toEqual(['two passed runs in a row']);
    o = applyRun(s, m, run(20, 100));
    expect(o.firstClear).toBe(true);
    expect(s.trails['anchors']!.runs).toBe(MIN_RUNS + 2);
  });
  it('checkpoint focus = 5 weakest unlocked keys; ★ clears but ★★ opens the grove', () => {
    const s = fresh(); const m = new KeyModel(); s.trail = 'roots-checkpoint';
    for (const k of 'asdfghjkl; ') practise(m, k, 80, 1);
    expect(focusKeys(trailById('roots-checkpoint'), m)).toHaveLength(5);
    for (let i = 0; i < MIN_RUNS - 1; i++) applyRun(s, m, run(10, 95));
    let o = applyRun(s, m, run(10, 95));
    expect(o).toMatchObject({ firstClear: true, needsTwoStars: true, nextTrail: null });
    expect(groveOpen(s, 'canopy')).toBe(false);
    o = applyRun(s, m, run(16, 98));
    expect(o).toMatchObject({ stars: 2, advance: 'grove' });
    expect(o.nextTrail?.id).toBe('middle-up');
    expect(trailUnlocked(s, trailById('middle-up'))).toBe(true);
  });
  it('slow mode after 3 fails; mastery threshold is exported', () => {
    const s = fresh(); const m = new KeyModel();
    applyRun(s, m, run(5, 50)); applyRun(s, m, run(5, 50));
    expect(applyRun(s, m, run(5, 50)).slowOffer).toBe(true);
    expect(MASTERED).toBe(0.8);
  });
});
