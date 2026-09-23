import { activeMethod, baseKey, fingerOf, type FingerId } from './method';
import type { Finger } from './fingers';
import { EVERYDAY_WORDS } from './movements';
import { EXCLUDED_WORDS } from './headline';

export const FINGER_LEVEL_COUNT = 10;
export const FINGER_PASS_ACC = 95;
export const fingerCourseId = (id: FingerId): string => `${activeMethod().id}/${id}`;
export interface FingerLevel { name: string; instruction: string; text: string }
/** Derive every reach (including shifted punctuation) from the canonical method. */
export function fingerLevels(f: Finger): FingerLevel[] {
  const owned = [...f.keys];
  const row = (s: string) => [...s].filter(k => owned.includes(k));
  const home = row('asdfghjkl;');
  const upper = row('qwertyuiop');
  const lower = row('zxcvbnm,./');
  const letters = owned.filter(k => /[a-z]/.test(k));
  const digits = owned.filter(k => /[0-9]/.test(k));
  const symbols = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).filter(k => !/[a-zA-Z0-9]/.test(k) && fingerOf(k) === f.id);
  const changes = (ks: string[]) => ks.map((k,i) => k + ks[(i + 1) % ks.length]! + f.anchor + k);
  const reaches = (ks: string[]) => (ks.length ? ks : home).map(k => f.anchor + k + k + f.anchor);
  const level = (name: string, instruction: string, tokens: string[]): FingerLevel => {
    let text = tokens.join(' ');
    while (text.length < 48) text += ' ' + tokens.join(' ');
    return { name, instruction, text };
  };
  const vocabulary = EVERYDAY_WORDS.filter(w => !EXCLUDED_WORDS.has(w) && [...w].some(k => letters.includes(k)));
  // Round-robin by target key gives uncommon reaches space alongside frequent ones.
  const contexts = letters.flatMap(k => vocabulary.filter(w => w.includes(k)).slice(0, 3));
  return [
    level('Find your landmarks', 'Small home-row movements. Let your hand stay comfortable.', reaches(home)),
    level('Reach up and across', 'Meet the upper row and nearby home-row reaches. Either thumb presses Space between the six-letter groups.', reaches([...home.filter(k => k !== f.anchor), ...upper])),
    level('Reach down', 'Explore the lower row in short groups. Then use these keys in real words next.', reaches(lower)),
    level('Words from your keys', 'Real words using the keys you have met. Space separates words.', changes([...home, ...upper, ...lower])),
    level('Tricky word movements', 'Practice repeated letters and changes of direction inside real words.', owned.filter(k => /[a-z;,./]/.test(k)).map(k => k + k + f.anchor + k)),
    level('Short phrases', 'Put these movements into a short phrase. Any new helper letters are introduced first.', contexts.length ? contexts : reaches(owned)),
    level('Words with Shift', 'Type familiar words in lowercase and capitals. Hold the opposite-hand Shift.', letters.length ? letters.map(k => k + k.toUpperCase() + k.toUpperCase() + k) : reaches(home)),
    level('Words and numbers', 'Practice short labels and numbers, as you would in a note or a list.', reaches(digits)),
    level('Punctuation and symbols', 'Practice every symbol for these fingers. Use opposite-hand Shift when shown.', symbols.map(k => f.anchor + k + baseKey(k) + k)),
    level('A complete passage', 'A short key review followed by readable sentences. Bring your reaches together.', [...reaches(owned), ...letters.map(k => k.toUpperCase() + k), ...symbols.map(k => f.anchor + k), ...contexts.slice(0, 8)]),
  ];
}

/** Player-facing courses group matching fingers; assignments still come from the active method. */
export interface FingerPair {
  id: 'index' | 'middle' | 'ring' | 'pinky';
  name: string;
  sides: readonly [Exclude<FingerId, 'thumb'>, Exclude<FingerId, 'thumb'>];
}
/** One visible progression for each pair, backed by two existing method-specific records. */
export const FINGER_PAIRS: readonly FingerPair[] = [
  { id: 'index', name: 'Index fingers', sides: ['li', 'ri'] },
  { id: 'middle', name: 'Middle fingers', sides: ['lm', 'rm'] },
  { id: 'ring', name: 'Ring fingers', sides: ['lr', 'rr'] },
  { id: 'pinky', name: 'Pinkies', sides: ['lp', 'rp'] },
];
/** Both sides must have cleared a level before the shared course can move beyond it. */
export function pairCompleted(progress: Readonly<Record<string, number>>, pair: FingerPair): number {
  return Math.min(...pair.sides.map(id => progress[fingerCourseId(id)] ?? 0));
}
