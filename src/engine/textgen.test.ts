import { describe, expect, it } from 'vitest';
import { TRAILS, STAGES, allowedChars, trailById } from '../curriculum';
import { etude, generate, generateDrill, wordBank } from './textgen';
import { rng } from './rng';
import { lessonExercises, loop } from '../curriculum/lesson-flow';

describe('textgen', () => {
  it('every trail × stage × 50 seeds only uses unlocked keys and is non-trivial', () => {
    let n = 0;
    for (const t of TRAILS) {
      const allowed = allowedChars(t);
      for (const stage of STAGES) for (let seed = 1; seed <= 50; seed++) {
        const text = generate(t, stage, { seed }); n++;
        if (text.length <= 6) throw new Error(`${t.id}/${stage}/${seed} too short: ${JSON.stringify(text)}`);
        if (text.length >= t.length * 2 + 80) throw new Error(`${t.id}/${stage}/${seed} too long (${text.length})`);
        for (const key of t.checkpoint ? [...allowed].filter(c => c !== ' ' && c === c.toLowerCase()) : [...t.newKeys]) {
          if (!text.toLowerCase().includes(key)) throw new Error(`${t.id}/${stage}/${seed} missing ${key}`);
        }
        if (text.includes('  ')) throw new Error(`${t.id}/${stage} double space`);
        const bad = [...text].find((c) => !allowed.has(c));
        if (bad !== undefined) throw new Error(`${t.id}/${stage}/${seed}: ${JSON.stringify(bad)} not unlocked in ${JSON.stringify(text)}`);
      }
    }
    expect(n).toBe(TRAILS.length * 3 * 50);
  });
  it('is deterministic for a seed', () => {
    const t = trailById('home-words');
    expect(generate(t, 'words', { seed: 7 })).toBe(generate(t, 'words', { seed: 7 }));
    expect(generate(t, 'words', { seed: 7 })).not.toBe(generate(t, 'words', { seed: 8 }));
  });
  it('early trails are rhythm, home words are real words', () => {
    expect(generate(trailById('anchors'), 'drill', { seed: 1 })).toMatch(/^[fj ]+$/);
    const hw = generate(trailById('home-words'), 'words', { seed: 3 }).split(' ');
    expect(hw.length).toBeGreaterThan(5);
    expect(wordBank(trailById('home-words')).length).toBeGreaterThanOrEqual(24);
    expect(wordBank(trailById('anchors')).length).toBe(0);
  });
  it('new keys are found before assessed practice, and their word line concentrates them before prose', () => {
    for (const t of TRAILS.filter(t => t.newKeys && ['rhythm', 'words'].includes(t.kind))) {
      const first = lessonExercises(t)[0]!;
      expect(first.assessment, t.id).toBe('guided');
      for (const k of t.newKeys) expect([...(first.text ?? '')].filter(c => c === k).length, `${t.id} warm-up for ${k}`).toBeGreaterThanOrEqual(4);
    }
    for (const id of ['index-reach', 'core-words'] as const) {
      const t = trailById(id)!, ex = lessonExercises(t).find(e => e.format === 'words')!;
      const words = generate(t, 'words', { exercise: ex, seed: 11 }).split(' ');
      const share = words.filter(w => [...t.newKeys].some(k => w.includes(k))).length / words.length;
      expect(share, id).toBeGreaterThanOrEqual(0.6);
    }
    const roots = lessonExercises(trailById('anchors')!);
    expect(roots).toHaveLength(5);
    expect(roots[1]).toMatchObject({ name: 'Take a gentle keyboard tour', assessment: 'guided' });
    for (const k of 'abcdefghijklmnopqrstuvwxyz') expect(roots[1]!.text, k).toContain(k);
  });
  it('heat pulls hot-key words in', () => {
    const t = trailById('home-words');
    const count = (heat: Record<string, number>) => { let k = 0, n = 0; for (let s = 0; s < 200; s++) { const txt = generate(t, 'words', { seed: s, heat }); n += txt.length; k += [...txt].filter((c) => c === 'g').length; } return k / n; };
    expect(count({ g: 6 })).toBeGreaterThan(count({}) * 2);
  });
  it('sentence trails introduce their new punctuation', () => {
    const q = generate(trailById('quotes-and-questions'), 'words', { seed: 2 });
    expect(/['"?!]/.test(q)).toBe(true);
    const caps = generate(trailById('sentences'), 'words', { seed: 2 });
    expect(/[A-Z]/.test(caps)).toBe(true);
    expect(/[A-Z]/.test(generate(trailById('undergrowth-checkpoint'), 'words', { seed: 2 }))).toBe(false);
  });
});

it('the final assessment is coherent text with complete coverage, not a tail of random symbols', () => {
  const t = trailById('flow-checkpoint');
  for (let seed = 0; seed < 30; seed++) {
    const text = generate(t, 'words', { seed });
    expect(text.endsWith('The next thing you type can be your own.')).toBe(true);
    expect(text.length).toBeGreaterThan(500);
    expect(text).toContain('26/09/2026');
    expect(text).toContain('blue_fox = 2 * 4 + 1');
  }
});
it('a warm-up stays short and covers every selected key, including rare letters', () => {
  const t = trailById('flow-checkpoint');
  for (let seed = 0; seed < 50; seed++) {
    const text = generateDrill('review', ['q', 'j', 'z', 'x'], t, { seed });
    for (const k of 'qjzx') expect([...text].filter(c => c === k).length).toBeGreaterThanOrEqual(2);
    expect(text.length).toBeLessThan(150);
  }
});

describe('transition loop (spec B1, CURR-39)', () => {
  it('a target loop is only its two letters and spaces, both directions, about the exercise length', () => {
    const t = trailById('index-up')!; // R U taught: M (lesson 5) and U are both unlocked, so `mu` is eligible
    const text = generate(t, 'mix', { exercise: loop('mu'), seed: 3 });
    expect(text).toMatch(/^[mu ]+$/);
    expect(text).toContain('mu'); expect(text).toContain('um'); expect(text).toContain('mum');
    expect(text.length).toBeGreaterThanOrEqual(20); expect(text.length).toBeLessThanOrEqual(28);
    expect(generate(t, 'mix', { exercise: loop('mu'), seed: 9 })).toBe(text); // no randomness: the loop is the same every time
  });
  it('lesson 3 (E I) isolates `ed` as its assessed slot-2 loop; a target whose keys are not unlocked is refused', () => {
    const ex = lessonExercises(trailById('middle-up')!)[1]!;
    expect(ex).toMatchObject({ name: 'Connect E and D', target: 'ed', format: 'movement' });
    expect(ex.assessment).toBeUndefined();
    expect(ex.instruction).toMatch(/^Same finger, top row to home row\./);
    expect(generate(trailById('middle-up')!, 'mix', { exercise: ex })).toMatch(/^[ed ]+$/);
    expect(() => generate(trailById('anchors')!, 'mix', { exercise: loop('ed') })).toThrow(/not unlocked/);
    expect(() => loop('qa')).toThrow(/Unknown transition target/);
  });
});

describe('etudes (spec B3/C4, CURR-41)', () => {
  const full = allowedChars(trailById('flow-checkpoint')!);
  const carrierShare = (text: string, target: string) => { const ws = text.split(' '); return ws.filter(w => w.includes(target)).length / ws.length; };
  it('carries the target in at least two thirds of its words, from the research set, short carriers first', () => {
    for (const target of ['mu', 'ed', 'ion']) {
      const text = etude(target, full, 44, rng(1))!;
      expect(text, target).toBeTruthy();
      expect(carrierShare(text, target), target).toBeGreaterThanOrEqual(0.6);
      expect(text.split(' ')[0]!.length, target).toBeLessThanOrEqual(text.split(' ')[1]!.length);
      expect(text.length).toBeGreaterThanOrEqual(44); expect(text.length).toBeLessThan(60);
    }
  });
  it('falls back to the ordinary generator when fewer than four carriers are typeable', () => {
    expect(etude('mu', allowedChars(trailById('core-words')!), 40, rng(1))).toBeNull(); // V M taught, U not yet
    const t = trailById('middle-up')!, ex = lessonExercises(t).find(e => e.format === 'words')!;
    expect(ex.target).toBe('ed');
    const text = generate(t, 'words', { exercise: ex, seed: 1 });
    expect(text.length).toBeGreaterThan(10); expect([...text].every(c => allowedChars(t).has(c))).toBe(true);
  });
  it('the Bigrams trail and the wired lessons draw their words from the chunk sets', () => {
    const t = trailById('bigrams')!, ex = lessonExercises(t).find(e => e.format === 'words')!;
    const chunks = ['ing', 'ion', 'tion', 'nce', 'ted'];
    for (const w of generate(t, 'words', { exercise: ex, seed: 2 }).split(' ')) expect(chunks.some(c => w.includes(c)), w).toBe(true);
    for (const [id, target] of [['home-words', 'ing'], ['index-stretch-up', 'nce'], ['ring-up', 'ion']] as const) {
      const tr = trailById(id)!, e = lessonExercises(tr).find(x => x.format === 'words')!;
      expect(e.target).toBe(target);
      // The raw etude is ≥ 2/3 carriers; the lesson's new keys are then guaranteed too, so at least half the words carry the chunk.
      expect(carrierShare(generate(tr, 'words', { exercise: e, seed: 3 }), target), id).toBeGreaterThanOrEqual(0.5);
    }
  });
  it("a coach transition drill on a research target is that target's etude", () => {
    const text = generateDrill('transition', ['m', 'u'], trailById('home-words')!, { seed: 1 });
    expect(carrierShare(text, 'mu')).toBeGreaterThanOrEqual(0.6);
  });
});
