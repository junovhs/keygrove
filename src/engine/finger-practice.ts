import { FINGER_TWISTERS } from '../curriculum/language';
import { VOCABULARY } from '../curriculum/headline';
import { rng, shuffle } from './rng';
import { fingerById } from '../curriculum/fingers';
import { baseKey, fingerOf, type FingerId } from '../curriculum/method';
import { fingerLevels, fingerCourseId, pairCompleted, FINGER_PASS_ACC, type FingerPair } from '../curriculum/finger-course';
import type { Run } from './run';

/** Require enough correct target presses to distinguish familiarity from a few lucky hits. */
export const MIN_FINGER_HITS = 20;
/** Snapshot of the sides deliberately exercised by this passage; incidental word letters cannot earn a level. */
export interface FingerPractice { text: string; sides: readonly FingerId[]; helperKeys: string[] }

/** Alternate both sides' tokens, or concentrate on the unfinished side after a partial pass. */
export function fingerPractice(pair: FingerPair, level: number, progress: Readonly<Record<string, number>>, opts: { known?: ReadonlySet<string>; seed?: number } = {}): FingerPractice {
  const pending = pair.sides.filter(id => (progress[fingerCourseId(id)] ?? 0) <= level);
  const sides: readonly FingerId[] = pending.length ? pending : pair.sides;
  const r = rng(opts.seed);
  // Without a course record (tests, tools) every printable key counts as known.
  const allowed = new Set<string>(opts.known ?? Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i).toLowerCase()));
  for (const id of pair.sides) for (const k of fingerById(id)!.keys) if (/[a-z;,./]/.test(k)) allowed.add(k);
  const helperKeys: string[] = [];

  if (level < 4) {
    const passages = sides.map(id => {
      const f = fingerById(id)!;
      const text = level === 0 ? f.anchor.repeat(24) : fingerLevels(f)[level]!.text;
      return text.replaceAll(' ', '').slice(0, level === 3 ? 36 : 24).match(/.{1,6}/g)!;
    });
    const blocks: string[] = [];
    for (let i = 0; i < Math.max(...passages.map(p => p.length)); i++) for (const p of passages) if (p[i]) blocks.push(p[i]!);
    return { text: blocks.join(level === 0 ? '' : ' '), sides, helperKeys };
  }

  // Levels 4–10 are hard on purpose: words dense in these fingers, same-finger runs, twisters, then capitals, numbers and symbols.
  const twisters = FINGER_TWISTERS[pair.id];
  const fits = (w: string) => [...w].every(k => allowed.has(k.toLowerCase()));
  const own = (k: string) => sides.includes(fingerOf(k)!);
  const density = (w: string) => [...w].filter(own).length / w.length;
  const runs = (w: string) => [...w].filter((k, i) => i > 0 && k !== w[i - 1] && own(k) && fingerOf(k) === fingerOf(w[i - 1]!)).length;
  const vocab = [...new Set([...twisters.words, ...VOCABULARY])].filter(w => w.length >= 3 && /^[a-z]+$/.test(w) && fits(w));
  const dense = vocab.filter(w => density(w) >= 0.5).sort((a, b) => density(b) - density(a)).slice(0, 40);
  const withRuns = vocab.filter(w => runs(w) > 0 && density(w) >= 0.4).sort((a, b) => runs(b) - runs(a) || density(b) - density(a)).slice(0, 40);
  const pool = shuffle(level === 5 && withRuns.length >= 6 ? withRuns : dense.length >= 6 ? dense : vocab.filter(w => density(w) > 0), r);
  const owned = sides.flatMap(id => [...fingerById(id)!.keys]);
  const digits = owned.filter(k => /[0-9]/.test(k));
  const symbols = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).filter(k => !/[a-zA-Z0-9 ]/.test(k) && own(k) && (!opts.known || opts.known.has(k)));
  const lines = twisters.lines.filter(l => [...l].every(k => k === ' ' || allowed.has(k.toLowerCase())));
  const lower = twisters.lines.map(l => l.toLowerCase().replace(/[^a-z ]/g, '')).filter(l => [...l].every(k => k === ' ' || allowed.has(k)));
  const target = level === 9 ? 50 : level === 6 ? 36 : 30;
  const count = (text: string, id: FingerId) => [...text].filter(k => fingerOf(k) === id).length;
  const done = (tokens: string[]) => sides.every(id => count(tokens.join(' '), id) >= target);
  const cap = (w: string, i: number) => i % 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1);
  const tokens: string[] = [];
  if (level === 6) tokens.push(...shuffle(lower, r).slice(0, 2));
  if (level === 9) tokens.push(...shuffle(lines, r).slice(0, 2));
  // The gauntlet touches every key these fingers own: each letter in CAPITALS, every digit, every symbol the learner has met.
  if (level === 9) for (const k of owned.filter(k => /[a-z]/.test(k))) { const w = vocab.find(w => w.includes(k)) ?? k; tokens.push(w, w.toUpperCase()); }
  if (level === 9) tokens.push(digits.join(''), ...symbols.map(k => k + baseKey(k)));
  for (let i = 0; !done(tokens) && i < 200; i++) {
    const deficit = sides.find(id => count(tokens.join(' '), id) < target) ?? sides[0]!;
    const choices = pool.filter(w => [...w].some(k => fingerOf(k) === deficit));
    const word = (choices.length ? choices : pool)[i % Math.max(1, (choices.length ? choices : pool).length)] ?? owned[0]!;
    const sym = symbols.length ? symbols[i % symbols.length]! : '';
    const num = digits.length ? shuffle(digits, r).join('').slice(0, 3) : '';
    if (level === 7) tokens.push(cap(word, i));
    else if (level === 8) tokens.push(word, num + sym, ...(sym ? [sym + word] : []));
    else if (level === 9) tokens.push(i % 4 === 0 ? cap(word, 0) : word, ...(i % 3 === 0 && num ? [num] : []), ...(i % 2 === 0 && sym ? [sym] : []), ...(i % 5 === 4 && allowed.has('.') ? ['.'] : []));
    else tokens.push(word);
  }
  let text = tokens.filter(Boolean).join(' ').replace(/ \./g, '.');
  if (level === 9 && !/[.]$/.test(text) && allowed.has('.')) text += '.';
  return { text, sides, helperKeys };
}

/** Record per-side passes from a completed passage, never from its aggregate accuracy or the mistyped key's owner. */
export function completeFingerPractice(
  progress: Record<string, number>, pair: FingerPair, level: number,
  practice: FingerPractice, run: Pick<Run, 'status' | 'text' | 'strokes'>,
): { passed: boolean; newlyPassed: FingerId[] } {
  const newlyPassed: FingerId[] = [];
  if (run.status !== 'complete' || run.text !== practice.text) return { passed: false, newlyPassed };
  for (const id of practice.sides) {
    if (!pair.sides.includes(id as Exclude<FingerId, 'thumb'>)) continue;
    const strokes = run.strokes.filter(s => fingerOf(s.key) === id);
    const hits = strokes.filter(s => s.correct).length;
    const key = fingerCourseId(id);
    // Exact ratio: 94.6% must not pass because the display rounds it to 95%.
    // Passing a level also credits any earlier ones this side never ran: a required stop reached past skipped levels
    // (a save that predates the stops, DEC-20) must still be passable (FIX-03). Earned records never go down.
    if (hits >= MIN_FINGER_HITS && hits * 100 >= strokes.length * FINGER_PASS_ACC && (progress[key] ?? 0) <= level) {
      progress[key] = level + 1;
      newlyPassed.push(id);
    }
  }
  return { passed: pairCompleted(progress, pair) > level, newlyPassed };
}
