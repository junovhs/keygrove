import { afterEach, describe, expect, it } from 'vitest';
import { MAIN_TRAILS, allowedChars, resolveCopy, trailById, trailsInGrove } from './index';
import { lessonExercises } from './lesson-flow';
import { briefedTrails, briefingFor } from './briefings';
import { DEFAULT_METHOD_ID, METHODS, setMethod } from './method';
afterEach(() => setMethod(DEFAULT_METHOD_ID));

describe('exercise briefings', () => {
  it('cover every Roots exercise with exactly three tips, and nothing outside Roots', () => {
    for (const t of trailsInGrove('roots')) lessonExercises(t).forEach((_, i) => {
      const b = briefingFor(t, i);
      expect(b, `${t.id} exercise ${i + 1}`).not.toBeNull();
      expect(b!.tips).toHaveLength(3);
      expect(briefingFor(t, lessonExercises(t).length), `${t.id} has no extra briefing`).toBeNull();
    });
    for (const t of MAIN_TRAILS.filter(t => t.grove !== 'roots')) expect(briefingFor(t, 0), t.id).toBeNull();
    expect(new Set(briefedTrails())).toEqual(new Set(trailsInGrove('roots').map(t => t.id)));
  });
  it('resolve every finger placeholder under both methods and only light keys the exercise has met', () => {
    for (const m of METHODS) {
      setMethod(m.id);
      for (const id of briefedTrails()) {
        const t = trailById(id), allowed = allowedChars(t);
        lessonExercises(t).forEach((_, i) => {
          const b = briefingFor(t, i)!;
          for (const tip of b.tips) {
            const text = resolveCopy(tip.body);
            expect(text, `${id}/${i}: ${tip.title}`).not.toMatch(/\{.\}/);
            expect(tip.title.length).toBeLessThan(40);
            expect(text.length).toBeLessThan(180);
            for (const k of tip.keys ?? '') expect(allowed.has(k), `${id}/${i} lights ${JSON.stringify(k)} before it is taught`).toBe(true);
          }
        });
      }
    }
  });
  it('names the fingers the active method assigns', () => {
    setMethod(DEFAULT_METHOD_ID);
    expect(resolveCopy(briefingFor(trailById('anchors'), 0)!.tips[0].body)).toBe('Find the F key with your left index and the J key with your right index.');
    expect(resolveCopy(briefingFor(trailById('inner-pair'), 0)!.tips[0].body)).toContain('left middle');
  });
});
