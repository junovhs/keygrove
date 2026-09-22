import { describe, expect, it } from 'vitest';
import { TRAILS, trailById } from '../curriculum';
import { decide, type RunSummary } from './coach';
import { KeyModel } from './keymodel';
import { generate, generateDrill } from './textgen';
import { TransitionModel } from './transitions';

/** A typist at 300 ms per transition across common pairs, with one pair typed at `slow` ms `times` times. */
function typist(slowPair = 'th', slow = 900, times = 10): TransitionModel {
  const m = new TransitionModel();
  for (const pair of ['he', 'in', 'er', 'an', 'at', 'en', 'nd', 'es', 'ed', 'is', 'it', 'al']) for (let i = 0; i < 10; i++) m.record(pair[0]!, pair[1]!, true, 300);
  for (let i = 0; i < times; i++) m.record(slowPair[0]!, slowPair[1]!, true, slow);
  return m;
}

describe('transition model (§25)', () => {
  it("'th' typed slowly 10× is the weakest transition; pairs never cross a space", () => {
    const m = typist();
    expect(m.reference()).toBe(300);
    expect(m.slowness('th')).toBeCloseTo(3);
    const weak = m.weakest([...'abcdefghijklmnopqrstuvwxyz']);
    expect(weak[0]!.pair).toBe('th');
    expect(weak[0]!.mastery).toBeLessThan(0.35);
    expect(m.mastery('he')).toBeGreaterThan(0.7);
    m.record(' ', 't', true, 300); m.record('t', ' ', true, 300);
    expect(m.pairs().some((p) => p.includes(' '))).toBe(false);
  });
  it('misses count against a pair; unseen pairs have no mastery; JSON round-trips', () => {
    const m = typist();
    for (let i = 0; i < 6; i++) m.record('e', 'r', false, 300);
    expect(m.stat('er')!.err).toBeGreaterThan(0.4);
    expect(m.mastery('zz')).toBe(0);
    const back = TransitionModel.fromJSON(JSON.parse(JSON.stringify(m.toJSON())));
    expect(back.mastery('th')).toBeCloseTo(m.mastery('th'));
    expect(TransitionModel.fromJSON({ 'a b': { seen: 3 }, xyz: {}, ab: { seen: 2, hits: 9 } }).toJSON()).toEqual({ ab: { err: 0, lat: 0, lat2: 0, seen: 2, hits: 2, last: 0 } });
  });
  it('remembers when a pair was last practised (spec C6/D5); an older save loads with last = 0', () => {
    const m = new TransitionModel();
    m.record('e', 'd', true, 300, 1_700_000_000_000);
    expect(m.stat('ed')!.last).toBe(1_700_000_000_000);
    m.record('e', 'd', false, null, 1_700_000_005_000);
    expect(m.stat('ed')!.last).toBe(1_700_000_005_000);
    expect(TransitionModel.fromJSON({ ed: { err: 0, lat: 300, lat2: 90_000, seen: 4, hits: 4 } }).stat('ed')!.last).toBe(0);
  });
  it('coach: the weakest pair becomes a transition drill offer', () => {
    const T0 = 1_700_000_000_000;
    const km = new KeyModel(); for (const k of 'thein') for (let i = 0; i < 30; i++) km.record(k, true, 300, T0 + i * 500);
    const m = typist();
    const base: RunSummary = { thirds: [{ errors: 0, lat: 300 }, { errors: 0, lat: 300 }, { errors: 0, lat: 300 }], wpm: 20, acc: 100, rhythm: 0.9, runsOnTrail: 1, focusKeys: ['t', 'h'], unlocked: [...'thein', ' '], passed: true, fails: 0, recentAcc: [], weakPairs: m.weakest([...'thein']) };
    const d = decide(km, base, T0 + 60_000).find((x) => x.kind === 'transition');
    expect(d).toMatchObject({ required: false, keys: ['t', 'h'] });
    expect(d!.reason).toContain('200% slower than your usual transition');
    expect(decide(km, { ...base, weakPairs: [] }, T0 + 60_000).some((x) => x.kind === 'transition')).toBe(false);
  });
  it("textgen: a transition drill for 'th' is made of words containing 'th'; the Bigrams trail uses the player's weak pairs", () => {
    const flow = TRAILS.find((t) => t.kind === 'bigrams')!;
    const text = generateDrill('transition', ['t', 'h'], flow, { seed: 7 });
    const words = text.split(' ');
    expect(words.length).toBeGreaterThan(4);
    // Spec B3 etude: a neutral common word after every two carriers, so carriers are at least 2/3 of the line.
    expect(words.filter((w) => w.includes('th')).length).toBeGreaterThanOrEqual(Math.floor((words.length * 2) / 3));
    expect(words.slice(0, 2).every((w) => w.includes('th'))).toBe(true);
    const drill = generate(flow, 'drill', { seed: 3, weakPairs: ['th', 'rf'] });
    expect(drill.split(' ').every((w) => w === 'th' || w === 'rf')).toBe(true);
    expect(generate(flow, 'drill', { seed: 3 })).not.toBe(drill);
    // A pair with no words falls back to patterns built from the pair.
    const early = trailById('anchors');
    expect(generateDrill('transition', ['f', 'j'], early, { seed: 1 }).split(' ').every((w) => /^[fj]+$/.test(w) && w.includes('fj'))).toBe(true);
  });
});
