import { describe, expect, it } from 'vitest';
import { CHUNKS, MOVEMENT_VOCABULARY_VERSION, PRACTICE_WORDS, TECHNICAL_TRANSITIONS } from './movements';
import { TRADITIONAL } from './method';
// The research CSVs themselves, so the generated module is checked against its source (test-only; never bundled).
import technicalCsv from '../../research/typing-movements/outputs/candidates/technical_transitions.csv?raw';
import gesturesCsv from '../../research/typing-movements/outputs/candidates/gestures.csv?raw';
import wordsCsv from '../../research/typing-movements/outputs/candidates/practice_words.csv?raw';

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
    expect(MOVEMENT_VOCABULARY_VERSION).toBe('1.0');
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
      expect(t.classByMethod['relaxed-qwerty@1.0']).toBe(r.relaxed_class);
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
});
