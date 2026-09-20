import { describe, expect, it } from 'vitest';
import { fresh } from '../state/save';
import { applyRun, currentTrail, groveOpen, stageFor } from './progress';
import { KeyModel } from './keymodel';

const T = 1_700_000_000_000;
const sample = (acc = 100, stage: 'drill' | 'words' = 'words') => ({ hits: 40, attempts: 40, maxCombo: 40, wpm: 8, acc, rhythm: 0.2, now: T, stage });
const learn = (m: KeyModel, keys: string) => { for (const k of keys) for (let i = 0; i < 30; i++) m.record(k, true, 400, T); };
describe('evidence-based course', () => {
  it('requires volume and a second accurate sample, not five compulsory runs', () => {
    const s = fresh(), m = new KeyModel();
    expect(stageFor(currentTrail(s), m, T)).toBe('drill');
    learn(m, 'fj ');
    expect(applyRun(s, m, sample()).firstClear).toBe(false);
    expect(applyRun(s, m, sample()).firstClear).toBe(true);
    expect(s.trail).toBe('inner-pair');
  });
  it('cannot advance on repeated scores without key coverage', () => {
    const s = fresh(), m = new KeyModel(); learn(m, 'f ');
    for (let i = 0; i < 12; i++) expect(applyRun(s, m, sample()).firstClear).toBe(false);
    expect(s.trail).toBe('anchors');
  });
  it('requires transfer after accurate drill practice', () => {
    const s = fresh(), m = new KeyModel(); learn(m, 'fj ');
    applyRun(s, m, sample(100, 'drill'));
    expect(applyRun(s, m, sample(100, 'drill')).firstClear).toBe(false);
    expect(applyRun(s, m, sample()).firstClear).toBe(true);
  });
  it('a recent accuracy miss requires another stable sample', () => {
    const s = fresh(), m = new KeyModel(); learn(m, 'fj ');
    applyRun(s, m, sample(70));
    expect(applyRun(s, m, sample()).firstClear).toBe(false);
    expect(applyRun(s, m, sample()).firstClear).toBe(true);
  });
  it('a checkpoint needs 97% transfer, never rhythm stars or speed', () => {
    const s = fresh(), m = new KeyModel(); s.trail = 'roots-checkpoint'; learn(m, 'fjdkeiru ');
    applyRun(s, m, sample(95));
    expect(applyRun(s, m, sample(95)).firstClear).toBe(false);
    expect(applyRun(s, m, sample(98))).toMatchObject({ firstClear: true, advance: 'grove' });
    expect(groveOpen(s, 'home')).toBe(true);
  });
  it('absence never revokes demonstrated control or opens a new path', () => {
    const s = fresh(), m = new KeyModel(); learn(m, 'fj ');
    applyRun(s, m, sample()); applyRun(s, m, sample());
    expect(m.mastery('f', T + 90 * 86400000)).toBe(m.mastery('f', T));
    expect(s.trails.anchors!.cleared).toBe(true);
    expect(groveOpen(s, 'home')).toBe(false);
  });
});
