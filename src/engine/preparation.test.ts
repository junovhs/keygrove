import { expect, it } from 'vitest';
import { attemptPrompts, classifyPreparation, wordBigrams, type TracedRun } from './preparation';

const run = (id: string, index: number, prompt: string): TracedRun => ({ mode: 'trail', lesson: { id }, exercise: { index }, prompt });

it('counts within-word letter bigrams only; spaces and punctuation end a word', () => {
  expect(wordBigrams('He hid; a kid.')).toEqual(['he', 'hi', 'id', 'ki', 'id']);
});

it('a checkpoint made only of chapter-learned bigrams is known already, not novel', () => {
  const known = new Set(['hi', 'id', 'he', 'di', 'ig']);
  const p = classifyPreparation('he hid dig', new Set(), known);
  expect(p).toMatchObject({ bigramOccurrences: 5, warmedNow: 0, knownAlready: 5, novel: 0, knownShare: 1, novelBigrams: [] });
});

it('a bigram typed earlier in this attempt is warmed now, and warmth outranks prior knowledge', () => {
  const runs = [run('middle-up', 1, 'eeiieeii'), run('middle-up', 2, 'ed de ede ed')];
  const warmed = new Set(attemptPrompts(runs, 'middle-up', 3).flatMap(wordBigrams));
  const p = classifyPreparation('fed feed kid', warmed, new Set(['ed', 'ki']));
  expect(p.warmedNow).toBe(3); // ed ×2, ee
  expect(p.knownAlready).toBe(1); // ki
  expect(p.novelBigrams).toEqual(['fe', 'id']);
});

it('replaying a lesson never counts the previous pass as warm-up', () => {
  const pass1 = [1, 2, 3, 4, 5].map((i) => run('middle-up', i, `p${i} ed`));
  expect(attemptPrompts([...pass1], 'middle-up', 1)).toEqual([]);
  const replay = [...pass1, run('middle-up', 1, 'eeii')];
  expect(attemptPrompts(replay, 'middle-up', 2)).toEqual(['eeii']);
});

it('a retry of the current exercise is skipped; other lessons and modes end the attempt', () => {
  const runs = [run('index-reach', 5, 'x'), run('middle-up', 1, 'a'), run('middle-up', 2, 'b fail'), run('middle-up', 2, 'b')];
  expect(attemptPrompts(runs, 'middle-up', 3)).toEqual(['a', 'b']);
  expect(attemptPrompts(runs, 'middle-up', 2)).toEqual(['a']);
  expect(attemptPrompts([...runs, { ...run('middle-up', 1, 'z'), mode: 'explore' }], 'middle-up', 3)).toEqual([]);
});
