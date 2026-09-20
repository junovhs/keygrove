import { afterEach, expect, it } from 'vitest';
import { METHODS, DEFAULT_METHOD_ID, setMethod, fingerOf } from './method';
import { fingers } from './fingers';
import { fingerLevels, fingerCourseId } from './finger-course';
import { fresh, sanitize } from '../state/save';
import { mergeProgress } from '../state/progress-sync';
afterEach(() => setMethod(DEFAULT_METHOD_ID));
for (const method of METHODS) it(`covers all base and shifted keys for ${method.id}`, () => {
  setMethod(method.id);
  for (const f of fingers()) {
    const levels = fingerLevels(f);
    expect(levels).toHaveLength(10);
    for (const l of levels) expect(l.text.length).toBeGreaterThanOrEqual(48);
    const final = levels[9]!.text;
    for (let n = 33; n <= 126; n++) {
      const k = String.fromCharCode(n);
      if (fingerOf(k) === f.id) expect(final).toContain(k);
    }
  }
});
it('includes C and V at level 3 with a fresh relaxed course', () => {
  setMethod(DEFAULT_METHOD_ID);
  const text = fingerLevels(fingers().find(f => f.id === 'li')!)[2]!.text;
  expect(text).toContain('c'); expect(text).toContain('v');
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
