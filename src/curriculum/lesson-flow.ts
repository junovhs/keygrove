import type { StageName, Trail } from './types';

/** An explicit, finite exercise in a lesson; format describes its learning purpose. */
export interface LessonExercise {
  name: string;
  stage: StageName;
  format: 'movement' | 'words' | 'passage';
  instruction: string;
  length: number;
}
const move = (name: string, stage: StageName, instruction: string, length = 24): LessonExercise => ({ name, stage, format: 'movement', instruction, length });
const use = (name: string, format: 'words' | 'passage', instruction: string, length: number): LessonExercise => ({ name, stage: 'words', format, instruction, length });

/** Passing each listed exercise advances immediately; no adaptive signal can add another step. */
export function lessonExercises(t: Trail): readonly LessonExercise[] {
  if (t.checkpoint) return [use('Chapter passage', 'passage', 'Use what you have learned in a fresh passage. Take your time.', t.length)];
  if (t.id === 'anchors') return [
    move('Find F and J', 'drill', 'Find the bumps with your index fingers. Just F and J; no Space yet.', 16),
    move('Alternate hands', 'drill', 'Move between the landmarks. Let your hands stay loose.', 20),
    move('Small groups', 'mix', 'Read a few letters ahead. Keep the movements comfortable.', 24),
    move('Meet Space', 'words', 'Either thumb presses Space between groups. Later, these gaps will separate words.', 28),
  ];
  if (t.id === 'inner-pair') return [
    move('Meet D and K', 'drill', 'Bring in your middle fingers, one movement at a time.', 20),
    move('Blend four keys', 'mix', 'Mix the new keys with F and J. Space separates each short group.', 28),
    move('Change direction', 'mix', 'Practice changes and repeated letters in a few short groups.', 28),
    move('Use all four keys', 'words', 'A short rhythm passage. Real words arrive with E and I next.', 32),
  ];
  if (t.newKeys && ['rhythm', 'words'].includes(t.kind)) return [
    move('Meet the new keys', 'drill', 'A short introduction to the new movements.', 20),
    move('Connect the movements', 'mix', 'Connect new reaches with keys you already know.', 28),
    use('Useful words', 'words', 'Type real words using only the keys you have met. Space belongs between words.', 40),
    use('Put it to work', 'passage', 'Use familiar keys in words and short phrases. Read ahead at your own pace.', 56),
  ];
  if (t.newKeys || t.shift) return [
    move('Meet the new movement', 'drill', 'Explore the new reach or Shift combination in a short practice.', 24),
    use('Use it in context', 'words', 'Bring the new movement into words, numbers or useful expressions.', Math.min(48, t.length)),
    use('Put it to work', 'passage', 'Use the new skill in a short passage.', t.length),
  ];
  return [
    use('Build fluency', 'words', 'Settle familiar words and useful combinations without rushing.', Math.min(60, t.length)),
    use('Put it to work', 'passage', 'Bring familiar movements together in a meaningful passage.', t.length),
  ];
}
