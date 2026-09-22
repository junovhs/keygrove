import { describe, expect, it } from 'vitest';
import { allowedChars, trailById } from '../curriculum';
import { lessonExercises } from '../curriculum/lesson-flow';
import { TransitionModel } from './transitions';
import { nextPractice } from './next-practice';

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;
const keys = (id: string) => new Set([...allowedChars(trailById(id)!)].filter((k) => k.length === 1 && k === k.toLowerCase()));
/** A pair practised `n` times at `lat` ms (± `jitter`), with `err` misses, last seen `agoDays` ago. */
function practised(m: TransitionModel, pair: string, { lat = 300, jitter = 0, err = 0, n = 12, agoDays = 0 } = {}) {
  for (let i = 0; i < n; i++) m.record(pair[0]!, pair[1]!, i >= n * (1 - err) ? false : true, lat + (i % 2 ? jitter : -jitter), NOW - agoDays * DAY);
}
const baseline = () => { const m = new TransitionModel(); for (const p of ['th', 'he', 'in', 'er', 'an']) practised(m, p); return m; };

describe('next-lesson rule (scaffold D5)', () => {
  it('no eligible target before E D; then `ed` is the first fresh target (spec C1)', () => {
    expect(nextPractice(new TransitionModel(), keys('inner-pair'), NOW)).toBeNull();
    expect(nextPractice(new TransitionModel(), keys('middle-up'), NOW)).toEqual({ target: 'ed', form: 'loop' });
  });
  it('a never-practised target wins, the newest-eligible one first; then the weakest against the learner’s own pace', () => {
    const m = baseline();
    practised(m, 'ed'); practised(m, 'de'); practised(m, 'um');
    expect(nextPractice(m, keys('ring-pair'), NOW)!.target).toBe('mu'); // R U came after E D: newest fresh
    practised(m, 'mu', { lat: 600 }); // 2× the reference
    expect(nextPractice(m, keys('ring-pair'), NOW)!.target).toBe('mu');
  });
  it('a target unseen for more than a week returns before a weaker one practised today', () => {
    const m = baseline();
    practised(m, 'ed', { agoDays: 8 }); practised(m, 'de', { lat: 500 }); practised(m, 'mu', { lat: 450 }); practised(m, 'um');
    expect(nextPractice(m, keys('ring-pair'), NOW)!.target).toBe('ed');
  });
  it('a new-key lesson only gives slot 2 to a technical target that uses one of those new keys', () => {
    expect(nextPractice(new TransitionModel(), keys('middle-up'), NOW, 'ei')!.target).toBe('ed');
    expect(nextPractice(new TransitionModel(), keys('index-reach'), NOW, 'gh')).toBeNull(); // rehearse G/H instead of old E/D
    expect(nextPractice(new TransitionModel(), keys('index-up'), NOW, 'ru')!.target).toBe('mu'); // U unlocks MU/UM
  });
  it('accurate but uneven → beat; otherwise loop', () => {
    const m = baseline();
    practised(m, 'ed', { lat: 300, jitter: 250 }); practised(m, 'de'); practised(m, 'mu'); practised(m, 'um');
    expect(m.unevenness('ed')).toBeGreaterThan(0.6);
    expect(nextPractice(m, keys('ring-pair'), NOW)).toEqual({ target: 'ed', form: 'beat' });
    const n = baseline();
    practised(n, 'ed', { lat: 300, jitter: 250, err: 0.3 }); practised(n, 'de'); practised(n, 'mu'); practised(n, 'um');
    expect(nextPractice(n, keys('ring-pair'), NOW)!.form).toBe('loop');
  });
  it('never returns a target whose keys are not unlocked; the pick drives slot 2 and slot 3 of the lesson', () => {
    const m = baseline();
    for (const p of ['ed', 'de', 'mu', 'um']) practised(m, p);
    practised(m, 'lo', { lat: 900 }); // L O not both unlocked at lesson 8 (O is Canopy)
    const pick = nextPractice(m, keys('ring-pair'), NOW)!;
    expect(pick.target).not.toBe('lo');
    const ex = lessonExercises(trailById('ring-pair')!, { target: 'mu', form: 'loop' });
    expect(ex[1]).toMatchObject({ name: 'Connect M and U', target: 'mu' });
    expect(ex[2]).toMatchObject({ format: 'words', target: 'mu' });
    expect(lessonExercises(trailById('home-words')!, { target: 'mu', form: 'loop' })[2]!.target).toBe('ing'); // a chunk lesson keeps its chunk (spec C4)
  });
});
