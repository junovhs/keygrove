import { describe, expect, it } from 'vitest';
import { beatInterval, evenness, onBeat, BEAT_DEFAULT_MS, BEAT_FLOOR_MS } from './beat';
import { beat, lessonExercises } from '../curriculum/lesson-flow';
import { trailById } from '../curriculum';
import { generate } from './textgen';
import { KeyModel } from './keymodel';
import { TransitionModel } from './transitions';
import { Run } from './run';
import { recordPerformance } from './learning';

describe('steady beat (spec B2/F5)', () => {
  it('the pulse is never faster than the learner, rounded slow, with a floor and a no-evidence default', () => {
    expect(beatInterval(300)).toBe(400); // 375 → 400: the floor
    expect(beatInterval(500)).toBe(650); // 625 → next 50 ms up
    expect(beatInterval(500)).toBeGreaterThanOrEqual(500);
    expect(beatInterval(0)).toBe(BEAT_DEFAULT_MS);
    expect(BEAT_FLOOR_MS).toBeLessThan(BEAT_DEFAULT_MS);
  });
  it('evenness is one word and three bars, never a number on screen', () => {
    const steady = evenness(Array(12).fill(400));
    expect(steady.word).toBe('Even'); expect(steady.bars).toBe('▇▇▇');
    const late = evenness([400, 400, 400, 400, 1200, 400, 400, 400, 400, 400, 400, 400]);
    expect(late.word).not.toBe('Even'); expect(late.bars).toHaveLength(3); expect(late.bars[1]).not.toBe('▇');
    expect(evenness([200, 900, 250, 950, 200, 900]).word).toBe('Uneven');
    expect(onBeat(1000, 0, 500)).toBe(1); expect(onBeat(1250, 0, 500)).toBe(0); expect(onBeat(1100, 0, 500)).toBeCloseTo(0.6);
  });
  it('a beat exercise is the loop text, guided, and records no evidence (DEC-11); the D5 pick wires it in', () => {
    const ex = beat('ed');
    expect(ex).toMatchObject({ name: 'Keep it even', assessment: 'guided', target: 'ed', beat: true, text: 'ed de ede ed de ede ed de' });
    expect(generate(trailById('middle-up')!, 'mix', { exercise: ex })).toBe(ex.text);
    expect(lessonExercises(trailById('ring-pair')!, { target: 'mu', form: 'beat' })[1]).toMatchObject({ beat: true, target: 'mu' });
    const keys = new KeyModel(), trans = new TransitionModel(), run = new Run(ex.text!);
    run.begin(0);
    [...ex.text!].forEach((ch, i) => { run.type(ch, (i + 1) * 400); recordPerformance(run, keys, trans, (i + 1) * 400, ex.text!.length); });
    expect(run.status).toBe('complete');
    expect(trans.pairs()).toEqual([]); expect(keys.toJSON().keys).toEqual({});
  });
});
