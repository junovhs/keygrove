import { MAIN_TRAILS, allowedChars } from '../curriculum';
import { TECHNICAL_TRANSITIONS } from '../curriculum/movements';
import type { TransitionModel } from './transitions';

/**
 * Scaffold D5 — the whole next-lesson rule. Continue always advances course position; this only picks
 * slot 2's target and form for the lesson about to run, invisibly (DEC-14).
 *
 *   eligible = targets whose two keys are unlocked
 *   fresh    = eligible never practised            → the newest-eligible one
 *   stale    = eligible unseen for > STALE_DAYS    → else the weakest of these
 *   target   = … else the weakest eligible
 *   form     = 'beat' when accurate but uneven, else 'loop'
 *
 * Thresholds are provisional until learner data exists (DEC-16).
 */
export const STALE_DAYS = 7;
export const BEAT_ERR = 0.1;
export type Pick = { target: string; form: 'loop' | 'beat' };

/** The course position at which each target's two keys are both unlocked; later = newer. */
const ELIGIBLE_AT: Readonly<Record<string, number>> = Object.fromEntries(TECHNICAL_TRANSITIONS.map((t) => [
  t.bigram, MAIN_TRAILS.findIndex((tr) => { const a = allowedChars(tr); return a.has(t.bigram[0]!) && a.has(t.bigram[1]!); }),
]));

export function nextPractice(trans: TransitionModel, unlocked: ReadonlySet<string>, now = Date.now()): Pick | null {
  const eligible = TECHNICAL_TRANSITIONS.map((t) => t.bigram).filter((b) => unlocked.has(b[0]!) && unlocked.has(b[1]!));
  if (!eligible.length) return null;
  const fresh = eligible.filter((b) => !trans.stat(b));
  const stale = eligible.filter((b) => trans.stat(b) && now - trans.stat(b)!.last > STALE_DAYS * 86_400_000);
  const weakest = (list: string[]) => list.reduce((a, b) => (trans.mastery(b) < trans.mastery(a) ? b : a));
  const target = fresh.length ? fresh.reduce((a, b) => (ELIGIBLE_AT[b]! > ELIGIBLE_AT[a]! ? b : a)) : weakest(stale.length ? stale : eligible);
  const s = trans.stat(target);
  const form = s && s.err <= BEAT_ERR && trans.unevenness(target) > 0.6 ? 'beat' : 'loop';
  return { target, form };
}
