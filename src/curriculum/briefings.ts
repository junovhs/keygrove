import { lessonExercises } from './lesson-flow';
import type { Trail } from './types';

/**
 * Just-in-time coaching shown before an exercise starts (docs/progression.md §Briefings).
 * Exactly three tips per briefing: the learner clicks through them one at a time, so each one
 * gets read. Copy uses `{f}`-style placeholders resolved against the active method — never a
 * hard-coded finger. `keys` are the keycaps to light and the fingers to paint for that tip.
 */
export type BriefIcon = 'hand' | 'bumps' | 'anchor' | 'feather' | 'eye' | 'space' | 'rhythm' | 'stretch';
export interface BriefTip { icon: BriefIcon; title: string; body: string; keys?: string }
export interface Briefing { title: string; lead: string; tips: readonly [BriefTip, BriefTip, BriefTip] }

const tip = (icon: BriefIcon, title: string, body: string, keys?: string): BriefTip => ({ icon, title, body, ...(keys ? { keys } : {}) });
const brief = (title: string, lead: string, ...tips: [BriefTip, BriefTip, BriefTip]): Briefing => ({ title, lead, tips });

/** Briefings keyed by trail id, in exercise order. Chapters without an entry show no briefing. */
const BRIEFINGS: Record<string, readonly Briefing[]> = {
  anchors: [
    brief('Starting position', 'Learn where your hands rest and which fingers move first.',
      tip('hand', 'Use your index fingers', 'Find the F key with your {f} and the J key with your {j}.', 'fj'),
      tip('bumps', 'Feel the bumps', 'F and J carry small ridges. Rest your fingertips on them without looking; that is how you find home again.', 'fj'),
      tip('anchor', 'Keep your hands still', 'Only the index fingers press. Every other finger rests lightly on its key, and your wrists float rather than plant.', 'fj')),
    brief('Two hands, one rhythm', 'The letters alternate between hands.',
      tip('rhythm', 'Left, right, left', 'Each finger presses, then returns to its bump. The return is half the movement.', 'fj'),
      tip('feather', 'A light touch', 'Press just enough to register the key. Heavy presses tire your hands and slow the return.', 'fj'),
      tip('eye', 'Eyes on the screen', 'Your fingers already know where F and J are. Trust the bumps; look at the text, not your hands.', 'fj')),
    brief('Read a little ahead', 'Short groups of letters, still just F and J.',
      tip('eye', 'Groups, not single letters', 'Read the whole group before your fingers start. Your eyes lead; your fingers follow.', 'fj'),
      tip('anchor', 'Same fingers, same reach', 'Still only two fingers. If one drifts, feel for its bump before the next press.', 'fj'),
      tip('rhythm', 'Steady, not fast', 'An even rhythm matters more than speed. Accuracy is what opens the next exercise.', 'fj')),
    brief('Your thumbs join in', 'Space separates the groups. Later it will separate words.',
      tip('space', 'Either thumb presses Space', 'Your thumbs already rest over the space bar. Use whichever feels natural.', ' '),
      tip('space', 'Once between groups', 'One press of Space after each group, no more. It is the gap that gives words their shape.', ' '),
      tip('anchor', 'Index fingers stay home', 'Pressing Space should not move your hands. F and J stay under your index fingers throughout.', 'fj')),
  ],
  'inner-pair': [
    brief('Middle fingers', 'D and K sit right beside your landmarks.',
      tip('hand', 'Use your middle fingers', 'D is under your {d}; K is under your {k}. They already rest on these keys.', 'dk'),
      tip('anchor', 'Press down, not across', 'The middle finger is over its key, so press straight down. Never reach across with the index.', 'dk'),
      tip('bumps', 'Index fingers stay grounded', 'Keep F and J under your index fingers. Those two landmarks are what hold D and K in place.', 'fj')),
    brief('Four fingers, two landmarks', 'D and K mixed with F and J.',
      tip('hand', 'One finger per key', 'Each key belongs to one finger, and no finger borrows another\'s key.', 'fjdk'),
      tip('bumps', 'Feel the difference', 'F and J have ridges; D and K are smooth. Use that to check which finger you are on.', 'fjdk'),
      tip('anchor', 'Hands stay still', 'Nothing here needs your hand to move. Only fingers rise and fall.', 'fjdk')),
    brief('Repeats and reversals', 'Doubled letters and quick changes of direction.',
      tip('rhythm', 'Repeated letters', 'The same letter twice is the same finger twice. Let it come all the way up between presses.', 'dk'),
      tip('rhythm', 'Quick reversals', 'When the direction flips, do not rush it. A tiny pause beats a wrong key.', 'fjdk'),
      tip('feather', 'Relax at each Space', 'Let your shoulders drop when you press Space. Tension creeps in quietly.', ' ')),
    brief('A short rhythm passage', 'Nothing new. Just more of it.',
      tip('eye', 'Read ahead in groups', 'Take in the next group while your fingers finish this one.', 'fjdk'),
      tip('anchor', 'Return home every time', 'After each press the finger settles back onto its own key. Home position is a habit, not a rule.', 'fjdk'),
      tip('hand', 'Real words are next', 'E and I arrive in the next lesson and the first real words with them. This rhythm carries them.', 'fjdk')),
  ],
  'middle-up': [
    brief('Middle fingers reach up', 'E and I live on the top row, directly above D and K.',
      tip('hand', 'E and I', 'E is above D, for your {e}. I is above K, for your {i}.', 'ei'),
      tip('stretch', 'Reach with the finger', 'Curl the finger up to the top row and back. The hand stays exactly where it is.', 'ei'),
      tip('anchor', 'Return to D and K', 'After E, settle back onto D. After I, back onto K. The return is half the movement.', 'dk')),
    brief('Up and back, in rhythm', 'E and I mixed with everything so far.',
      tip('rhythm', 'Old and new together', 'Every key has one finger, and it is the same finger every time.', 'fjdkei'),
      tip('stretch', 'A hop, not a stretch', 'If E or I feels like a stretch, let the whole hand drift up a few millimetres, then come home.', 'ei'),
      tip('feather', 'Let the index fingers rest', 'Here the index fingers only hold the landmarks. Do not let them help.', 'fj')),
    brief('First real words', 'kid, did, fed, feed.',
      tip('eye', 'Read the word', 'See the whole word, then type it. Words are easier than letters once you read them as words.', 'fjdkei'),
      tip('space', 'Space between words', 'One thumb press between words. It is part of the word\'s rhythm.', ' '),
      tip('rhythm', 'Accuracy first', 'Slow and right beats fast and corrected. There is no timer here.', 'fjdkei')),
    brief('Short phrases', 'Two or three words at a time.',
      tip('eye', 'Read to the end', 'Read the whole phrase before you begin, then let it flow.', 'fjdkei'),
      tip('anchor', 'Both hands stay home', 'Words swing between hands. Neither hand needs to move to help the other.', 'fjdkei'),
      tip('feather', 'Mistakes are fine', 'If a key goes wrong, pause. Find F and J again, then continue.', 'fj')),
  ],
  'index-reach': [
    brief('Index fingers reach inward', 'G and H sit between your landmarks.',
      tip('hand', 'G and H', 'G is just right of F, for your {g}. H is just left of J, for your {h}.', 'gh'),
      tip('stretch', 'Slide, do not jump', 'The index finger slides one key inward and back. Every other finger stays on its key.', 'gh'),
      tip('bumps', 'Back to the bump', 'Feel for the ridge on F or J as you return. That is your confirmation you are home.', 'fj')),
    brief('Inward and home', 'G and H mixed with familiar keys.',
      tip('hand', 'Two keys per index finger', 'Your {f} covers F and G. Your {j} covers J and H.', 'fgjh'),
      tip('anchor', 'Do not twist the wrist', 'Reaching inward is a finger movement. If the wrist turns, you have gone too far.', 'gh'),
      tip('anchor', 'Middle fingers stay put', 'D, K, E and I keep their fingers. Nothing else moves for G or H.', 'dkei')),
    brief('Two-handed words', 'he, hid, high, dig.',
      tip('rhythm', 'Both hands share the work', 'These words swing across the keyboard. Let the rhythm alternate.', 'fjdkeigh'),
      tip('eye', 'Read, then type', 'See the whole word before the first press.', 'fjdkeigh'),
      tip('feather', 'Stay light', 'New keys invite pressing harder. Do not. The same light touch as F and J.', 'gh')),
    brief('Phrases with G and H', 'Everything from this chapter, in short phrases.',
      tip('eye', 'Whole phrases', 'Read to the end of the phrase, then let it flow.', 'fjdkeigh'),
      tip('bumps', 'Landmarks at each Space', 'Each time you press Space, notice F and J under your index fingers.', 'fj'),
      tip('feather', 'Correct and continue', 'A wrong key is not a failure. Fix it, breathe, keep going. Accuracy opens the next step.', 'fjdkeigh')),
  ],
  'core-words': [
    brief('Everything so far', 'Eight keys, four fingers, real words.',
      tip('hand', 'One finger per key', 'F J D K E I G H. Each has its finger. Trust the assignment even when it feels slower.', 'fjdkeigh'),
      tip('rhythm', 'Even pace', 'Let words arrive at a steady pace. Speed follows accuracy on its own.', 'fjdkeigh'),
      tip('anchor', 'Hands still', 'Nothing in this lesson needs your hands to move. Fingers only.', 'fjdkeigh')),
    brief('Longer phrases', 'Familiar words, joined up.',
      tip('eye', 'Read in phrases', 'Take in two or three words at once, then type them as a run.', 'fjdkeigh'),
      tip('bumps', 'Reset at Space', 'Use each Space as a tiny check: are the index fingers on their bumps?', 'fj'),
      tip('feather', 'Shoulders down', 'Longer text is where tension builds. Notice it, and let it go.', 'fjdkeigh')),
  ],
  'roots-checkpoint': [
    brief('Roots checkpoint', 'A longer passage using everything from this chapter.',
      tip('rhythm', '97% accuracy, any pace', 'This is the chapter passage. There is no speed target, so take your time.', 'fjdkeigh'),
      tip('bumps', 'Home is F and J', 'Whenever you lose your place, feel for the bumps and start the next word from there.', 'fj'),
      tip('anchor', 'Both hands share the work', 'The passage is balanced between hands. If one hand feels busier, check that a finger has not drifted onto a neighbour\'s key.', 'fjdkeigh')),
  ],
};

/** The briefing for one exercise of a trail, or null when the chapter has none. */
export function briefingFor(trail: Trail, exerciseIndex: number): Briefing | null {
  return BRIEFINGS[trail.id]?.[exerciseIndex] ?? null;
}
/** Trails that carry briefings, for tests and docs: every exercise must have one, or none. */
export const briefedTrails = (): string[] => Object.keys(BRIEFINGS);
export const briefingCount = (trail: Trail): number => BRIEFINGS[trail.id]?.length ?? 0;
export const exerciseCount = (trail: Trail): number => lessonExercises(trail).length;
