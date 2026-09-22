import { baseKey, fingerOf, type TypingMethod } from '../curriculum/method';
import type { Keystroke } from './run';

/**
 * Error classification (docs/typing-method-spec.md §29). A miss is read against
 * the text around it before the keyboard around it: what the hands *meant* is
 * more useful to the coach than which key sits next door.
 *
 *   repetition   typed the character just typed again ("thee" for "the")
 *   omission     dropped the second of a doubled letter ("al" for "all")
 *   anticipation typed a character that comes 1–3 places later ("from" for "form")
 *   neighbour    typed a physically adjacent key ("r" for "e")
 *   finger       typed another key owned by the same finger under the active method
 *   timing       the right key, but after a pause > 2× this run's median interval
 *   other        none of the above
 */
export type ErrorClass = 'repetition' | 'omission' | 'anticipation' | 'neighbour' | 'finger' | 'timing' | 'other';
export const ERROR_CLASSES: readonly ErrorClass[] = ['repetition', 'omission', 'anticipation', 'neighbour', 'finger', 'timing', 'other'];
export type ErrorTally = Record<ErrorClass, number>;

export const emptyTally = (): ErrorTally => ({ repetition: 0, omission: 0, anticipation: 0, neighbour: 0, finger: 0, timing: 0, other: 0 });

/** Row-staggered QWERTY: x = column + row offset (in key widths). Adjacent = within one key width, one row. */
const ROWS: { keys: string; offset: number }[] = [
  { keys: '`1234567890-=', offset: 0 },
  { keys: 'qwertyuiop[]\\', offset: 0.5 },
  { keys: "asdfghjkl;'", offset: 0.75 },
  { keys: 'zxcvbnm,./', offset: 1.25 },
];
const POS: Record<string, { x: number; row: number }> = {};
ROWS.forEach(({ keys, offset }, row) => { [...keys].forEach((k, col) => { POS[k] = { x: col + offset, row }; }); });

/** Physically adjacent keys on a row-staggered board (diagonals included). */
export function isNeighbour(a: string, b: string): boolean {
  const p = POS[baseKey(a)], q = POS[baseKey(b)];
  if (!p || !q || (p.x === q.x && p.row === q.row)) return false;
  return Math.abs(p.row - q.row) <= 1 && Math.abs(p.x - q.x) <= 1;
}

const SPIKE_RATIO = 2;

/**
 * Classify one miss from its text context. `text` is the run text, `i` the index of the wanted char,
 * `typed` what was pressed. Text-derived classes come first: they say what the hands meant.
 */
export function classifyMiss(text: string, i: number, typed: string, method?: TypingMethod): ErrorClass {
  const wanted = text[i] ?? '';
  const t = typed.toLowerCase(), w = wanted.toLowerCase();
  if (!w || t === w) return 'other';
  const prev = (text[i - 1] ?? '').toLowerCase();
  const next = (text[i + 1] ?? '').toLowerCase();
  if (prev && t === prev && t !== next) return 'repetition';
  if (prev === w && next && t === next) return 'omission';
  // Reading ahead stays inside the word: a letter from the next word is not anticipation.
  for (let d = 1; d <= 3; d++) { const c = (text[i + d] ?? '').toLowerCase(); if (!c || c === ' ') break; if (c === t) return 'anticipation'; }
  if (isNeighbour(w, t)) return 'neighbour';
  const fw = fingerOf(w, method), ft = fingerOf(t, method);
  // 'finger' = the wanted and typed keys share an assigned finger; a pattern, not a claim about which finger pressed.
  if (fw && ft && fw === ft && fw !== 'thumb') return 'finger';
  return 'other';
}

/** Per-run tally over the strokes of a finished (or abandoned) run. */
export function classifyRun(text: string, strokes: readonly Keystroke[], method?: TypingMethod): ErrorTally {
  const tally = emptyTally();
  const lats = strokes.slice(1).filter((s) => s.correct).map((s) => s.latencyMs).filter((l) => l > 0).sort((a, b) => a - b);
  const median = lats.length >= 4 ? lats[Math.floor(lats.length / 2)]! : 0;
  strokes.forEach((s, n) => {
    if (s.correct) { if (n > 0 && median && s.latencyMs > SPIKE_RATIO * median) tally.timing++; return; }
    tally[classifyMiss(text, s.index, s.typed, method)]++;
  });
  return tally;
}

/** Old evidence fades so the rolling picture follows recent play. */
export const TALLY_DECAY = 0.7;
export function rollTally(rolling: Partial<ErrorTally> | undefined, run: ErrorTally): ErrorTally {
  const out = emptyTally();
  for (const c of ERROR_CLASSES) out[c] = Math.round(((rolling?.[c] ?? 0) * TALLY_DECAY + run[c]) * 100) / 100;
  return out;
}

const COPY: Record<ErrorClass, string> = {
  anticipation: 'you are reading ahead of your hands',
  neighbour: 'the finger lands a key over',
  finger: 'a nearby key that shares a finger with the one wanted; check which key that finger reaches for',
  repetition: 'a key is getting doubled',
  omission: 'doubled letters are losing one',
  timing: 'the right key, after a pause',
  other: '',
};

/** The class that explains most of this run's misses (more than `share` of them, at least `minCount`). Misses only: timing is a note, not a miss. */
export function dominant(t: ErrorTally, minCount = 2, share = 0.5): { cls: ErrorClass; count: number; total: number } | null {
  const misses = ERROR_CLASSES.filter((c) => c !== 'timing');
  const total = misses.reduce((a, c) => a + t[c], 0);
  if (!total) return null;
  const top = misses.filter((c) => c !== 'other').sort((a, b) => t[b] - t[a])[0]!;
  return t[top] >= minCount && t[top] / total > share ? { cls: top, count: t[top], total } : null;
}

/** A sentence for the result card, or null when no class stands out. */
export function explain(t: ErrorTally): string | null {
  const d = dominant(t);
  if (!d) return null;
  const all = d.count === d.total;
  // DEC-15: the class is named by what was observed (two keys under one finger), never by which finger was used.
  return `${all ? 'All' : 'Mostly'} ${d.cls === 'finger' ? 'same-finger slips' : d.cls + ' errors'} — ${COPY[d.cls]}.`;
}
