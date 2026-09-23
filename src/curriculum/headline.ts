import { COMMON_TRANSITIONS, EVERYDAY_WORDS, PRACTICE_WORDS as RESEARCH_CARRIERS } from './movements';
import { PRACTICE_WORDS } from './language';
import { cumulativeKeys } from './index';
import type { Trail } from './types';

/** Words never offered to a beginner as practice, whatever their frequency (subtitle English is frank). */
export const EXCLUDED_WORDS: ReadonlySet<string> = new Set([
  'iii', 'diff', 'ref', 'gnu', 'thru', 'thy', 'sol', 'jeff', 'murder', 'murders', 'murdered', 'murderer', 'die', 'dies', 'died', 'dead',
  'kill', 'killed', 'killing', 'killer', 'sex', 'sexy', 'naked', 'drunk', 'drug', 'drugs', 'gun', 'guns', 'blood', 'bloody', 'hell', 'damn', 'huh', 'hmm',
]);

const fits = (w: string, allowed: ReadonlySet<string>) => [...w].every((c) => allowed.has(c));

/** How many carriers a words line draws on: enough variety, still the most useful words (the research uses 12 per target). */
export const CARRIER_POOL = 12;
/** Everyday words that carry `target` and are typeable from `allowed`: the research carriers, then the authored early
 * vocabulary, then the research everyday-word list by frequency — the CARRIER_POOL most useful, shortest first, so an
 * early, sparse key set still gets real words for its movement. */
export function carriersOf(target: string, allowed: ReadonlySet<string>): string[] {
  const ok = (w: string) => w.includes(target) && fits(w, allowed) && !EXCLUDED_WORDS.has(w);
  const ranked = [...new Set([...(RESEARCH_CARRIERS[target] ?? []), ...PRACTICE_WORDS, ...EVERYDAY_WORDS])].filter(ok);
  return ranked.slice(0, CARRIER_POOL).sort((a, b) => a.length - b.length);
}
/** Everyday staples missing from the research list: it keeps mostly lower-case words, and subtitles usually capitalise
 * these at the start of a line. */
const SENTENCE_STARTERS: readonly string[] = ['what', 'how', 'where', 'why', 'no', 'yes', 'well', 'okay'];
/** The one vocabulary for generic words and passages: the authored early words, then the research everyday words. */
export const VOCABULARY: readonly string[] = [...new Set([...PRACTICE_WORDS, ...SENTENCE_STARTERS, ...EVERYDAY_WORDS])].filter((w) => !EXCLUDED_WORDS.has(w));
/** The Flow grove's 200 common words: the staples above, then the most frequent everyday words. */
export const COMMON_WORDS: readonly string[] = [...new Set([...SENTENCE_STARTERS, ...EVERYDAY_WORDS])].filter((w) => !EXCLUDED_WORDS.has(w)).slice(0, 200);
/** Short, very common everyday words that let a words line read as language between carriers. */
export const NEUTRAL_WORDS: readonly string[] = EVERYDAY_WORDS.slice(0, 300).filter((w) => w.length <= 5 && !EXCLUDED_WORDS.has(w));

/** Enough carriers for a words line that is about the movement rather than about one repeated word. */
export const MIN_CARRIERS = 4;

const cache = new Map<string, string | null>();
/**
 * A new-key lesson's headline movement when no technical target applies (CURR-50): the most common bigram in English —
 * universal across books, web and subtitles — that uses one of the lesson's new letters, has both letters unlocked, is
 * two different letters, and has at least MIN_CARRIERS everyday words to carry it. Null when the lesson introduces no
 * letter or nothing qualifies. Pure and deterministic for a trail, so every caller agrees on the lesson's shape.
 */
export function headlineOf(trail: Trail): string | null {
  if (cache.has(trail.id)) return cache.get(trail.id)!;
  const fresh = new Set([...trail.newKeys].filter((k) => /[a-z]/.test(k)));
  const keys = cumulativeKeys(trail).keys;
  const found = fresh.size ? COMMON_TRANSITIONS.map((c) => c.bigram).find((b) =>
    b[0] !== b[1] && (fresh.has(b[0]!) || fresh.has(b[1]!)) && keys.has(b[0]!) && keys.has(b[1]!) && carriersOf(b, keys).length >= MIN_CARRIERS) ?? null : null;
  cache.set(trail.id, found);
  return found;
}
