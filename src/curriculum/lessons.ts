export interface Lesson {
  id: string;
  title: string;
  keys: string;
  copy: string;
  texts: readonly string[];
}
export interface Finger {
  id: string;
  anchor: string;
  name: string;
  full: string;
  keys: string;
}

export const LESSONS: readonly Lesson[] = [
  { id: 'home', title: 'Home Row', keys: 'asdfjkl;', copy: 'Plant the anchors. Small motion, even rhythm.', texts: ['asdf jkl; asdf jkl;', 'sad lad; fall ask;', 'a flask; a sad fall;'] },
  { id: 'reach', title: 'Center Reach', keys: 'asdfghjkl;', copy: 'Add G and H without losing the home-row reset.', texts: ['dash flag; glass hall', 'flash; glad; half;', 'a glad lass had salad'] },
  { id: 'top', title: 'Top Row', keys: 'qwertyuiopasdfjkl;', copy: 'Reach up, then come straight home.', texts: ['type your quiet power', 'we write pretty poetry', 'quiet typewriter power'] },
  { id: 'bottom', title: 'Bottom Row', keys: 'zxcvbnm,asdfjkl;', copy: 'Reach down with the same light return.', texts: ['calm hands move below', 'mix calm moves then zoom', 'a brave fox can move'] },
  { id: 'words', title: 'Word Run', keys: 'abcdefghijklmnopqrstuvwxyz', copy: 'Turn reaches into useful rhythm.', texts: ['steady hands make clear words', 'small habits build quiet speed', 'accuracy grows before speed'] },
  { id: 'notes', title: 'Full Trail', keys: 'abcdefghijklmnopqrstuvwxyz,.;', copy: 'Natural lines. Calm first, speed second.', texts: ['take the long path home, and keep a gentle pace.', 'small accurate steps turn into useful speed.', 'good typing feels quiet before it feels fast.'] },
];

export const FINGERS: readonly Finger[] = [
  { id: 'lp', anchor: 'a', name: 'L pinky', full: 'Left pinky', keys: 'qaz' },
  { id: 'lr', anchor: 's', name: 'L ring', full: 'Left ring', keys: 'wsx' },
  { id: 'lm', anchor: 'd', name: 'L middle', full: 'Left middle', keys: 'edc' },
  { id: 'li', anchor: 'f', name: 'L index', full: 'Left index', keys: 'rftgvb' },
  { id: 'ri', anchor: 'j', name: 'R index', full: 'Right index', keys: 'yhnujm' },
  { id: 'rm', anchor: 'k', name: 'R middle', full: 'Right middle', keys: 'ik,' },
  { id: 'rr', anchor: 'l', name: 'R ring', full: 'Right ring', keys: 'ol.' },
  { id: 'rp', anchor: ';', name: 'R pinky', full: 'Right pinky', keys: 'p;/' },
];

export const THUMB = { full: 'Thumbs', id: 'thumb', anchor: ' ' } as const;

export function fingerForKey(k: string): Finger | typeof THUMB | null {
  if (k === ' ') return THUMB;
  return FINGERS.find((f) => f.keys.includes(k.toLowerCase())) ?? null;
}

export function fingerText(f: Finger): string {
  const targets = [...f.keys];
  const parts: string[] = [];
  for (const k of targets) parts.push(f.anchor + k + f.anchor);
  for (const k of [...targets].reverse()) parts.push(k + f.anchor + k);
  return parts.join(' ');
}
