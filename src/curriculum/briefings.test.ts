import { afterEach, describe, expect, it } from 'vitest';
import { MAIN_TRAILS, allowedChars, resolveCopy, trailById, trailsInGrove } from './index';
import { briefedTrails, briefingFor } from './briefings';
import { DEFAULT_METHOD_ID, METHODS, setMethod } from './method';
afterEach(() => setMethod(DEFAULT_METHOD_ID));

describe('lesson briefings', () => {
  it('cover every Roots lesson with one to four steps, and nothing outside Roots', () => {
    for (const t of trailsInGrove('roots')) {
      const b = briefingFor(t);
      expect(b, t.id).not.toBeNull();
      expect(b!.tips.length).toBeGreaterThanOrEqual(1);
      expect(b!.tips.length).toBeLessThanOrEqual(4);
    }
    for (const t of MAIN_TRAILS.filter(t => t.grove !== 'roots')) expect(briefingFor(t), t.id).toBeNull();
    expect(new Set(briefedTrails())).toEqual(new Set(trailsInGrove('roots').map(t => t.id)));
  });
  it('resolve every finger placeholder under both methods and only light or ask for keys the lesson has met', () => {
    for (const m of METHODS) {
      setMethod(m.id);
      for (const id of briefedTrails()) {
        const t = trailById(id), allowed = allowedChars(t), b = briefingFor(t)!;
        for (const tip of b.tips) {
          const text = resolveCopy(tip.body);
          expect(text, `${id}: ${tip.title}`).not.toMatch(/\{.\}/);
          expect(tip.title.length).toBeLessThan(44);
          expect(text.length).toBeLessThan(200);
          for (const k of (tip.keys ?? '') + (tip.press ?? '')) expect(allowed.has(k), `${id} uses ${JSON.stringify(k)} before it is taught`).toBe(true);
          if (tip.press) for (const k of tip.press) expect(tip.keys ?? '', `${id}: pressed keys are lit`).toContain(k);
        }
      }
    }
  });
  it('opens each new-key lesson with an interactive press step for exactly its new keys', () => {
    for (const id of ['anchors', 'inner-pair', 'middle-up', 'index-reach']) {
      const t = trailById(id), first = briefingFor(t)!.tips[0]!;
      expect(first.press, id).toBe(t.newKeys);
    }
    expect(resolveCopy(briefingFor(trailById('anchors'))!.tips[0]!.body)).toBe('Press F with your left index, then J with your right index.');
  });
});
