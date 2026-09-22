import { afterEach, describe, expect, it } from 'vitest';
import { GROVES, MAIN_TRAILS, cumulativeKeys, trailsInGrove } from '../curriculum';
import { lessonExercises } from '../curriculum/lesson-flow';
import { DEFAULT_METHOD_ID, METHODS, fingerOf, handOf, setMethod, type FingerId } from '../curriculum/method';
import { addLoad, emptyLoad, peakFinger, generate, FINGER_CAP, type Load } from './textgen';
afterEach(() => setMethod(DEFAULT_METHOD_ID));

/** Letter groves: everything before Shift. Later groves mix numbers/symbols and are assessed separately. */
const LETTER_GROVES = GROVES.filter(g => g.n <= 4).map(g => g.id);
const SEEDS = 30;
const share = (l: Load) => (l.left + l.right ? l.left / (l.left + l.right) : 0.5);
const fingersUnlocked = (keys: Set<string>) => new Set([...keys].map(k => fingerOf(k)).filter((f): f is FingerId => !!f && f !== 'thumb')).size;

describe('hand and finger load balance in the main course (spec §31: no hand or finger is overworked)', () => {
  for (const method of METHODS) {
    it(`${method.name}: every words/passage exercise in the letter groves stays within 40–60 left/right and under the finger cap`, () => {
      setMethod(method.id);
      const report: string[] = [];
      for (const gid of LETTER_GROVES) for (const t of trailsInGrove(gid)) for (const ex of lessonExercises(t)) {
        if (ex.format === 'movement' || ex.assessment === 'guided') continue;
        // An etude concentrates on one movement and may sit on one hand (spec B3); the grove-level check below still includes it.
        if (ex.target) continue;
        let load = emptyLoad();
        for (let seed = 0; seed < SEEDS; seed++) load = addLoad(load, generate(t, ex.stage, { exercise: ex, seed: seed * 7919 + 1 }));
        const left = share(load);
        // With only a few fingers unlocked an even split still leaves each finger a large share.
        const cap = Math.max(FINGER_CAP + 0.05, 1 / fingersUnlocked(cumulativeKeys(t).keys) + 0.1);
        // The fingers a lesson introduces are meant to work; they may take up to half. Every other finger stays under the cap.
        const introduced = new Set([...t.newKeys].map(k => fingerOf(k)));
        const total = load.left + load.right;
        const peak = peakFinger(load);
        report.push(`${t.id}/${ex.name}: L ${Math.round(left * 100)}% peak finger ${Math.round(peak * 100)}% (cap ${Math.round(cap * 100)}%)`);
        expect(left, `${t.id}/${ex.name} left share ${left.toFixed(2)}`).toBeGreaterThanOrEqual(0.4);
        expect(left, `${t.id}/${ex.name} left share ${left.toFixed(2)}`).toBeLessThanOrEqual(0.6);
        expect(peak, `${t.id}/${ex.name} busiest finger ${peak.toFixed(2)}`).toBeLessThanOrEqual(0.5);
        for (const [f, n] of Object.entries(load.fingers) as [FingerId, number][]) {
          if (introduced.has(f)) continue;
          expect(n / total, `${t.id}/${ex.name} ${f} carries ${(n / total).toFixed(2)} > cap ${cap.toFixed(2)}`).toBeLessThanOrEqual(cap);
        }
      }
      expect(report.length).toBeGreaterThan(20);
    });
  }
  it('movement blocks split exactly evenly between hands', () => {
    for (const t of MAIN_TRAILS.filter(t => t.newKeys && ['rhythm', 'words'].includes(t.kind))) for (const ex of lessonExercises(t)) {
      if (ex.format !== 'movement' || ex.assessment === 'guided') continue;
      // A transition loop isolates one movement, usually on one hand (spec B1); the chapter totals still include it.
      if (ex.target) continue;
      // A single-finger focus can be deliberately one-sided; chapter totals still include it.
      if (new Set([...t.newKeys].map(k => handOf(fingerOf(k)!))).size < 2) continue;
      let load = emptyLoad();
      for (let seed = 0; seed < SEEDS; seed++) load = addLoad(load, generate(t, ex.stage, { exercise: ex, seed }));
      const left = share(load);
      expect(left, `${t.id}/${ex.name}`).toBeGreaterThanOrEqual(0.45);
      expect(left, `${t.id}/${ex.name}`).toBeLessThanOrEqual(0.55);
    }
  });
  it('each letter grove as a whole is within 45–55 left/right', () => {
    for (const gid of LETTER_GROVES) {
      let load = emptyLoad();
      for (const t of trailsInGrove(gid)) for (const ex of lessonExercises(t)) for (let seed = 0; seed < SEEDS; seed++) load = addLoad(load, generate(t, ex.stage, { exercise: ex, seed }));
      const left = share(load);
      expect(left, `${gid} left share ${left.toFixed(2)}`).toBeGreaterThanOrEqual(0.45);
      expect(left, `${gid} left share ${left.toFixed(2)}`).toBeLessThanOrEqual(0.55);
    }
  });
});
