import { expect, it } from 'vitest';
import { fresh, freshProgress, sanitize } from '../state/save';
import { KEEPSAKES, courseComplete, ownedKeepsakes } from './keepsakes';
import { trailById } from '../curriculum';
it('keepsakes follow permanent checkpoint evidence, survive reload, and never use XP or dates', () => {
 const s = fresh(); expect(ownedKeepsakes(s)).toHaveLength(0);
 for (const k of KEEPSAKES) {
  expect(trailById(k.checkpoint).checkpoint).toBe(true);
  s.trails[k.checkpoint] = { ...freshProgress(), cleared: true };
 }
 expect(ownedKeepsakes(sanitize(s))).toHaveLength(8);
 expect(courseComplete(s)).toBe(true);
 s.stats.xp = 0; s.stats.days = 0;
 expect(ownedKeepsakes(s)).toHaveLength(8);
});
