import { afterEach, describe, expect, it } from 'vitest';
import { MAIN_TRAILS, allowedChars, resolveCopy, trailById, trailsInGrove } from './index';
import { briefedTrails, briefingFor } from './briefings';
import { DEFAULT_METHOD_ID, METHODS, isShifted, setMethod } from './method';
afterEach(() => setMethod(DEFAULT_METHOD_ID));

describe('lesson briefings', () => {
  it('mention Shift only where the lesson has a shifted character, and never an unexplained "Shift guide"', () => {
    for (const t of MAIN_TRAILS) {
      const b = briefingFor(t);
      if (!b) continue;
      const text = b.tips.map(tip => tip.body).join(' ');
      expect(text, t.id).not.toMatch(/Shift guide/);
      if (!t.shift && ![...t.newKeys].some(isShifted)) expect(text, t.id).not.toMatch(/shift/i);
    }
    const ringPair = briefingFor(trailById('ring-pair'))!.tips[0]!;
    expect(resolveCopy(ringPair.body)).toBe('S uses your left ring. L uses your right ring.');
  });
  it('cover Roots and every later new movement with one to four short steps', () => {
    for (const t of trailsInGrove('roots')) {
      const b = briefingFor(t);
      expect(b, t.id).not.toBeNull();
      expect(b!.tips.length).toBeGreaterThanOrEqual(1);
      expect(b!.tips.length).toBeLessThanOrEqual(4);
    }
    for (const t of MAIN_TRAILS.filter(t => t.newKeys || t.shift)) {
      expect(briefingFor(t), t.id).not.toBeNull();
      expect(briefingFor(t)!.tips.length).toBeLessThanOrEqual(4);
    }
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
