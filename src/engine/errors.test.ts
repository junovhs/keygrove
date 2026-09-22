import { describe, expect, it } from 'vitest';
import { RELAXED_QWERTY, TRADITIONAL } from '../curriculum/method';
import { decide, type RunSummary } from './coach';
import { classifyMiss, classifyRun, dominant, explain, isNeighbour, rollTally } from './errors';
import { KeyModel } from './keymodel';
import { Run } from './run';

describe('error classification (§29)', () => {
  it('neighbour: physically adjacent keys on the staggered board', () => {
    expect(classifyMiss('e', 0, 'r')).toBe('neighbour');
    expect(classifyMiss('e', 0, 'd')).toBe('neighbour');
    expect(classifyMiss('e', 0, 's')).toBe('neighbour');
    expect(isNeighbour('e', 'f')).toBe(false);
    expect(isNeighbour('c', 'd')).toBe(true);
    expect(isNeighbour('c', 'f')).toBe(true);
    expect(isNeighbour('r', 'g')).toBe(false);
    expect(isNeighbour('q', 'q')).toBe(false);
  });
  it('same-finger slip: wanted and typed keys share a finger under the active method', () => {
    expect(classifyMiss('c', 0, 'g', RELAXED_QWERTY)).toBe('finger'); // C is left index in Relaxed
    expect(classifyMiss('c', 0, 'g', TRADITIONAL)).toBe('other');     // C is left middle in Traditional
    expect(classifyMiss('u', 0, 'm', RELAXED_QWERTY)).toBe('finger');
    expect(classifyMiss('q', 0, 'p')).toBe('other');
  });
  it('anticipation: a later character typed early (form → from)', () => {
    expect(classifyMiss('form', 1, 'r')).toBe('anticipation');
    expect(classifyMiss('the cat', 0, 'e')).toBe('anticipation');
    expect(classifyMiss('the cat', 2, 'c', RELAXED_QWERTY)).toBe('other'); // across the space is not reading ahead (C and E share a finger under Traditional)
  });
  it('repetition: the previous character again (thee); omission: a doubled letter dropped (al for all)', () => {
    expect(classifyMiss('the', 2, 'h')).toBe('repetition');
    expect(classifyMiss('all', 2, ' ')).toBe('other');
    expect(classifyMiss('all ', 2, ' ')).toBe('omission');
    expect(classifyMiss('see', 2, 'e')).toBe('other'); // e wanted, e typed is not a miss
  });
  it('timing: the right key after a pause > 2× the run median', () => {
    const r = new Run('fjfjfjfjfj');
    r.begin(0);
    let t = 0;
    for (let i = 0; i < 10; i++) { t += i === 6 ? 1500 : 300; r.type(r.current, t); }
    const tally = classifyRun(r.text, r.strokes);
    expect(tally.timing).toBe(1);
    expect(tally.other + tally.neighbour + tally.anticipation).toBe(0);
  });
  it('a scripted run typing "from" for "form" is an anticipation error', () => {
    const r = new Run('form form');
    r.begin(0);
    expect(r.type('f', 300)).toBe('ok');
    expect(r.type('r', 600)).toBe('miss');
    expect(r.type('o', 900)).toBe('ok'); r.type('r', 1200); r.type('m', 1500);
    const one = classifyRun(r.text, r.strokes, RELAXED_QWERTY);
    expect(one.anticipation).toBe(1);
    expect(explain(one)).toBeNull(); // one miss is not a pattern
    r.type(' ', 1800); r.type('f', 2100); r.type('r', 2400); r.type('o', 2700); r.type('r', 3000); r.type('m', 3300);
    const tally = classifyRun(r.text, r.strokes, RELAXED_QWERTY);
    expect(tally.anticipation).toBe(2);
    expect(explain(tally)).toBe('All anticipation errors — you are reading ahead of your hands.');
  });
  it('dominant needs a count and a share; rolling tally decays', () => {
    const t = { ...rollTally(undefined, classifyRun('', [])), anticipation: 3, neighbour: 1 };
    expect(dominant(t)).toMatchObject({ cls: 'anticipation', count: 3, total: 4 });
    expect(dominant({ ...t, neighbour: 3 })).toBeNull();
    expect(explain({ ...t, neighbour: 3 })).toBeNull();
    // DEC-15: same-finger misses are described as a pattern, never as which finger was used.
    expect(explain({ ...t, anticipation: 0, finger: 3 })).toBe('Mostly same-finger slips — a nearby key that shares a finger with the one wanted; check which key that finger reaches for.');
    const rolled = rollTally(t, { ...t, anticipation: 1, neighbour: 0 });
    expect(rolled.anticipation).toBeCloseTo(3 * 0.7 + 1);
    expect(rolled.neighbour).toBeCloseTo(0.7);
  });
});

describe('coach reads the error classes', () => {
  const T0 = 1_700_000_000_000;
  const base = (over: Partial<RunSummary> = {}): RunSummary => ({ thirds: [{ errors: 0, lat: 300 }, { errors: 0, lat: 300 }, { errors: 0, lat: 300 }], wpm: 20, acc: 90, rhythm: 0.9, runsOnTrail: 1, focusKeys: ['f', 'j', ' '], unlocked: [...'fjdk', ' '], passed: true, fails: 0, recentAcc: [], ...over });
  const quiet = () => { const m = new KeyModel(); for (const k of 'fjdk') for (let i = 0; i < 30; i++) m.record(k, true, 300, T0 + i * 500); return m; };
  it('mostly anticipation → a steady drill offer on the missed keys', () => {
    const errors = { ...rollTally(undefined, classifyRun('', [])), anticipation: 3, neighbour: 1 };
    const d = decide(quiet(), base({ errors, missedKeys: ['d', 'k'] }), T0 + 60_000);
    expect(d.find((x) => x.kind === 'anticipation')).toMatchObject({ required: false, keys: ['d', 'k'] });
  });
  it('mostly neighbour → a precision drill offer', () => {
    const errors = { ...rollTally(undefined, classifyRun('', [])), neighbour: 4 };
    const d = decide(quiet(), base({ errors, missedKeys: ['f'] }), T0 + 60_000);
    expect(d.find((x) => x.kind === 'precision')).toMatchObject({ keys: ['f'] });
    expect(d.find((x) => x.kind === 'anticipation')).toBeUndefined();
  });
  it('no error summary, or too few misses → nothing new', () => {
    expect(decide(quiet(), base(), T0 + 60_000)).toEqual([]);
    const errors = { ...rollTally(undefined, classifyRun('', [])), anticipation: 2 };
    expect(decide(quiet(), base({ errors }), T0 + 60_000)).toEqual([]);
  });
});
