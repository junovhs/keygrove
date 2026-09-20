import { PRACTICE_WORDS, FINGER_PHRASES } from '../curriculum/language';
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
  const allowed = new Set<string>(opts.known ?? []);
  for (const id of pair.sides) for (const k of fingerById(id)!.keys) if (/[a-z;,./]/.test(k)) allowed.add(k);
  const helperKeys: string[] = [];
  const count = (text: string, id: FingerId) => [...text].filter(k => fingerOf(k) === id).length;
  const enough = (text: string) => sides.every(id => count(text, id) >= MIN_FINGER_HITS);

  if (level < 3) {
    const passages = sides.map(id => {
      const f = fingerById(id)!;
      const text = level === 0 ? f.anchor.repeat(24) : fingerLevels(f)[level]!.text;
      return text.replaceAll(' ', '').slice(0, 24).match(/.{1,6}/g)!;
    });
    const blocks: string[] = [];
    for (let i = 0; i < Math.max(...passages.map(p => p.length)); i++) for (const p of passages) if (p[i]) blocks.push(p[i]!);
    return { text: blocks.join(level === 0 ? '' : ' '), sides, helperKeys };
  }

  // Word exercises use only this pair's taught letters plus keys learned in the main course.
  // Phrase exercises may introduce a minimal, explicitly disclosed set of helper letters.
  const phrases = FINGER_PHRASES[pair.id];
  if (level >= 5) for (const k of phrases[0]) {
    if (k !== ' ' && !allowed.has(k)) { allowed.add(k); helperKeys.push(k); }
  }
  if (level === 9 && !allowed.has('.')) { allowed.add('.'); helperKeys.push('.'); }
  let pool = shuffle(PRACTICE_WORDS.filter(w => [...w].every(k => allowed.has(k)) && [...w].some(k => sides.includes(fingerOf(k)!))), r);
  if (level === 4) {
    const tricky = pool.filter(w => /(.)\1|(..).*\2/.test(w) || w.length >= 5);
    if (sides.every(id => tricky.some(w => [...w].some(k => fingerOf(k) === id)))) pool = tricky;
  }
  const tokens: string[] = [];
  if (helperKeys.length) tokens.push(...helperKeys.map(k => k.repeat(4)));
  const owned = sides.flatMap(id => [...fingerById(id)!.keys]);
  const symbols = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).filter(k => !/[a-zA-Z0-9]/.test(k) && sides.includes(fingerOf(k)!));
  if (level === 8 || level === 9) {
    // A small coverage review, never the Cartesian product of all keys.
    // Shifted and base characters share the canonical owner.
    tokens.push(...symbols.map(k => k + baseKey(k)));
  }
  if (level === 9) {
    const review = owned.filter(k => /[a-z]/.test(k)).map(k => { const w = pool.find(w => w.includes(k)); return w ? w + ' ' + w.toUpperCase() : k + k.toUpperCase(); });
    tokens.push(...new Set(review));
    tokens.push(owned.filter(k => /[0-9]/.test(k)).join(''));
  }
  const usablePhrases = phrases.filter(p => [...p].every(k => k === ' ' || allowed.has(k)));
  let i = 0, languageChars = 0;
  while ((!enough(tokens.join(' ')) || (level === 9 && languageChars < 100)) && i < 100) {
    const deficit = sides.find(id => count(tokens.join(' '), id) < MIN_FINGER_HITS) ?? sides[0]!;
    const choices = pool.filter(w => [...w].some(k => fingerOf(k) === deficit));
    const word = choices[i % choices.length]!;
    if (level === 5 || level === 9) {
      const phrase = usablePhrases[i % usablePhrases.length]!;
      tokens.push(level === 9 ? phrase[0]!.toUpperCase() + phrase.slice(1) + '.' : phrase);
      languageChars += phrase.length;
    } else if (level === 6) tokens.push(word, word.toUpperCase());
    else if (level === 7) {
      const digits = owned.filter(k => /[0-9]/.test(k));
      tokens.push(word, digits.join(''));
    } else tokens.push(word);
    i++;
  }
  // A coverage prefix may already contain enough target strokes; final transfer is still mandatory.
  if (level === 9 && !tokens.some(t => t.endsWith('.'))) {
    const phrase = usablePhrases[0]!; tokens.push(phrase[0]!.toUpperCase() + phrase.slice(1) + '.');
  }
  return { text: tokens.filter(Boolean).join(' '), sides, helperKeys };
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
    // Contiguous records retain all earned progress and cannot skip prerequisites.
    if (hits >= MIN_FINGER_HITS && hits * 100 >= strokes.length * FINGER_PASS_ACC && (progress[key] ?? 0) === level) {
      progress[key] = level + 1;
      newlyPassed.push(id);
    }
  }
  return { passed: pairCompleted(progress, pair) > level, newlyPassed };
}
