/** The eight fingers, their home anchor and every key they own. Thumbs own space. */
export interface Finger { id: string; anchor: string; name: string; full: string; keys: string; hand: 'left' | 'right' }

export const FINGERS: readonly Finger[] = [
  { id: 'lp', anchor: 'a', name: 'L pinky', full: 'Left pinky', keys: 'qaz1', hand: 'left' },
  { id: 'lr', anchor: 's', name: 'L ring', full: 'Left ring', keys: 'wsx2', hand: 'left' },
  { id: 'lm', anchor: 'd', name: 'L middle', full: 'Left middle', keys: 'edc3', hand: 'left' },
  { id: 'li', anchor: 'f', name: 'L index', full: 'Left index', keys: 'rftgvb45', hand: 'left' },
  { id: 'ri', anchor: 'j', name: 'R index', full: 'Right index', keys: 'yhnujm67', hand: 'right' },
  { id: 'rm', anchor: 'k', name: 'R middle', full: 'Right middle', keys: 'ik,8', hand: 'right' },
  { id: 'rr', anchor: 'l', name: 'R ring', full: 'Right ring', keys: 'ol.9', hand: 'right' },
  { id: 'rp', anchor: ';', name: 'R pinky', full: 'Right pinky', keys: 'p;/0', hand: 'right' },
];

export const THUMB = { full: 'Thumbs', id: 'thumb', anchor: ' ' } as const;

/** Shifted symbol → the unshifted key that produces it. */
const SHIFTED: Record<string, string> = { '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/', '{': '[', '}': ']' };
const EXTRA: Record<string, string> = { '-': 'rp', '=': 'rp', '[': 'rp', ']': 'rp', "'": 'rp' };

export function fingerForKey(k: string): Finger | typeof THUMB | null {
  if (k === ' ') return THUMB;
  const base = (SHIFTED[k] ?? k).toLowerCase();
  const extra = EXTRA[base];
  if (extra) return FINGERS.find((f) => f.id === extra) ?? null;
  return FINGERS.find((f) => f.keys.includes(base)) ?? null;
}
export const fingerById = (id: string): Finger | null => FINGERS.find((f) => f.id === id) ?? null;

/** A short anchor-reach-anchor drill over the finger's keys that are currently unlocked. */
export function remedialText(f: Finger, allowed: ReadonlySet<string>, targetLen = 24): string {
  const keys = [...f.keys].filter((k) => allowed.has(k) && k !== f.anchor);
  const a = f.anchor;
  const pats = keys.length ? keys.flatMap((k) => [a + k + a, k + a + k, k + k + a, a + k + k]) : [a + a, a + a + a];
  let s = '';
  let i = 0;
  while (s.length < targetLen) s += (s ? ' ' : '') + pats[i++ % pats.length];
  return s;
}
