import { activeMethod, baseKey, fingerOf, type FingerId } from './method';
import type { Finger } from './fingers';
import words from '../data/words.json';

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
  const pairs = (ks: string[]) => ks.flatMap(a => ks.map(b => a + b));
  const reaches = (ks: string[]) => (ks.length ? ks : home).map(k => f.anchor + k + k + f.anchor);
  const level = (name: string, instruction: string, tokens: string[]): FingerLevel => {
    let text = tokens.join(' ');
    while (text.length < 48) text += ' ' + tokens.join(' ');
    return { name, instruction, text };
  };
  const vocabulary = (words as string[]).filter(w => [...w].some(k => letters.includes(k)));
  // Round-robin by target key gives uncommon reaches space alongside frequent ones.
  const contexts = letters.flatMap(k => vocabulary.filter(w => w.includes(k)).slice(0, 3));
  return [
    level('Find your landmarks', 'Small home-row movements. Let your hand stay comfortable.', reaches(home)),
    level('Reach up', 'Explore every upper-row reach for this finger.', reaches(upper)),
    level('Reach down', 'Explore every lower-row reach for this finger.', reaches(lower)),
    level('Across the rows', 'Move directly between keys; the landmark is there to help you orient.', pairs([...home, ...upper, ...lower])),
    level('Repeated movements', 'Settle repeated keys and changes of direction.', owned.filter(k => /[a-z;,./]/.test(k)).map(k => k + k + f.anchor + k)),
    level('Words with other fingers', 'Use both hands in words, with extra work for your chosen finger.', contexts.length ? contexts : reaches(owned)),
    level('Capital letters', 'Hold the opposite-hand Shift for capitals. Release it for lowercase.', letters.length ? letters.map(k => k + k.toUpperCase() + k.toUpperCase() + k) : reaches(home)),
    level('Number reaches', 'Meet every number assigned to this finger, at your own pace.', reaches(digits)),
    level('Punctuation and symbols', 'Practice every symbol for this finger. Use opposite-hand Shift when shown.', symbols.map(k => f.anchor + k + baseKey(k) + k)),
    level('Complete finger passage', 'Bring all reaches together: words, capitals, numbers and symbols.', [...reaches(owned), ...letters.map(k => k.toUpperCase() + k), ...symbols.map(k => f.anchor + k), ...contexts.slice(0, 8)]),
  ];
}
