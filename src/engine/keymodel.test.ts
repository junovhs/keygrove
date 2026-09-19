import { describe, expect, it } from 'vitest';
import { KeyModel, HOT } from './keymodel';

const warm = (m: KeyModel, keys: string, n = 10, now = 1_000_000) => { for (const k of keys) for (let i = 0; i < n; i++) m.record(k, true, 300, now); };

describe('KeyModel', () => {
  it('misses make a key hot, hits keep it cold', () => {
    const m = new KeyModel();
    warm(m, 'asdfjl');
    for (let i = 0; i < 10; i++) m.record('k', false, 300);
    expect(m.heat('k')).toBeGreaterThan(HOT);
    expect(m.heat('a')).toBeLessThan(0.1);
    expect(m.heat('zz')).toBe(0);
  });
  it('slowness alone can warm a key', () => {
    const m = new KeyModel();
    warm(m, 'asdfjkl');
    for (let i = 0; i < 10; i++) m.record(';', true, 900);
    expect(m.heat(';')).toBeGreaterThan(0.3);
    expect(m.heat(';')).toBeLessThan(HOT + 0.4);
  });
  it('hottest orders by heat, respects threshold and sample minimum', () => {
    const m = new KeyModel();
    warm(m, 'asdfjkl;');
    for (let i = 0; i < 6; i++) m.record('k', false, 300);
    for (let i = 0; i < 3; i++) m.record('d', false, 300);
    m.record('q', false, 300);
    expect(m.hottest('asdfjkl;q')?.key).toBe('k');
    expect(m.hottest('asdfjl;q')).toBeNull();
    expect(m.hottest('asdfjl;q', 0.1)?.key).toBe('d');
  });
  it('stale picks keys unseen for > 2 days, ignoring never-seen keys', () => {
    const m = new KeyModel();
    const day = 86_400_000;
    m.record('a', true, 300, 0);
    m.record('s', true, 300, 3 * day);
    expect(m.stale('asdx', 3 * day + 1000)).toEqual(['a']);
    expect(m.stale('asdx', 1 * day)).toEqual([]);
  });
  it('round-trips through JSON and sanitises garbage', () => {
    const m = new KeyModel();
    warm(m, 'fj');
    m.record('f', false, 250);
    const back = KeyModel.fromJSON(JSON.parse(JSON.stringify(m.toJSON())));
    expect(back.toJSON()).toEqual(m.toJSON());
    expect(KeyModel.fromJSON({ f: { err: 'x', lat: -5, seen: 2.7 }, long: { err: 1 }, n: null }).toJSON()).toEqual({ f: { err: 0, lat: 0, seen: 2, last: 0 } });
  });
  it('heatMap feeds textgen shape', () => {
    const m = new KeyModel();
    for (let i = 0; i < 5; i++) m.record('k', false, 300);
    const h = m.heatMap();
    expect(Object.keys(h)).toEqual(['k']);
    expect(h['k']).toBeGreaterThan(0);
  });
});
