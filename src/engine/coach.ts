import { KeyModel, MASTERED } from './keymodel';

export type DecisionKind = 'slow' | 'remedial' | 'confusion' | 'reach' | 'rushing' | 'review' | 'fatigue';
/** What the coach wants next. `required` decisions gate the next trail run. */
export interface Decision { kind: DecisionKind; required: boolean; keys: string[]; reason: string; title: string }

export interface RunSummary {
  /** Per-third error counts and mean latency, to spot rushing. */
  thirds: { errors: number; lat: number }[];
  wpm: number; acc: number; star2Wpm: number;
  /** Trail-level context. */
  runsOnTrail: number; focusKeys: string[]; unlocked: string[]; passed: boolean; fails: number; slowMode: boolean;
  recentAcc: number[];
}

const up = (k: string) => (k === ' ' ? 'Space' : k.toUpperCase());
const pct = (v: number) => Math.round(v * 100) + '%';

/** Decide what happens after a trail run. Ordered: required first, then offers, then notes. */
export function decide(model: KeyModel, r: RunSummary, now = Date.now()): Decision[] {
  const out: Decision[] = [];
  const letters = r.unlocked.filter((k) => k !== ' ');

  if (!r.passed && r.fails >= 3 && !r.slowMode) out.push({ kind: 'slow', required: false, keys: [], reason: 'Three misses in a row.', title: 'Slow mode?' });

  // A focus key that is clearly the blocker after enough runs: required remedial.
  if (r.runsOnTrail >= 3) {
    const weak = model.weakest(r.focusKeys.filter((k) => k !== ' '), now).filter((w) => w.mastery < 0.5 && w.err > 0.15);
    const w = weak[0];
    if (w) {
      const s = model.stat(w.key)!;
      out.push({ kind: 'remedial', required: true, keys: [w.key], title: `${up(w.key)} is holding you back`, reason: `${up(w.key)} is at ${pct(1 - s.err)} accuracy over ${s.seen} presses (mastery ${pct(w.mastery)}). A short ${up(w.key)} drill before the next run.` });
    }
  }
  // Confusion pair: you keep typing X when it wants Y.
  const c = model.confusions(4).find((x) => letters.includes(x.wanted));
  if (c) out.push({ kind: 'confusion', required: true, keys: [c.wanted, c.typed], title: `${up(c.wanted)} and ${up(c.typed)} are getting mixed up`, reason: `You typed ${up(c.typed)} for ${up(c.wanted)} ${Math.round(c.count)} times recently. Alternate them until it settles.` });
  // Searching: pauses before a key.
  const srch = model.searching(letters)[0];
  if (srch && !out.some((d) => d.keys.includes(srch.key))) out.push({ kind: 'reach', required: false, keys: [srch.key], title: `You pause before ${up(srch.key)}`, reason: `${pct(srch.spikes)} of ${up(srch.key)} presses come after a search pause. A reach drill builds the reflex.` });
  // Rushing: errors pile up as speed climbs.
  if (r.thirds.length === 3) {
    const [a, , z] = r.thirds as [RunSummary['thirds'][0], RunSummary['thirds'][0], RunSummary['thirds'][0]];
    if (z.errors >= Math.max(2, a.errors * 2) && z.lat < a.lat * 0.8) out.push({ kind: 'rushing', required: false, keys: [], title: 'You sped up and started missing', reason: `Errors went from ${a.errors} to ${z.errors} as you accelerated. Accuracy first; the speed follows.` });
  }
  // Fatigue: three declining runs.
  const ra = r.recentAcc;
  if (ra.length >= 3 && ra[ra.length - 1]! < ra[ra.length - 2]! && ra[ra.length - 2]! < ra[ra.length - 3]!) out.push({ kind: 'fatigue', required: false, keys: [], title: 'Three runs, each a little worse', reason: 'That usually means tired hands. A short break beats grinding it in.' });
  return out.sort((a, b) => Number(b.required) - Number(a.required));
}

/** Session start: rusty keys. Required when several are due or any has slipped badly. */
export function sessionReview(model: KeyModel, unlocked: string[], now = Date.now()): Decision | null {
  const due = model.dueKeys(unlocked.filter((k) => k !== ' '), now);
  if (!due.length) return null;
  const slipped = due.filter((k) => model.mastery(k, now) < 0.5);
  const required = due.length >= 3 || slipped.length > 0;
  const shown = due.slice(0, 6).map(up).join(' ');
  return { kind: 'review', required, keys: due.slice(0, 6), title: required ? 'Review before you continue' : 'A few keys are rusty', reason: `${shown} ${due.length > 1 ? 'have' : 'has'} slipped since you last practised. ${required ? 'One review pass first.' : 'Optional warm-up.'}` };
}

/** Mastery readout for a set of keys, for the result card and the map. */
export function readout(model: KeyModel, keys: string[], now = Date.now()): { key: string; mastery: number; mastered: boolean }[] {
  return keys.map((k) => { const m = model.mastery(k, now); return { key: k, mastery: m, mastered: m >= MASTERED }; });
}
