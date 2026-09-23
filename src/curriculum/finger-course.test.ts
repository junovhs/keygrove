import { afterEach, expect, it } from 'vitest';
import { METHODS, DEFAULT_METHOD_ID, setMethod, fingerOf } from './method';
import { fingers } from './fingers';
import { fingerLevels, fingerCourseId } from './finger-course';
import { fresh, sanitize } from '../state/save';
import { mergeProgress } from '../state/progress-sync';
afterEach(() => setMethod(DEFAULT_METHOD_ID));
for (const method of METHODS) it(`gives ${method.id} ten levels with same-finger reach patterns first`, () => {
  setMethod(method.id);
  for (const f of fingers()) {
    const levels = fingerLevels(f);
    expect(levels).toHaveLength(10);
    // Levels 1–4 are fixed reach patterns; 5–10 are generated per run (key coverage is checked in finger-practice.test.ts).
    levels.forEach((l, i) => { if (i < 4) expect(l.text.length).toBeGreaterThanOrEqual(48); else expect(l.text).toBe(''); });
    expect(levels.slice(0, 4).every(l => [...l.text].every(k => k === ' ' || fingerOf(k) === f.id))).toBe(true);
  }
});
it('includes B and V at level 3 of a fresh left-index course', () => {
  const text = fingerLevels(fingers().find(f => f.id === 'li')!)[2]!.text;
  expect(text).toContain('b'); expect(text).toContain('v');
});
it('roundtrips and merges independent method/finger progress without advancing the course', () => {
  const a = fresh(), b = fresh();
  a.fingerCourses[fingerCourseId('li')] = 3;
  b.fingerCourses[fingerCourseId('li')] = 7;
  b.fingerCourses[fingerCourseId('rp')] = 2;
  const merged = mergeProgress(sanitize(JSON.parse(JSON.stringify(a))), b);
  expect(merged.fingerCourses[fingerCourseId('li')]).toBe(7);
  expect(merged.fingerCourses[fingerCourseId('rp')]).toBe(2);
  expect(merged.trails).toEqual({}); expect(merged.trail).toBe('anchors');
  expect(sanitize({ fingerCourses: { [fingerCourseId('li')]: 999, junk: 5 } }).fingerCourses).toEqual({ [fingerCourseId('li')]: 10 });
  expect(sanitize({ v: 6 }).fingerCourses).toEqual({});
});
