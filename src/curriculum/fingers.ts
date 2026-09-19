import { HOME, activeMethod, fingerOf, handOf, keysOf, type FingerId } from './method';

/** A finger as the UI names it. `keys` is derived from the active method (spec §44: one canonical table). */
export interface Finger { id: FingerId; anchor: string; name: string; full: string; keys: string; hand: 'left' | 'right' }

const NAMES: Record<Exclude<FingerId, 'thumb'>, [string, string]> = {
  lp: ['L pinky', 'Left pinky'], lr: ['L ring', 'Left ring'], lm: ['L middle', 'Left middle'], li: ['L index', 'Left index'],
  ri: ['R index', 'Right index'], rm: ['R middle', 'Right middle'], rr: ['R ring', 'Right ring'], rp: ['R pinky', 'Right pinky'],
};
const ORDER: Exclude<FingerId, 'thumb'>[] = ['lp', 'lr', 'lm', 'li', 'ri', 'rm', 'rr', 'rp'];

/** The eight fingers under the active method. Recomputed on every call so a method switch is immediate. */
export const fingers = (): Finger[] => ORDER.map((id) => ({ id, anchor: HOME[id], name: NAMES[id][0], full: NAMES[id][1], keys: keysOf(id).join(''), hand: handOf(id) as 'left' | 'right' }));
/** @deprecated use fingers(); kept as a live getter for existing call sites. */
export const FINGERS: readonly Finger[] = new Proxy([] as Finger[], { get: (_t, p) => Reflect.get(fingers(), p) }) as readonly Finger[];

export const THUMB = { full: 'Thumbs', id: 'thumb', anchor: ' ' } as const;

export function fingerForKey(k: string): Finger | typeof THUMB | null {
  const id = fingerOf(k);
  if (!id) return null;
  if (id === 'thumb') return THUMB;
  return fingers().find((f) => f.id === id) ?? null;
}
export const fingerById = (id: string): Finger | null => fingers().find((f) => f.id === id) ?? null;
export const methodName = (): string => activeMethod().name;

/** A short landmark-reach-landmark drill over the finger's keys that are currently unlocked. */
export function remedialText(f: Finger, allowed: ReadonlySet<string>, targetLen = 24): string {
  const keys = [...f.keys].filter((k) => allowed.has(k) && k !== f.anchor);
  const a = f.anchor;
  const pats = keys.length ? keys.flatMap((k) => [a + k + a, k + a + k, k + k + a, a + k + k]) : [a + a, a + a + a];
  let s = '';
  let i = 0;
  while (s.length < targetLen) s += (s ? ' ' : '') + pats[i++ % pats.length];
  return s;
}
