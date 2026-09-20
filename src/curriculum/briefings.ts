import type { Trail } from './types';

/**
 * Just-in-time coaching shown once, before a lesson's first exercise (docs/progression.md §Briefings).
 * One message at a time, at most four, and as few as the lesson truly needs. Copy uses `{f}`-style
 * placeholders resolved against the active method — never a hard-coded finger. `keys` are the keycaps
 * to light and the fingers to paint while the step is read. A `press` step is interactive: the learner
 * presses each listed key (ideally with the named finger) and the step advances on its own.
 */
export type BriefIcon = 'hand' | 'bumps' | 'anchor' | 'feather' | 'eye' | 'space' | 'rhythm' | 'stretch';
/** One step: an icon, a short title, one sentence of coaching, keys to light, and optionally keys to press. */
export interface BriefTip { icon: BriefIcon; title: string; body: string; keys?: string; press?: string }
/** A briefing for one lesson: a title, a one-line lead, and one to four steps. */
export interface Briefing { title: string; lead: string; tips: readonly BriefTip[] }

const tip = (icon: BriefIcon, title: string, body: string, keys?: string, press?: string): BriefTip => ({ icon, title, body, ...(keys ? { keys } : {}), ...(press ? { press } : {}) });
const brief = (title: string, lead: string, ...tips: BriefTip[]): Briefing => ({ title, lead, tips });

/** Briefings keyed by trail id. Lessons without an entry show none. */
const BRIEFINGS: Record<string, Briefing> = {
  anchors: brief('Starting position', 'Where your hands rest, and which fingers move first.',
    tip('hand', 'Use your index fingers', 'Press F with your {f}, then J with your {j}.', 'fj', 'fj'),
    tip('bumps', 'Feel the bumps', 'F and J carry small ridges. Rest your fingertips on them without looking; that is how you find home again.', 'fj'),
    tip('anchor', 'Keep your hands still', 'Only the index fingers press. Every other finger rests lightly on its key, and your wrists float rather than plant.', 'fj')),
  'inner-pair': brief('Middle fingers', 'D and K sit right beside your landmarks.',
    tip('hand', 'Use your middle fingers', 'Press D with your {d}, then K with your {k}. They already rest on these keys.', 'dk', 'dk'),
    tip('anchor', 'Press down, not across', 'Index fingers stay on the bumps. The middle finger presses straight down; nothing reaches across.', 'fjdk')),
  'middle-up': brief('Middle fingers reach up', 'E and I live on the top row, directly above D and K.',
    tip('stretch', 'Reach up with the middle fingers', 'Press E with your {e}, then I with your {i}. Curl the finger up and back; the hand stays where it is.', 'ei', 'ei'),
    tip('anchor', 'Return to D and K', 'After E, settle back onto D. After I, back onto K. The return is half the movement, and real words start here.', 'dk')),
  'index-reach': brief('Index fingers reach inward', 'G and H sit between your landmarks.',
    tip('stretch', 'Slide inward with the index fingers', 'Press G with your {g}, then H with your {h}. One key inward and back; every other finger stays put.', 'gh', 'gh'),
    tip('bumps', 'Back to the bump', 'Feel for the ridge on F or J as you return. If the wrist turns, you have gone too far.', 'fj')),
  'core-words': brief('Everything so far', 'Eight keys, four fingers, real words.',
    tip('eye', 'Read the word, then type it', 'One finger per key, hands still, and see the whole word before the first press. Speed follows accuracy on its own.', 'fjdkeigh')),
  'roots-checkpoint': brief('Roots checkpoint', 'A longer passage using everything from this chapter.',
    tip('rhythm', '97% accuracy, any pace', 'There is no speed target. Whenever you lose your place, feel for the bumps on F and J and start the next word from there.', 'fjdkeigh')),
};

/** The briefing for a lesson, or null when it has none. */
export const briefingFor = (trail: Trail): Briefing | null => BRIEFINGS[trail.id] ?? null;
/** Trails that carry briefings, for tests and docs. */
export const briefedTrails = (): string[] => Object.keys(BRIEFINGS);
