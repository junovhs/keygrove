import { GROVES, groveById } from './groves';
import { TRAILS, MAIN_TRAILS } from './trails';
import type { Gate, Grove, Trail } from './types';

export { GROVES, groveById, TRAILS, MAIN_TRAILS };
export type * from './types';
export { STAGES } from './types';

const BASE_KEYS = 'abcdefghijklmnopqrstuvwxyz';

export const trailById = (id: string): Trail => {
  const t = TRAILS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown trail ${id}`);
  return t;
};

export const trailsInGrove = (groveId: string): Trail[] => TRAILS.filter((t) => t.grove === groveId);

export const groveOf = (trail: Trail): Grove => groveById(trail.grove);

/** The checkpoint trail of a grove (its last trail). */
export const checkpointOf = (groveId: string): Trail => {
  const cp = trailsInGrove(groveId).find((t) => t.checkpoint);
  if (!cp) throw new Error(`Grove ${groveId} has no checkpoint`);
  return cp;
};

/** Everything unlocked at or before this trail. A side-branch trail inherits the main path up to the grove that opens it. */
export interface KeySet { keys: Set<string>; shift: boolean; space: boolean }
export function cumulativeKeys(trail: Trail): KeySet {
  const keys = new Set<string>();
  let shift = false, space = false;
  const g = groveOf(trail);
  const upTo = g.optional ? trailById(g.opensAfter!) : trail;
  for (const t of MAIN_TRAILS) {
    if (t.n > upTo.n) break;
    for (const k of t.newKeys) keys.add(k);
    if (t.shift) shift = true;
    if (t.space) space = true;
  }
  if (g.optional) for (const t of trailsInGrove(g.id)) { if (t.n > trail.n) break; for (const k of t.newKeys) keys.add(k); }
  return { keys, shift, space };
}

/** Characters a generated text for this trail may contain. */
export function allowedChars(trail: Trail): Set<string> {
  const { keys, shift, space } = cumulativeKeys(trail);
  const out = new Set(keys);
  if (space) out.add(' ');
  if (shift) for (const k of keys) if (BASE_KEYS.includes(k)) out.add(k.toUpperCase());
  return out;
}

export function gateFor(trail: Trail): Gate {
  const g = groveOf(trail);
  const passAcc = trail.passAcc ?? g.passAcc;
  const target = trail.wpmTarget ?? g.wpmTarget;
  return { passAcc, star2Acc: 97, star3Acc: 100, star2Rhythm: 0.6, star3Rhythm: 0.8, swiftWpm: target };
}

/** Next trail on the main path, or null at the end. Side-branch trails advance within their branch. */
export function nextTrail(trail: Trail): Trail | null {
  const list = groveOf(trail).optional ? trailsInGrove(trail.grove) : MAIN_TRAILS;
  const i = list.findIndex((t) => t.id === trail.id);
  return list[i + 1] ?? null;
}

/** Prints the path as a table (used by tests and the docs check). */
export function describePath(): string {
  return TRAILS.map((t) => {
    const ks = cumulativeKeys(t);
    const keys = [...ks.keys].join('') + (ks.shift ? ' ⇧' : '');
    const g = gateFor(t);
    return `${String(t.n).padStart(2)} G${groveOf(t).n} ${t.name.padEnd(24)} +${(t.shift ? 'SHIFT' : t.newKeys || '—').padEnd(9)} acc≥${g.passAcc} swift${g.swiftWpm} ${t.checkpoint ? 'CP ' : '   '}[${keys}]`;
  }).join('\n');
}
