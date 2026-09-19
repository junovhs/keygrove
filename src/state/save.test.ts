import { describe, expect, it } from 'vitest';
import { KEY, fresh, load, migrateV4, sanitize, save } from './save';

const V4 = {
  selected: 'top', completed: ['home', 'reach'], focus: 'all',
  fingerStats: { rm: { runs: 3, hits: 40, attempts: 80, bestWpm: 20, bestAcc: 60 }, li: { runs: 1, hits: 20, attempts: 20, bestWpm: 30, bestAcc: 100 } },
  stats: { runs: 12, chars: 500, attempts: 560, bestWpm: 31, bestAcc: 100, xp: 420, streak: 4, bestCombo: 19 },
};

describe('save v5', () => {
  it('fresh round-trips through sanitize and JSON', () => {
    const s = fresh();
    expect(sanitize(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it('migrates a v4 save: cleared lessons → cleared trails, current = first uncleared, stats kept, heat seeded', () => {
    const s = migrateV4(V4);
    expect(s.v).toBe(5);
    expect(s.trails['anchors']).toMatchObject({ stage: 3, stars: 1 });
    expect(s.trails['roots-checkpoint']).toMatchObject({ stage: 3, stars: 2 });
    expect(s.trails['middle-up']).toBeUndefined();
    expect(s.trail).toBe('middle-up');
    expect(s.stats).toMatchObject({ runs: 12, chars: 500, xp: 420, bestWpm: 31, bestCombo: 19 });
    expect(s.keys['k']!.err).toBeGreaterThan(s.keys['f']!.err);
    const again = sanitize(JSON.parse(JSON.stringify(s)));
    expect(again).toEqual(s);
  });
  it('load prefers v5, falls back to v4, then fresh; save writes v5', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
    expect(load(storage)).toEqual(fresh());
    mem.set('keygrove.v4', JSON.stringify(V4));
    expect(load(storage).trail).toBe('middle-up');
    const s = fresh(); s.trail = 'ring-pair'; save(s, storage);
    expect(mem.has(KEY)).toBe(true);
    expect(load(storage).trail).toBe('ring-pair');
    mem.set(KEY, '{not json');
    expect(load(storage)).toEqual(fresh());
  });
  it('sanitize drops unknown trails and clamps', () => {
    const s = sanitize({ trail: 'nope', trails: { anchors: { stage: 9, stars: -1, bestWpm: 1e9 }, ghost: { stage: 3 } }, stats: { xp: 'x' }, settings: { slowMode: 'yes', codeGrove: true } });
    expect(s.trail).toBe('anchors');
    expect(s.trails['anchors']).toEqual({ stage: 3, stars: 0, bestWpm: 400, bestAcc: 0, fails: 0 });
    expect(s.trails['ghost']).toBeUndefined();
    expect(s.settings).toMatchObject({ slowMode: false, codeGrove: true });
  });
});
