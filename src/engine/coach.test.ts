import { describe, expect, it } from 'vitest';
import { KeyModel } from './keymodel';
import { decide, sessionReview, type RunSummary } from './coach';

const T0 = 1_700_000_000_000;
const base = (over: Partial<RunSummary> = {}): RunSummary => ({ thirds: [{ errors: 0, lat: 300 }, { errors: 0, lat: 300 }, { errors: 0, lat: 300 }], wpm: 20, acc: 100, rhythm: 0.9, runsOnTrail: 4, focusKeys: ['f', 'j', ' '], unlocked: ['f', 'j', ' '], passed: true, fails: 0, recentAcc: [], ...over });
const press = (m: KeyModel, k: string, n: number, ok: boolean, lat = 300, typed?: string) => { for (let i = 0; i < n; i++) m.record(k, ok, lat, T0 + i * 500, typed); };

describe('coach', () => {
  it('quiet run → no decisions', () => {
    const m = new KeyModel(); press(m, 'f', 30, true); press(m, 'j', 30, true);
    expect(decide(m, base(), T0 + 60_000)).toEqual([]);
  });
  it('a weak focus key after 3+ runs is a required remedial', () => {
    const m = new KeyModel(); press(m, 'f', 30, true); press(m, 'j', 20, true); press(m, 'j', 10, false, 300, 'f');
    const d = decide(m, base(), T0 + 60_000);
    expect(d[0]).toMatchObject({ kind: 'remedial', required: false, keys: ['j'] });
    expect(d[0]!.reason).toMatch(/J is at \d+% accuracy over 30 presses/);
    expect(decide(m, base({ runsOnTrail: 2 }), T0 + 60_000).some((x) => x.kind === 'remedial')).toBe(false);
  });
  it('4 K→D substitutions → required confusion drill on both keys', () => {
    const m = new KeyModel(); press(m, 'k', 20, true); press(m, 'd', 20, true);
    for (let i = 0; i < 4; i++) m.record('k', false, 300, T0, 'd');
    const d = decide(m, base({ focusKeys: ['k', 'd'], unlocked: ['k', 'd', 'f', 'j', ' '] }), T0 + 60_000);
    const c = d.find((x) => x.kind === 'confusion');
    expect(c).toMatchObject({ required: false, keys: ['k', 'd'] });
    expect(c!.reason).toContain('You typed D for K 4 times');
  });
  it('a key you pause before → reach offer (not required)', () => {
    const m = new KeyModel();
    for (const k of 'asdjkl') press(m, k, 30, true, 300);
    for (let i = 0; i < 30; i++) m.record('f', true, i % 2 === 1 ? 900 : 300, T0 + i * 500);
    const d = decide(m, base({ focusKeys: ['f'], unlocked: [...'asdfjkl'] }), T0 + 60_000);
    expect(d.find((x) => x.kind === 'reach')).toMatchObject({ required: false, keys: ['f'] });
  });
  it('rushing: errors climb as latency drops', () => {
    const m = new KeyModel(); press(m, 'f', 30, true);
    const d = decide(m, base({ thirds: [{ errors: 0, lat: 400 }, { errors: 1, lat: 320 }, { errors: 3, lat: 250 }], wpm: 30 }), T0 + 60_000);
    expect(d.find((x) => x.kind === 'rushing')).toBeTruthy();
  });
  it('three declining runs → fatigue note; 3 fails → steady note', () => {
    const m = new KeyModel(); press(m, 'f', 30, true);
    expect(decide(m, base({ recentAcc: [98, 94, 90] }), T0 + 60_000).find((x) => x.kind === 'fatigue')).toBeTruthy();
    expect(decide(m, base({ passed: false, fails: 3 }), T0 + 60_000).find((x) => x.kind === 'steady')).toMatchObject({ required: false });
  });
  it('session review: due keys; required when 3+ or slipped', () => {
    const m = new KeyModel(); for (const k of 'fjdk') press(m, k, 60, true);
    const day = 86_400_000;
    expect(sessionReview(m, [...'fjdk '], T0 + 60_000)).toBeNull();
    const r = sessionReview(m, [...'fjdk '], T0 + 3 * day);
    expect(r).toMatchObject({ kind: 'review', required: false });
    expect(r!.keys.sort()).toEqual(['d', 'f', 'j', 'k']);
    const one = new KeyModel(); press(one, 'f', 60, true);
    expect(sessionReview(one, ['f', 'j'], T0 + 3 * day)).toMatchObject({ required: false, keys: ['f'] });
  });
});
