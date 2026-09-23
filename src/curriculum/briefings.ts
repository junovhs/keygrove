import type { Trail } from './types';
import { isShifted } from './method';

export type BriefIcon = 'hand' | 'bumps' | 'anchor' | 'feather' | 'eye' | 'space' | 'rhythm' | 'stretch';
export interface BriefTip { icon: BriefIcon; title: string; body: string; keys?: string; press?: string }
export interface Briefing { title: string; lead: string; tips: readonly BriefTip[] }
const tip = (icon: BriefIcon, title: string, body: string, keys?: string, press?: string): BriefTip => ({ icon, title, body, ...(keys ? { keys } : {}), ...(press ? { press } : {}) });
const brief = (title: string, lead: string, ...tips: BriefTip[]): Briefing => ({ title, lead, tips });
const BRIEFINGS: Record<string, Briefing> = {
  anchors: brief('Find your bearings', 'Small, accurate movements. As slowly as you need.',
    tip('hand', 'Find F and J deliberately', 'Press F with your {f}, then J with your {j}.', 'fj', 'fj'),
    tip('bumps', 'Landmarks, not anchors', 'Feel the bumps to orient yourself. Your hands may adjust a little; you do not need to return here after every press.', 'fj'),
    tip('feather', 'An easy touch', 'Use only the pressure needed for the key. Let the other fingers stay easy. Pause if you notice tension or strain.', 'fj')),
  'inner-pair': brief('Another pair joins in', 'Connect the fingers rather than holding the hand still.',
    tip('hand', 'Find D and K deliberately', 'Press D with your {d}, then K with your {k}.', 'dk', 'dk'),
    tip('feather', 'Prepare the next finger', 'While one finger presses, let the next get ready. Keep the movements small without making the hand rigid.', 'fjdk')),
  'middle-up': brief('Move into your first words', 'Connect an upward reach to a familiar movement.',
    tip('stretch', 'Find E and I deliberately', 'Press E with your {e}, then I with your {i}. A small hand adjustment is welcome.', 'ei', 'ei'),
    tip('eye', 'Connect, rather than reset', 'E and D share a finger; I and K share a finger. Move toward the next letter, without a compulsory return between presses.', 'edik')),
  'index-reach': brief('Reach inward', 'These small movements open more useful words.',
    tip('stretch', 'Find G and H deliberately', 'Press G with your {g}, then H with your {h}. Keep the press light.', 'gh', 'gh'),
    tip('eye', 'Carry coordination into a word', 'See hi or hide as a little movement phrase. Find each letter slowly, then connect them without unnecessary resets.', 'hi')),
  'core-words': brief('Reach down', 'The lower row is part of the same instrument.',
    tip('stretch', 'Find V and M deliberately', 'Press V with your {v}, then M with your {m}. Let the hand make a small comfortable adjustment.', 'vm', 'vm'),
    tip('eye', 'Look ahead by one movement', 'Connect give and him. Prepare the next finger while the current one presses; there is no need to hurry.', 'vm')),
  'roots-checkpoint': brief('Your first connected passage', 'Use the movements from all three letter rows.',
    tip('rhythm', '97% accuracy, at your pace', 'Slow practice counts fully. Read a word ahead, pause when you need to, and use the landmarks if you lose your bearings.', 'fjdkeighvm')),
};
/** Only for keys typed with Shift: says what the on-screen help actually does. */
const SHIFT_NOTE = ' Hold Shift with your other hand; the keyboard lights the one to use.';
/** Later new movements also receive a short explicit introduction, resolved through the active method. */
export function briefingFor(trail: Trail): Briefing | null {
  if (BRIEFINGS[trail.id]) return BRIEFINGS[trail.id]!;
  if (trail.shift) return brief('Opposite-hand Shift', 'Connect a held modifier to a light letter press.', tip('hand', 'Let the other hand help', 'Hold right Shift for left-hand letters and left Shift for right-hand letters. The keyboard lights the Shift to hold; release it between capitals.', 'fj'));
  if (!trail.newKeys) return null;
  return brief(trail.name, 'Meet the movement before expecting yourself to remember it.',
    ...[...trail.newKeys].reduce<string[]>((chunks, k, i) => { if (i % 2 === 0) chunks.push(k); else chunks[chunks.length - 1] += k; return chunks; }, []).slice(0, 3).map(ks => tip('hand', 'Find each key deliberately', [...ks].map(k => `${k.toUpperCase()} uses your {${k}}.`).join(' ') + ([...ks].some(isShifted) ? SHIFT_NOTE : ''), ks)),
    tip('feather', 'Small and comfortable', 'Allow an easy hand adjustment. Keep the press light; pause if you notice tension. Slow, accurate practice counts fully.'));
}
export const briefedTrails = (): string[] => Object.keys(BRIEFINGS);
