import { describe, expect, it } from 'vitest';
import { fresh } from '../state/save';
import { applyRun, currentStage, currentTrail, groveOpen, trailUnlocked } from './progress';
import { trailById } from '../curriculum';

const run = (wpm: number, acc: number, now = 1_700_000_000_000) => ({ hits: 40, attempts: Math.round(40 / (acc / 100)), maxCombo: 16, wpm, acc, now });

describe('progress', () => {
  it('walks drill → mix → words → next trail on passes; fails stay put and count', () => {
    const s = fresh();
    expect(currentTrail(s).id).toBe('anchors');
    expect(currentStage(s)).toBe('drill');
    let o = applyRun(s, run(10, 95));
    expect(o).toMatchObject({ passed: true, stars: 1, advance: 'stage' });
    expect(currentStage(s)).toBe('mix');
    o = applyRun(s, run(10, 80));
    expect(o).toMatchObject({ passed: false, stars: 0, advance: 'none' });
    expect(s.trails['anchors']!.fails).toBe(1);
    applyRun(s, run(10, 95)); // mix
    o = applyRun(s, run(20, 100)); // words, ★★★
    expect(o).toMatchObject({ passed: true, stars: 3, firstClear: true, advance: 'trail' });
    expect(o.nextTrail?.id).toBe('inner-pair');
    expect(s.trail).toBe('inner-pair');
    expect(s.trails['anchors']).toMatchObject({ stage: 3, stars: 3, fails: 0 });
  });
  it('checkpoint with ★ clears but does not open the next grove; ★★ does', () => {
    const s = fresh();
    s.trail = 'roots-checkpoint';
    s.trails['roots-checkpoint'] = { stage: 2, stars: 0, bestWpm: 0, bestAcc: 0, fails: 0 };
    let o = applyRun(s, run(10, 95));
    expect(o).toMatchObject({ passed: true, stars: 1, advance: 'trail', needsTwoStars: true, nextTrail: null });
    expect(s.trail).toBe('roots-checkpoint');
    expect(groveOpen(s, 'canopy')).toBe(false);
    o = applyRun(s, run(16, 98));
    expect(o).toMatchObject({ stars: 2, advance: 'grove', needsTwoStars: false });
    expect(o.nextTrail?.id).toBe('middle-up');
    expect(groveOpen(s, 'canopy')).toBe(true);
    expect(trailUnlocked(s, trailById('middle-up'))).toBe(true);
    expect(trailUnlocked(s, trailById('index-up'))).toBe(false);
  });
  it('three straight fails offer slow mode; slow mode lowers speed targets only', () => {
    const s = fresh();
    applyRun(s, run(5, 50)); applyRun(s, run(5, 50));
    const o = applyRun(s, run(5, 50));
    expect(o.slowOffer).toBe(true);
    s.settings.slowMode = true;
    expect(applyRun(s, run(11, 97)).stars).toBe(2); // 15×0.7 ≈ 11
    expect(applyRun(s, run(60, 89)).stars).toBe(0);
  });
  it('xp, streak and bests accumulate', () => {
    const s = fresh();
    const day = 86_400_000, t0 = Date.UTC(2026, 8, 18, 12);
    applyRun(s, run(20, 100, t0));
    expect(s.stats.days).toBe(1);
    applyRun(s, run(20, 100, t0 + day));
    expect(s.stats.days).toBe(2);
    applyRun(s, run(20, 100, t0 + 5 * day));
    expect(s.stats.days).toBe(1);
    expect(s.stats.runs).toBe(3);
    expect(s.stats.xp).toBeGreaterThan(100);
    expect(s.stats.bestWpm).toBe(20);
  });
  it('the code grove needs the setting and a ★★ bark checkpoint', () => {
    const s = fresh();
    s.trails['bark-checkpoint'] = { stage: 3, stars: 2, bestWpm: 0, bestAcc: 0, fails: 0 };
    expect(groveOpen(s, 'code')).toBe(false);
    s.settings.codeGrove = true;
    expect(groveOpen(s, 'code')).toBe(true);
  });
});
