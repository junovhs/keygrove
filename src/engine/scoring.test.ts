import { describe, expect, it } from 'vitest';
import { bumpStreak, effectiveGate, rankFor, starsFor, xpFor } from './scoring';
import { gateFor, trailById } from '../curriculum';

describe('scoring', () => {
  const g = gateFor(trailById('anchors')); // 90 / 15 / 18
  it('star table', () => {
    expect(starsFor(g, 100, 89)).toBe(0);
    expect(starsFor(g, 5, 90)).toBe(1);
    expect(starsFor(g, 14, 100)).toBe(1);
    expect(starsFor(g, 15, 96)).toBe(1);
    expect(starsFor(g, 15, 97)).toBe(2);
    expect(starsFor(g, 30, 99)).toBe(2);
    expect(starsFor(g, 17, 100)).toBe(2);
    expect(starsFor(g, 18, 100)).toBe(3);
  });
  it('slow mode scales speed, not accuracy', () => {
    expect(effectiveGate(g, true)).toEqual({ ...g, star2Wpm: 11, star3Wpm: 13 });
    expect(effectiveGate(g, false)).toBe(g);
  });
  it('xp squares accuracy and rewards first clears', () => {
    expect(xpFor(40, 100, 16, false)).toBe(44);
    expect(xpFor(40, 50, 0, false)).toBe(10);
    expect(xpFor(40, 100, 16, true)).toBe(66);
    expect(xpFor(1, 10, 0, false)).toBe(5);
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
