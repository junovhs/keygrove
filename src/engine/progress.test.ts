import { describe, expect, it } from 'vitest';
import { fresh } from '../state/save';
import { applyRun, currentTrail, groveOpen, stageFor } from './progress';
import { KeyModel } from './keymodel';

const T = 1_700_000_000_000;
const sample = (acc = 100) => ({ hits: 40, attempts: 40, maxCombo: 40, wpm: 8, acc, rhythm: 0.2, now: T, stage: 'drill' as const });
describe('a visible pass means progress', () => {
  it('advances after the very first passage at 90%, even with no mastery or words-stage evidence', () => {
    const s = fresh(), m = new KeyModel();
    expect(stageFor(currentTrail(s), m, T)).toBe('drill');
    expect(applyRun(s, m, sample(90))).toMatchObject({ passed: true, firstClear: true, blockers: [] });
    expect(s.trail).toBe('inner-pair');
    expect(s.trails.anchors!.runs).toBe(1);
  });
  it('explains the exact accuracy shortfall, then advances on the first successful retry', () => {
    const s = fresh(), m = new KeyModel();
    expect(applyRun(s, m, sample(89))).toMatchObject({ passed: false, firstClear: false, blockers: ['89% accuracy; 90% needed to continue'] });
    expect(s.trail).toBe('anchors');
    expect(applyRun(s, m, sample(90)).firstClear).toBe(true);
    expect(s.trail).toBe('inner-pair');
  });
  it('does not let old errors, slow timing or low key mastery veto a passing passage', () => {
    const s = fresh(), m = new KeyModel();
    for (let i = 0; i < 50; i++) m.record('f', false, null, T, 'j');
    expect(m.mastery('f', T)).toBe(0);
    expect(applyRun(s, m, { ...sample(95), wpm: 1, rhythm: 0 }).firstClear).toBe(true);
    expect(s.trail).toBe('inner-pair');
  });
  it('a checkpoint generates a cumulative passage and requires exactly 97%, never speed or repeats', () => {
    const s = fresh(), m = new KeyModel(); s.trail = 'roots-checkpoint';
    expect(stageFor(currentTrail(s), m, T)).toBe('words');
    expect(applyRun(s, m, sample(96))).toMatchObject({ passed: false, firstClear: false });
    expect(groveOpen(s, 'home')).toBe(false);
    expect(applyRun(s, m, sample(97))).toMatchObject({ passed: true, firstClear: true, advance: 'grove' });
    expect(groveOpen(s, 'home')).toBe(true);
  });
  it('a failed replay and absence never revoke a clear', () => {
    const s = fresh(), m = new KeyModel();
    applyRun(s, m, sample());
    s.trail = 'anchors';
    applyRun(s, m, { ...sample(20), now: T + 90 * 86400000 });
    expect(s.trails.anchors!.cleared).toBe(true);
    expect(groveOpen(s, 'home')).toBe(false);
  });
});
