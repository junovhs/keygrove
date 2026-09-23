import { expect, it } from 'vitest';
import { fresh, freshProgress, sanitize } from '../state/save';
import { FINGER_MILESTONES, KEEPSAKES, courseComplete, fingerCharmAt, ownedKeepsakes } from './keepsakes';
import { trailById } from '../curriculum';
import { FINGER_PAIRS, fingerCourseId } from '../curriculum/finger-course';
import { CHARM_ART } from '../ui/charm-art';

it('has twenty charms: eight chapters and three per finger pair, each with unique art', () => {
  expect(KEEPSAKES).toHaveLength(20);
  expect(new Set(KEEPSAKES.map(k => k.id)).size).toBe(20);
  expect(KEEPSAKES.filter(k => k.checkpoint)).toHaveLength(8);
  for (const pair of FINGER_PAIRS) expect(KEEPSAKES.filter(k => k.pair === pair.id).map(k => k.level)).toEqual([...FINGER_MILESTONES]);
  expect(KEEPSAKES.filter(k => k.holo).length).toBeGreaterThanOrEqual(4);
});

it('draws every charm as rectangular pixel art using only its own palette', () => {
  for (const k of KEEPSAKES) {
    const art = CHARM_ART[k.id]!;
    expect(art, k.id).toBeDefined();
    for (const pattern of [art.pattern, ...(art.frames ?? []), ...Object.values(art.parts ?? {})]) {
      expect(new Set(pattern.map(r => r.length)).size, k.id).toBe(1);
      for (const ch of pattern.join('')) if (ch !== '.') expect(art.palette[ch], `${k.id} uses '${ch}'`).toBeDefined();
    }
    // Animated frames stay the same size so a charm never jumps between frames.
    for (const f of art.frames ?? []) expect([f.length, f[0]!.length], k.id).toEqual([art.pattern.length, art.pattern[0]!.length]);
  }
});

it('chapter charms follow permanent checkpoint evidence, survive reload, and never use XP or dates', () => {
  const s = fresh(); expect(ownedKeepsakes(s)).toHaveLength(0);
  for (const k of KEEPSAKES.filter(k => k.checkpoint)) {
    expect(trailById(k.checkpoint!).checkpoint).toBe(true);
    s.trails[k.checkpoint!] = { ...freshProgress(), cleared: true };
  }
  expect(ownedKeepsakes(sanitize(s))).toHaveLength(8);
  expect(courseComplete(s)).toBe(true);
  s.stats.xp = 0; s.stats.days = 0;
  expect(ownedKeepsakes(s)).toHaveLength(8);
});

it('finger charms arrive exactly when both hands of a pair pass levels 4, 7 and 10', () => {
  const s = fresh(), ring = FINGER_PAIRS.find(p => p.id === 'ring')!;
  const set = (n: number, m = n) => { s.fingerCourses[fingerCourseId(ring.sides[0])] = n; s.fingerCourses[fingerCourseId(ring.sides[1])] = m; };
  set(3); expect(ownedKeepsakes(s).map(k => k.id)).toEqual([]);
  set(4, 3); expect(ownedKeepsakes(s).map(k => k.id)).toEqual([]);
  set(4); expect(ownedKeepsakes(s).map(k => k.id)).toEqual(['snake']);
  set(9); expect(ownedKeepsakes(s).map(k => k.id)).toEqual(['snake', 'koi']);
  set(10); expect(ownedKeepsakes(sanitize(s)).map(k => k.id)).toEqual(['snake', 'koi', 'crystal']);
  expect(fingerCharmAt('ring', 7)?.id).toBe('koi');
  expect(fingerCharmAt('ring', 6)).toBeUndefined();
});
