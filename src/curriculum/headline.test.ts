import { describe, expect, it } from 'vitest';
import { MAIN_TRAILS, allowedChars, trailById } from './index';
import { lessonExercises, type SlotPick } from './lesson-flow';
import { headlineOf } from './headline';
import { readablePhrases } from './language';
import { generate } from '../engine/textgen';
import { nextPractice } from '../engine/next-practice';
import { TransitionModel } from '../engine/transitions';

/** The new-key word lessons of the letter chapters (lessons 3–20). */
const LESSONS = MAIN_TRAILS.filter((t) => t.n >= 3 && t.n <= 20 && t.newKeys && t.kind === 'words' && !t.checkpoint);
const SEEDS = [1, 7, 23];
/** What a first-time learner meets: the D5 pick with no evidence (a fresh technical target touching the new keys). */
const freshPick = (id: string): SlotPick | undefined => {
  const t = trailById(id);
  return nextPractice(new TransitionModel(), new Set([...allowedChars(t)].filter((k) => /^[a-z]$/.test(k))), Date.now(), t.newKeys) ?? undefined;
};

describe('headline-movement lessons (CURR-50)', () => {
  it('each lesson headlines the researched movement its new letters make', () => {
    const headlines = Object.fromEntries(LESSONS.map((t) => [t.id, headlineOf(t)]));
    expect(headlines).toMatchObject({
      'index-reach': 'hi', 'core-words': 've', 'index-up': 'er', 'ring-pair': 'is', 'outer-pair': 'ar', 'home-words': 'in',
      'index-stretch-up': 'ca', 'ring-up': 'on', 'pinky-up': 'pe', 'index-down': 'be', 'middle-down': 'ex', 'ring-down': 'ze', 'last-reaches': null,
    });
    // A first-time learner meets the research's same-finger targets where they unlock (spec C3), not the common movement.
    expect(Object.fromEntries(['middle-up', 'index-up', 'home-words', 'index-stretch-up', 'ring-up'].map((id) => [id, freshPick(id)?.target])))
      .toEqual({ 'middle-up': 'ed', 'index-up': 'mu', 'home-words': 'tr', 'index-stretch-up': 'ce', 'ring-up': 'lo' });
  });

  for (const withPick of [false, true]) it(`drill → words → phrase share one movement (${withPick ? 'first-time learner' : 'no pick'})`, () => {
    for (const t of LESSONS) {
      const pick = withPick ? freshPick(t.id) : undefined;
      const headline = pick?.target ?? (t.id === 'middle-up' ? 'ed' : headlineOf(t));
      const ex = lessonExercises(t, pick);
      const words = ex.find((e) => e.format === 'words' && e.assessment !== 'guided')!;
      const phrase = ex.at(-1)!;
      expect(phrase.format, t.id).toBe('passage');
      if (!headline) continue;
      expect(ex[1]!.target, `${t.id} slot 2`).toBe(headline);
      expect(words.target, `${t.id} words`).toBe(headline);
      const phraseCan = t.id !== 'middle-up' && readablePhrases(allowedChars(t)).some((p) => p.toLowerCase().includes(headline));
      for (const seed of SEEDS) {
        const line = generate(t, words.stage, { exercise: words, seed }).split(' ');
        expect(line.filter((w) => w.includes(headline)).length / line.length, `${t.id}/${seed}: ${line.join(' ')}`).toBeGreaterThanOrEqual(0.5);
        if (phraseCan) expect(generate(t, phrase.stage, { exercise: phrase, seed }).toLowerCase(), `${t.id} phrase`).toContain(headline);
      }
    }
  });

  it('a words line never carries a lone punctuation token, and a slash only joins a real pair', () => {
    for (const t of LESSONS) for (const e of lessonExercises(t).filter((x) => x.format === 'words')) for (const seed of SEEDS) {
      const line = generate(t, e.stage, { exercise: e, seed });
      for (const w of line.split(' ')) expect(w, `${t.id}: ${line}`).toMatch(/[a-z]/i);
      for (const pair of line.match(/\S*\/\S*/g) ?? []) expect(['yes/no', 'and/or', 'his/her', 'he/she', 'in/out', 'on/off', 'up/down'], line).toContain(pair);
    }
  });

  it('visits only preview what comes next in the first lessons; the lesson 1 tour shows the rest', () => {
    const visits = MAIN_TRAILS.flatMap((t) => lessonExercises(t).filter((e) => e.assessment === 'guided' && /^Visit|stagger|number row/.test(e.name)).map((e) => `${t.id}:${e.name}`));
    expect(visits).toEqual(['anchors:Visit the upper row', 'inner-pair:Visit the lower row']);
  });

  it('phrases never double their end punctuation', () => {
    for (const p of readablePhrases(allowedChars(trailById('flow-checkpoint')))) expect(p, p).not.toMatch(/[.!?]\.$/);
  });
});
