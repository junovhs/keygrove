import { describe, expect, it } from 'vitest';
import { bumpStreak, rankFor, starsFor, swiftBonus, xpFor } from './scoring';
import { gateFor, trailById } from '../curriculum';

describe('scoring', () => {
  const g = gateFor(trailById('anchors')); // pass 90 · swift 15
  it('stars come from accuracy and rhythm; speed is absent', () => {
    expect(starsFor(g, 89, 1)).toBe(0);
    expect(starsFor(g, 90, 0)).toBe(1);
    expect(starsFor(g, 96, 1)).toBe(1);
    expect(starsFor(g, 97, 0.59)).toBe(1);
    expect(starsFor(g, 97, 0.6)).toBe(2);
    expect(starsFor(g, 100, 0.79)).toBe(2);
    expect(starsFor(g, 100, 0.8)).toBe(3);
    expect(g).not.toHaveProperty('star2Wpm');
  });
  it('speed does not multiply learning rewards', () => {
    expect(swiftBonus(90, 15)).toBe(0);
    expect(xpFor(40, 100, 16, false, 0)).toBe(xpFor(40, 100, 16, false, 1));
  });
  it('ranks', () => {
    expect(rankFor(0)).toEqual({ name: 'Seed', next: 500 });
    expect(rankFor(2100)).toEqual({ name: 'Sapling', next: 6000 });
    expect(rankFor(99999)).toEqual({ name: 'Old Growth', next: null });
  });
  it('streak', () => {
    const t = Date.UTC(2026, 8, 18, 12), d = 86_400_000;
    expect(bumpStreak(0, '', t)).toEqual({ days: 1, lastDay: '2026-09-18' });
    expect(bumpStreak(3, '2026-09-17', t)).toEqual({ days: 4, lastDay: '2026-09-18' });
    expect(bumpStreak(3, '2026-09-18', t + 1000)).toEqual({ days: 3, lastDay: '2026-09-18' });
    expect(bumpStreak(3, '2026-09-10', t + d)).toEqual({ days: 1, lastDay: '2026-09-19' });
  });
});
