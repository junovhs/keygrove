import { describe, expect, it } from 'vitest';
import { GROVES, TRAILS, MAIN_TRAILS, cumulativeKeys, allowedChars, checkpointOf, gateFor, nextTrail, trailsInGrove, describePath, groveOf } from './index';

const VALID = new Set('abcdefghijklmnopqrstuvwxyz0123456789;,./\'"?!-:()@#$%&*=+_{}[]<>');

describe('curriculum invariants', () => {
  it('has 34 main-path trails and 7 groves', () => {
    expect(MAIN_TRAILS).toHaveLength(34);
    expect(GROVES).toHaveLength(7);
    expect(TRAILS.length).toBeGreaterThan(34);
  });
  it('trail ids are unique, numbered in order', () => {
    expect(new Set(TRAILS.map((t) => t.id)).size).toBe(TRAILS.length);
    TRAILS.forEach((t, i) => expect(t.n).toBe(i + 1));
  });
  it('every new key is a real key and introduced exactly once per path', () => {
    const seen = new Map<string, string>();
    for (const t of MAIN_TRAILS) for (const k of t.newKeys) {
      expect(VALID.has(k), `${t.id} introduces invalid key ${JSON.stringify(k)}`).toBe(true);
      expect(seen.has(k), `${k} introduced twice: ${seen.get(k)} and ${t.id}`).toBe(false);
      seen.set(k, t.id);
    }
    for (const t of trailsInGrove('code')) for (const k of t.newKeys) {
      expect(VALID.has(k), `${t.id} introduces invalid key ${JSON.stringify(k)}`).toBe(true);
      expect(allowedChars(TRAILS[t.n - 2]!).has(k), `${t.id} re-introduces ${k}`).toBe(false);
    }
  });
  it('cumulative key sets are monotonic along the main path', () => {
    let prev = new Set<string>();
    for (const t of MAIN_TRAILS) {
      const cur = allowedChars(t);
      for (const k of prev) expect(cur.has(k), `${t.id} lost key ${k}`).toBe(true);
      prev = cur;
    }
  });
  it('every grove ends in exactly one checkpoint', () => {
    for (const g of GROVES) {
      const ts = trailsInGrove(g.id);
      expect(ts.filter((t) => t.checkpoint), g.id).toHaveLength(1);
      expect(ts.at(-1)!.checkpoint, `${g.id} last trail is the checkpoint`).toBe(true);
      expect(checkpointOf(g.id).id).toBe(ts.at(-1)!.id);
    }
  });
  it('gates are non-decreasing across main-path groves', () => {
    const main = GROVES.filter((g) => !g.optional);
    for (let i = 1; i < main.length; i++) {
      expect(main[i]!.passAcc).toBeGreaterThanOrEqual(main[i - 1]!.passAcc);
      expect(main[i]!.wpmTarget).toBeGreaterThanOrEqual(main[i - 1]!.wpmTarget);
    }
  });
  it('the full alphabet is unlocked by the end of grove 3, shift by grove 4, digits by grove 5', () => {
    const cp3 = allowedChars(checkpointOf('undergrowth'));
    for (const c of 'abcdefghijklmnopqrstuvwxyz') expect(cp3.has(c), c).toBe(true);
    expect(cp3.has('A')).toBe(false);
    expect(cumulativeKeys(checkpointOf('bark')).shift).toBe(true);
    const cp5 = allowedChars(checkpointOf('rings'));
    for (const c of '0123456789') expect(cp5.has(c), c).toBe(true);
  });
  it('the main path walks 34 trails and ends; the code branch inherits grove 4 keys', () => {
    let t = MAIN_TRAILS[0]!, n = 1;
    while (nextTrail(t)) { t = nextTrail(t)!; n++; }
    expect(n).toBe(34);
    expect(t.id).toBe('flow-checkpoint');
    const braces = trailsInGrove('code')[0]!;
    const ks = allowedChars(braces);
    expect(ks.has('{')).toBe(true); expect(ks.has('A')).toBe(true); expect(ks.has('1')).toBe(false);
    expect(groveOf(braces).opensAfter).toBe('bark-checkpoint');
  });
  it('gate math: ★★★ is 1.2× the ★★ target', () => {
    const g = gateFor(MAIN_TRAILS[0]!);
    expect(g).toEqual({ passAcc: 90, star2Wpm: 15, star3Wpm: 18, star2Acc: 97, star3Acc: 100 });
    expect(gateFor(checkpointOf('flow')).star2Wpm).toBe(50);
  });
  it('prints the path (compare against docs/progression.md)', () => {
    const table = describePath();
    console.log('\n' + table);
    expect(table.split('\n')).toHaveLength(TRAILS.length);
  });
});
