import { dominant, type ErrorTally } from './errors';
import { KeyModel, MASTERED } from './keymodel';

export type DecisionKind = 'remedial' | 'confusion' | 'reach' | 'rushing' | 'review' | 'fatigue' | 'steady' | 'anticipation' | 'precision' | 'transition';
/** What the coach wants next. `required` decisions gate the next trail run. */
export interface Decision { kind: DecisionKind; required: boolean; keys: string[]; reason: string; title: string }

export interface RunSummary {
  /** Per-third error counts and mean latency, to spot rushing. */
  thirds: { errors: number; lat: number }[];
  wpm: number; acc: number; rhythm: number;
  /** Trail-level context. */
  runsOnTrail: number; focusKeys: string[]; unlocked: string[]; passed: boolean; fails: number;
  recentAcc: number[];
  /** This run's misses by class (§29) and the keys they landed on, wanted → count. Optional for callers without strokes. */
  errors?: ErrorTally; missedKeys?: string[];
  /** Weakest two-key transitions among unlocked keys (§25), weakest first. */
  weakPairs?: { pair: string; mastery: number; slowness: number; err: number }[];
}

const up = (k: string) => (k === ' ' ? 'Space' : k.toUpperCase());
const pct = (v: number) => Math.round(v * 100) + '%';

/** Decide what happens after a trail run. Ordered: required first, then offers, then notes. */
export function decide(model: KeyModel, r: RunSummary, now = Date.now()): Decision[] {
  const out: Decision[] = [];
  const letters = r.unlocked.filter((k) => k !== ' ');

  if (!r.passed && r.fails >= 3) out.push({ kind: 'steady', required: false, keys: [], title: 'Three runs below the bar', reason: 'Slow right down and make every press deliberate — an even, slow rhythm scores as well as a fast one here, and the speed comes back on its own.' });

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
  // Error class (§29): when one kind explains most misses, the drill matches the cause.
  const dom = r.errors ? dominant(r.errors, 3, 0.4) : null;
  if (dom && !out.some((d) => d.required)) {
    const missed = (r.missedKeys ?? []).filter((k) => letters.includes(k));
    const drill = missed.length ? missed.slice(0, 4) : letters.slice(0, 4);
    if (dom.cls === 'anticipation') out.push({ kind: 'anticipation', required: false, keys: drill, title: 'You are reading ahead of your hands', reason: `${dom.count} of ${dom.total} misses were a later letter typed early. A steady drill on ${drill.map(up).join(' ')}: one key, then the next, at one pace.` });
    else if (dom.cls === 'neighbour') out.push({ kind: 'precision', required: false, keys: drill, title: 'Landing a key over', reason: `${dom.count} of ${dom.total} misses hit a neighbouring key. A precision drill on ${drill.map(up).join(' ')}: slower, and let the finger settle before it presses.` });
  }
  // Sequence (§25): a transition that flows badly against the typist's own pace.
  const wp = r.weakPairs?.[0];
  if (wp && wp.mastery < 0.35 && (wp.slowness >= 1.6 || wp.err > 0.2) && !out.some((d) => d.required)) {
    const [a, b] = [wp.pair[0]!, wp.pair[1]!];
    const how = wp.slowness >= 1.6 ? `${Math.round((wp.slowness - 1) * 100)}% slower than your usual transition` : `${pct(wp.err)} of them miss`;
    out.push({ kind: 'transition', required: false, keys: [a, b], title: `${up(a)}→${up(b)} does not flow yet`, reason: `${up(a)} then ${up(b)} runs ${how}. A drill of words built on ${up(a)}${up(b)} turns the pair into one movement.` });
  }
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
