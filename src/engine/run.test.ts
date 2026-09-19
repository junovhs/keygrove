import { describe, expect, it } from 'vitest';
import { Run } from './run';

const play = (text: string, gaps: number[]) => { const r = new Run(text); let t = 1000; r.begin(t); [...text].forEach((c, i) => { t += gaps[i % gaps.length]!; r.type(c, t); }); return r; };

describe('Run.rhythm', () => {
  it('slow and even scores as well as fast and even', () => {
    const slow = play('fjfjfjfjfjfjfjfj', [900, 920, 880, 910]);
    const fast = play('fjfjfjfjfjfjfjfj', [180, 190, 170, 185]);
    expect(slow.rhythm()).toBeGreaterThan(0.85);
    expect(Math.abs(slow.rhythm() - fast.rhythm())).toBeLessThan(0.05);
  });
  it('bursts then pauses score low', () => {
    const bursty = play('fjfjfjfjfjfjfjfj', [120, 120, 900, 120, 120, 1100]);
    expect(bursty.rhythm()).toBeLessThan(0.5);
  });
  it('needs a few strokes; the first key never counts', () => {
    expect(play('fj', [5000, 200]).rhythm()).toBe(0);
    const r = play('fjfjfjfj', [5000, 300, 300, 300, 300, 300, 300, 300]);
    expect(r.rhythm()).toBeGreaterThan(0.5);
  });
});
