import { describe, expect, it } from 'vitest';
import { TRAILS, STAGES, allowedChars, trailById } from '../curriculum';
import { generate, generateDrill, wordBank } from './textgen';
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
