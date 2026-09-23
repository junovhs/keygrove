import { afterEach, describe, expect, it } from 'vitest';
import { MAIN_TRAILS, allowedChars, renderCopy, resolveCopy, trailById, trailsInGrove } from './index';
import { lessonExercises } from './lesson-flow';
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

describe('copy tokens (UI-13)', () => {
  it('render a key as a keycap chip and a finger as its name, escaping everything else', () => {
    expect(renderCopy('[s] uses your {s}.')).toBe('<kbd class="keycap-inline">S</kbd> uses your left ring.');
    expect(renderCopy('Hold [shift]; press [space] & <b>')).toBe('Hold <kbd class="keycap-inline">Shift</kbd>; press <kbd class="keycap-inline">Space</kbd> &#38; &#60;b&#62;');
    expect(renderCopy('[[] and []]')).toBe('<kbd class="keycap-inline">[</kbd> and <kbd class="keycap-inline">]</kbd>');
    expect(renderCopy('No tokens here.')).toBe('No tokens here.');
    expect(resolveCopy('[s] uses your {s}.')).toBe('S uses your left ring.');
  });
  it('leave no key named as a bare capital in lessons 1–20 briefings and exercises', () => {
    // A lone capital letter that is not the article "A" before a lower-case word is a key name outside a token.
    const bare = (s: string) => [...s.matchAll(/(?<![A-Za-z[{])[A-Z](?![A-Za-z\]}])/g)].filter(m => !(m[0] === 'A' && /^ (?!uses\b)[a-z]/.test(s.slice(m.index! + 1)))).map(m => m[0]);
    for (const t of MAIN_TRAILS.slice(0, 20)) {
      const b = briefingFor(t);
      const copy = [...(b ? b.tips.flatMap(tip => [tip.title, tip.body]) : []), ...lessonExercises(t).flatMap(e => [e.name, e.instruction])];
      for (const c of copy) expect(bare(c), `${t.id}: ${c}`).toEqual([]);
    }
  });
});
