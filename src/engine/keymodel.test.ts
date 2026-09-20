import { describe, expect, it } from 'vitest';
import { KeyModel, MASTERED, VOLUME } from './keymodel';

const T0 = 1_700_000_000_000;
/** Simulate presses: `acc` fraction correct, latency drawn from base ± jitter, optional spike every n presses. */
function sim(m: KeyModel, key: string, n: number, acc: number, base = 300, jitter = 40, spikeEvery = 0, now = T0) {
  for (let i = 0; i < n; i++) {
    const correct = ((i * 13) % 100) / 100 >= 1 - acc; // deterministic, spread out
    const lat = base + ((i * 37) % (2 * jitter + 1)) - jitter + (spikeEvery && i % spikeEvery === spikeEvery - 1 ? base * 2 : 0);
    m.record(key, correct, lat, now + i * 1000, correct ? undefined : 'x');
  }
}
const warm = (m: KeyModel, keys: string) => { for (const k of keys) sim(m, k, 30, 1); };

describe('KeyModel mastery', () => {
  it('requires repeated accurate evidence before a key is ready', () => {
    const m = new KeyModel(); warm(m, 'asdjkl');
    const runs: number[] = [];
    for (let run = 1; run <= 10; run++) { sim(m, 'f', 10, 1, 300, 30, 0, T0 + run * 60_000); runs.push(m.mastery('f', T0 + run * 60_000)); }
    const firstMastered = runs.findIndex((v) => v >= MASTERED) + 1;
    expect(firstMastered).toBeGreaterThanOrEqual(2);
    expect(firstMastered).toBeLessThanOrEqual(6);
    expect(m.stat('f')!.hits).toBeGreaterThanOrEqual(VOLUME);
  });
  it('80% accuracy never masters, whatever the volume', () => {
    const m = new KeyModel(); warm(m, 'asdjkl');
    let peak = 0;
    for (let i = 0; i < 20; i++) { sim(m, 'k', 10, 0.8, 300, 40, 0, T0 + i * 10_000); peak = Math.max(peak, m.mastery('k', T0 + i * 10_000 + 10_000)); }
    expect(peak).toBeLessThan(MASTERED);
    expect(m.accuracy('k')).toBeLessThan(0.93);
    const sp = new KeyModel(); warm(sp, 'asdjkl'); for (let i = 0; i < 60; i++) sp.record(' ', true, i % 2 ? 900 : 200, T0 + i * 1000);
    expect(sp.mastery(' ', T0 + 100_000)).toBeGreaterThanOrEqual(MASTERED); // space: uneven timing is fine
  });
  it('speed is not a factor: slow but steady masters like fast and steady', () => {
    const slow = new KeyModel(); warm(slow, 'asdjkl'); sim(slow, 'f', 80, 1, 900, 40);
    const fast = new KeyModel(); warm(fast, 'asdjkl'); sim(fast, 'f', 80, 1, 250, 15);
    const now = T0 + 100_000;
    expect(slow.mastery('f', now)).toBeGreaterThanOrEqual(MASTERED);
    expect(Math.abs(slow.mastery('f', now) - fast.mastery('f', now))).toBeLessThan(0.1);
  });
  it('burst-then-pause rhythm (searching) is advisory and shows up in searching()', () => {
    const m = new KeyModel(); warm(m, 'asdjkl');
    sim(m, 'f', 80, 1, 300, 30, 2); // a search pause every 2nd press
    expect(m.rhythm('f')).toBeLessThan(0.6);
    expect(m.mastery('f', T0 + 100_000)).toBeGreaterThanOrEqual(MASTERED);
    expect(m.searching('asdfjkl')[0]?.key).toBe('f');
    const steady = new KeyModel(); warm(steady, 'asdjkl'); sim(steady, 'f', 80, 1, 300, 30);
    expect(steady.searching('asdfjkl')).toEqual([]);
  });
  it('confusions accumulate per wanted→typed and decay per run', () => {
    const m = new KeyModel();
    for (let i = 0; i < 4; i++) m.record('k', false, 300, T0, 'd');
    m.record('k', false, 300, T0, 'j');
    expect(m.confusions(4)).toEqual([{ wanted: 'k', typed: 'd', count: 4 }]);
    for (let i = 0; i < 12; i++) m.endRun();
    expect(m.confusions(4)).toEqual([]);
  });
  it('mastery remains past the review date and the key becomes due; a correct review doubles the interval', () => {
    const m = new KeyModel(); warm(m, 'asdjkl'); sim(m, 'f', 80, 1);
    const day = 86_400_000;
    const before = m.mastery('f', T0 + 80_000);
    expect(m.dueKeys('asdfjkl', T0 + 80_000)).toEqual([]);
    const later = T0 + 5 * day;
    expect(m.dueKeys('asdfjkl', later)).toContain('f');
    expect(m.mastery('f', later)).toBe(before);
    const interval0 = m.stat('f')!.interval;
    m.record('f', true, 300, later);
    expect(m.stat('f')!.interval).toBe(interval0 * 2);
    expect(m.stat('f')!.reviews).toBe(1);
  });
  it('round-trips JSON incl. confusions and sanitises garbage', () => {
    const m = new KeyModel(); sim(m, 'f', 20, 0.9); m.record('k', false, 300, T0, 'd');
    const back = KeyModel.fromJSON(JSON.parse(JSON.stringify(m.toJSON().keys)), m.toJSON().confusions);
    expect(back.toJSON()).toEqual(m.toJSON());
    const g = KeyModel.fromJSON({ f: { err: 'x', lat: -5, seen: 2.7 }, long: { err: 1 } }, { 'k>d': 3, bad: 1 }).toJSON();
    expect(Object.keys(g.keys)).toEqual(['f']);
    expect(g.confusions).toEqual({ 'k>d': 3 });
  });
});
