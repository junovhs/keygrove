import type { SaveV6 } from '../state/save';
import { FINGER_PAIRS, fingerLevels, pairCompleted, type FingerPair } from '../curriculum/finger-course';
import { fingerById } from '../curriculum/fingers';

/** How a charm behaves when it is summoned onto the screen (UI-16). Each one is a pose function in ui/charm-fx.ts. */
export type CharmMotion = 'grow' | 'rise' | 'kite' | 'crawl' | 'run' | 'hop' | 'flutter' | 'swing' | 'music' | 'fly' | 'flock' | 'loop' | 'streak' | 'slither' | 'swim' | 'spin';

/**
 * A charm: a permanent pixel-art keepsake (DEC-10). Chapter charms come from a checkpoint; finger charms from a pair
 * passing a finger-stop milestone (DEC-20). Nothing is bought, timed, random or lost.
 */
export interface Keepsake {
  id: string; name: string; line: string; motion: CharmMotion;
  /** Top-tier charms carry a holographic shimmer. */
  holo?: boolean;
  /** Chapter charms: the chapter and the checkpoint that earns it. */
  grove?: string; checkpoint?: string;
  /** Finger charms: the pair and how many of its levels must be passed. */
  pair?: FingerPair['id']; level?: number;
  invitation: string;
}

const chapter = (id: string, grove: string, checkpoint: string, name: string, line: string, invitation: string, motion: CharmMotion, holo = false): Keepsake => ({ id, grove, checkpoint, name, line, invitation, motion, holo });
/** Finger charms mark row jumps (level 4), twisters (level 7) and the gauntlet (level 10). */
export const FINGER_MILESTONES = [4, 7, 10] as const;
const finger = (id: string, pair: FingerPair['id'], level: number, name: string, line: string, motion: CharmMotion, holo = false): Keepsake => {
  const p = FINGER_PAIRS.find(x => x.id === pair)!;
  const stop = fingerLevels(fingerById(p.sides[0])!)[level - 1]!.name;
  return { id, pair, level, name, line, motion, holo, invitation: `${p.name}: pass “${stop}”.` };
};

export const KEEPSAKES: readonly Keepsake[] = [
  chapter('fir', 'roots', 'roots-checkpoint', 'The little fir', 'A few keys became your first words.', 'Your first words are taking root.', 'grow'),
  chapter('cup', 'home', 'home-checkpoint', 'The blue cup', 'The middle row feels a little more like home.', 'Something warm is waiting at Home.', 'rise'),
  chapter('kite', 'canopy', 'canopy-checkpoint', 'The paper kite', 'Your hands found the upper row.', 'There is more room above you.', 'kite'),
  chapter('beetle', 'undergrowth', 'undergrowth-checkpoint', 'The emerald beetle', 'Every letter is within reach.', 'A small discovery beneath the leaves.', 'crawl'),
  chapter('letter', 'bark', 'bark-checkpoint', 'The sealed letter', 'You can give a sentence its shape and voice.', 'Soon you will have a whole sentence to send.', 'flutter'),
  chapter('watch', 'rings', 'rings-checkpoint', 'The brass watch', 'Dates, times and little details are yours.', 'Small details make the world legible.', 'swing'),
  chapter('music', 'flow', 'flow-checkpoint', 'The music box', 'Separate movements became a fluent whole.', 'One last passage brings it all together.', 'music', true),
  chapter('fox', 'code', 'snippets', 'The folded fox', 'Brackets and symbols became familiar shapes.', 'A little extra for curious hands.', 'run'),
  finger('sparrow', 'index', 4, 'The sparrow', 'Your index fingers stopped stepping and started flying.', 'fly'),
  finger('plane', 'index', 7, 'The paper plane', 'Twisters, folded into something that flies.', 'loop'),
  finger('comet', 'index', 10, 'The comet', 'Your index fingers ran the whole gauntlet.', 'streak', true),
  finger('snail', 'middle', 4, 'The patient snail', 'Slow and certain: reach, return, reach again.', 'crawl'),
  finger('balloon', 'middle', 7, 'The balloon', 'Your middle fingers made the knots look light.', 'rise'),
  finger('moon', 'middle', 10, 'The moon', 'Every key your middle fingers own, by heart.', 'rise', true),
  finger('snake', 'ring', 4, 'The garden snake', 'Your ring fingers learned to slip between rows.', 'slither'),
  finger('koi', 'ring', 7, 'The koi', 'Twisters, swum straight through.', 'swim'),
  finger('crystal', 'ring', 10, 'The crystal', 'The quietest fingers, cut clear and bright.', 'spin', true),
  finger('frog', 'pinky', 4, 'The leap frog', 'Your pinkies jumped the rows without looking down.', 'hop'),
  finger('butterfly', 'pinky', 7, 'The butterflies', 'Q, Z and P, fluttering where they should.', 'flock'),
  finger('rainbow', 'pinky', 10, 'The rainbow', 'The smallest fingers carried the whole gauntlet.', 'rise', true),
];

export const keepsakeFor = (grove: string): Keepsake => KEEPSAKES.find(k => k.grove === grove) ?? KEEPSAKES[0]!;
export const keepsakeById = (id: string): Keepsake | undefined => KEEPSAKES.find(k => k.id === id);
/** Earned from permanent evidence only: a cleared checkpoint, or a finger pair's passed levels. */
export function owns(s: SaveV6, k: Keepsake): boolean {
  if (k.checkpoint) return !!s.trails[k.checkpoint]?.cleared;
  const pair = FINGER_PAIRS.find(p => p.id === k.pair);
  return !!pair && pairCompleted(s.fingerCourses, pair) >= k.level!;
}
export const ownedKeepsakes = (s: SaveV6): Keepsake[] => KEEPSAKES.filter(k => owns(s, k));
/** The finger charm a pair earns by reaching exactly `completed` passed levels, if that is a milestone. */
export const fingerCharmAt = (pair: FingerPair['id'], completed: number): Keepsake | undefined => KEEPSAKES.find(k => k.pair === pair && k.level === completed);
export const courseComplete = (s: SaveV6): boolean => !!s.trails['flow-checkpoint']?.cleared;
