import { describe, expect, it } from 'vitest';
import { CHUNKS, COMMON_TRANSITIONS, EVERYDAY_WORDS, MOVEMENT_VOCABULARY_VERSION, PRACTICE_WORDS, TECHNICAL_TRANSITIONS } from './movements';
import { TRADITIONAL } from './method';
// The research CSVs themselves, so the generated module is checked against its source (test-only; never bundled).
import technicalCsv from '../../research/typing-movements/outputs/candidates/technical_transitions.csv?raw';
import gesturesCsv from '../../research/typing-movements/outputs/candidates/gestures.csv?raw';
import wordsCsv from '../../research/typing-movements/outputs/candidates/practice_words.csv?raw';
import everydayCsv from '../../research/typing-movements/outputs/candidates/everyday_words.csv?raw';
import bigramsCsv from '../../research/typing-movements/outputs/tables/bigrams_cross_corpus.csv?raw';

const V1_TARGETS = ['ed', 'de', 'ce', 'ec', 'tr', 'un', 'lo', 'ol', 'rt', 'mu', 'um'];
const V1_CHUNKS = ['ing', 'ion', 'tion', 'nce', 'ted'];

/** The candidate CSVs open with `#` header lines; the rest is a plain header + rows. */
function csv(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l: string) => l && !l.startsWith('#'));
  const head = lines[0]!.split(',');
  return lines.slice(1).map((l: string) => Object.fromEntries(l.split(',').map((v: string, i: number) => [head[i]!, v])));
}

describe('movement vocabulary (generated, v1 cut — DOCS-04, scaffold H2–H4)', () => {
  it('is exactly the v1 sets, versioned, lowercase A–Z, no duplicates', () => {
    expect(MOVEMENT_VOCABULARY_VERSION).toBe('1.1');
    expect(TECHNICAL_TRANSITIONS.map((t) => t.bigram)).toEqual(V1_TARGETS);
    expect(CHUNKS.map((c) => c.ngram)).toEqual(V1_CHUNKS);
    for (const g of [...V1_TARGETS, ...V1_CHUNKS]) expect(g).toMatch(/^[a-z]+$/);
    expect(Object.keys(PRACTICE_WORDS).sort()).toEqual([...V1_TARGETS, ...V1_CHUNKS].sort());
    for (const words of Object.values(PRACTICE_WORDS)) expect(new Set(words).size).toBe(words.length);
  });
  it('every practice word contains its target and is typeable from the full key set', () => {
    for (const [target, words] of Object.entries(PRACTICE_WORDS)) {
      expect(words.length, target).toBeGreaterThan(0);
      for (const w of words) {
        expect(w, `${target}: ${w}`).toContain(target);
        for (const ch of w) expect(TRADITIONAL.assignments[ch], `${w} has untypeable ${JSON.stringify(ch)}`).toBeTruthy();
      }
    }
  });
  it('is in sync with the research CSVs (re-export with `make export` when this fails)', () => {
    const tech = Object.fromEntries(csv(technicalCsv).map((r) => [r.bigram, r]));
    for (const t of TECHNICAL_TRANSITIONS) {
      const r = tech[t.bigram]!;
      expect(r, t.bigram).toBeDefined();
      expect(t.minShare).toBeCloseTo(Number(r.min_share), 5);
      expect(t.stability).toBe(r.stability);
      expect(t.classByMethod['traditional@1.0']).toBe(r.movement_class);
      expect(t.sameFingerTravel).toBeCloseTo(Number(r.same_finger_travel || 0), 2);
    }
    const gest = Object.fromEntries(csv(gesturesCsv).map((r) => [r.gesture, r]));
    for (const c of CHUNKS) {
      const r = gest[c.ngram]!;
      expect(r, c.ngram).toBeDefined();
      expect(c.minShare).toBeCloseTo(Number(r.min_share), 5);
      expect(c.stability).toBe(r.stability);
      expect([...c.features]).toEqual(r.features!.split(';').filter(Boolean));
    }
    const words: Record<string, string[]> = {};
    for (const r of csv(wordsCsv)) (words[r.target!] ??= []).push(r.word!);
    for (const [target, list] of Object.entries(PRACTICE_WORDS)) expect([...list], target).toEqual(words[target]);
  });
  it('v1.1: common transitions are the cross-corpus bigram table, universal first, by smallest share', () => {
    const rows = csv(bigramsCsv).map((r) => ({ bigram: r.ngram!, universal: r.stability_class === 'universal', min: Math.min(...['books', 'web', 'subtlex'].map((c) => Number(r[`share_${c}`] || 0))) }));
    const universal = rows.filter((r) => r.universal);
    expect(COMMON_TRANSITIONS.filter((c) => c.universal).map((c) => c.bigram).sort()).toEqual(universal.map((r) => r.bigram).sort());
    const byGram = Object.fromEntries(rows.map((r) => [r.bigram, r]));
    let seenOther = false;
    COMMON_TRANSITIONS.forEach((c, i) => {
      expect(c.bigram).toMatch(/^[a-z]{2}$/);
      expect(c.minShare).toBeCloseTo(byGram[c.bigram]!.min, 5);
      if (!c.universal) { seenOther = true; expect(c.minShare).toBeGreaterThanOrEqual(0.0001); } else expect(seenOther, 'universal rows come first').toBe(false);
      const prev = COMMON_TRANSITIONS[i - 1];
      if (prev && prev.universal === c.universal) expect(prev.minShare).toBeGreaterThanOrEqual(c.minShare);
    });
    expect(COMMON_TRANSITIONS.slice(0, 3).map((c) => c.bigram)).toEqual(['in', 'th', 'er']);
  });
  it('v1.1: everyday words are the research everyday-word list, frequency order, minus contraction fragments and rare two-letter entries', () => {
    const source = csv(everydayCsv).map((r) => r.word!);
    expect(EVERYDAY_WORDS.length).toBeGreaterThan(5000);
    for (const w of EVERYDAY_WORDS) expect(w).toMatch(/^[a-z]+$/);
    let at = 0;
    for (const w of EVERYDAY_WORDS) { const j = source.indexOf(w, at); expect(j, w).toBeGreaterThanOrEqual(at); at = j; }
    for (const junk of ['s', 't', 'm', 're', 'uh', 'nd', 'rd', 'ls']) expect(EVERYDAY_WORDS).not.toContain(junk);
    for (const keep of ['a', 'he', 'me', 'is', 'on', 'be', 'music', 'people']) expect(EVERYDAY_WORDS).toContain(keep);
  });
});
