import { GROVES, groveById } from './groves';
import { fingerOf, handOf, type FingerId } from './method';
import { TRAILS, MAIN_TRAILS } from './trails';
import type { Gate, Grove, Trail } from './types';

export { GROVES, groveById, TRAILS, MAIN_TRAILS };

const FINGER_WORD: Record<FingerId, string> = { lp: 'pinky', lr: 'ring', lm: 'middle', li: 'index', ri: 'index', rm: 'middle', rr: 'ring', rp: 'pinky', thumb: 'thumb' };
/** Copy tokens: `[s]` names a key (`[shift]`, `[space]` for the named keys) and `{s}` names the finger for a key. */
const COPY_TOKEN = /\[(shift|space|.)\]|\{(.)\}/g;
const keyLabel = (k: string): string => (k === 'shift' ? 'Shift' : k === 'space' || k === ' ' ? 'Space' : k.toUpperCase());
function fingerName(ch: string): string {
  const id = fingerOf(ch.toLowerCase());
  if (!id) return ch;
  const name = id === 'thumb' ? 'thumb' : `${handOf(id)} ${FINGER_WORD[id]}`;
  return ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? name.toUpperCase() : name;
}
/**
 * Resolve copy tokens to plain text against the active method: `{c}` → 'left index', `{C}` → 'LEFT INDEX',
 * `{,}` → 'right middle', `[c]` → 'C'. Copy never hard-codes a finger (spec §44).
 */
export function resolveCopy(text: string | undefined): string {
  if (!text) return '';
  return text.replace(COPY_TOKEN, (_m, key: string | undefined, finger: string) => (key !== undefined ? keyLabel(key) : fingerName(finger)));
}
const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
/** Resolve copy tokens to safe HTML: each `[k]` becomes a small keycap chip, fingers become their names, all else is escaped. */
export function renderCopy(text: string | undefined): string {
  if (!text) return '';
  let html = '', at = 0;
  for (const m of text.matchAll(COPY_TOKEN)) {
    html += escapeHtml(text.slice(at, m.index));
    html += m[1] !== undefined ? `<kbd class="keycap-inline">${escapeHtml(keyLabel(m[1]))}</kbd>` : escapeHtml(fingerName(m[2]!));
    at = m.index! + m[0].length;
  }
  return html + escapeHtml(text.slice(at));
}
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
