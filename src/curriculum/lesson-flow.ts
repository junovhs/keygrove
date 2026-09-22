import type { StageName, Trail } from './types';
import { fingerOf } from './method';
import { TECHNICAL_TRANSITIONS } from './movements';

/** A finite visible step; guided discovery is separate from assessed performance. */
export interface LessonExercise {
  name: string;
  stage: StageName;
  format: 'movement' | 'words' | 'passage';
  instruction: string;
  length: number;
  assessment?: 'guided';
  guidedKeys?: string;
  text?: string;
  guidance?: 'on-demand';
  /** Earlier movements receiving deliberate attention again in this exercise. */
  focusKeys?: string;
  /** A transition loop (spec B1): the one technical transition this exercise isolates, from movements.ts. */
  target?: string;
}
const move = (name: string, stage: StageName, instruction: string, length = 24): LessonExercise => ({ name, stage, format: 'movement', instruction, length });
const use = (name: string, format: 'words' | 'passage', instruction: string, length: number, independent = false): LessonExercise => ({ name, stage: 'words', format, instruction, length, ...(independent ? { guidance: 'on-demand' as const } : {}) });
const ROW = (k: string): string => 'qwertyuiop'.includes(k) ? 'top row' : 'zxcvbnm'.includes(k) ? 'bottom row' : 'home row';
/** Spec B1: a target typed both ways with a rest between, assessed, no speed. The line names the mechanics under the active method, never the finger used (DEC-15). */
export function loop(target: string): LessonExercise {
  const t = TECHNICAL_TRANSITIONS.find((x) => x.bigram === target);
  if (!t) throw new Error(`Unknown transition target ${target}`);
  const [a, b] = [target[0]!, target[1]!];
  const sameFinger = fingerOf(a) === fingerOf(b);
  const rows = ROW(a) === ROW(b) ? `along the ${ROW(a)}` : `${ROW(a)} to ${ROW(b)}`;
  const how = sameFinger ? `Same finger, ${rows}. Let the finger travel; do not reset to its home key between.` : `Two fingers, ${rows}. Let the second finger prepare while the first presses.`;
  return { name: `Connect ${a.toUpperCase()} and ${b.toUpperCase()}`, stage: 'mix', format: 'movement', instruction: how, length: 24, target, focusKeys: target };
}
const guide = (name: string, keys: string, text: string, instruction: string, format: LessonExercise['format'] = 'movement'): LessonExercise => ({ name, guidedKeys: keys, text, instruction, assessment: 'guided', stage: 'drill', format, length: text.length });

/** Small planned visits connect today's attention to the wider instrument; never random novelty. */
const VISITS: Readonly<Record<string, LessonExercise>> = {
  anchors: guide('Visit the upper row', 'ru', 'rruururu', 'R uses your {r}; U your {u}. Find each slowly. A small hand adjustment is welcome.'),
  'inner-pair': guide('Visit the lower row', 'vm', 'vvmmvmvm', 'V uses your {v}; M your {m}. Let the next finger prepare while the other presses.'),
  'middle-up': guide('A little more language', 'hn', 'hi hi in in', 'Meet H with your {h} and N with your {n}. Try hi and in with the guide; this whole step has no score.', 'words'),
  'index-reach': guide('Visit the outside', 'ap', 'aappapap', 'A uses your {a}; P your {p}. Use a light press. Pause if the reach feels tense.'),
  'core-words': guide('Follow the stagger', 'z.', 'zz..z.z.', 'Z uses your {z}; period your {.}. Follow the keyboard’s stagger with small comfortable movements.'),
  'index-up': guide('Visit the number row', '47', '44774747', '4 uses your {4}; 7 your {7}. Try the farther reach slowly, with a small hand adjustment.'),
};

/** Passes advance immediately; discovery never adds an accuracy or speed requirement. */
export function lessonExercises(t: Trail): readonly LessonExercise[] {
  if (t.checkpoint) return [use('Chapter passage', 'passage', 'Read a word ahead. Connect familiar movements at whatever pace stays comfortable.', t.length, t.grove === 'flow')];
  if (t.id === 'anchors') return [
    guide('Find F and J deliberately', 'fj', 'ffjjfjfj', 'Feel the bumps: F with your {f}, J with your {j}. Press lightly. There is no score here.'),
    move('Alternate hands', 'mix', 'Let one hand prepare while the other presses. F and J help you find your bearings.', 16),
    VISITS.anchors!,
    move('Meet Space', 'words', 'Either thumb presses Space between these short groups. Take as much time as you need.', 24),
  ];
  if (t.id === 'inner-pair') return [
    guide('Find D and K deliberately', 'dk', 'ddkkdkdk', 'D uses your {d}; K your {k}. Keep the press small and easy.'),
    move('Connect four fingers', 'mix', 'Connect D/K with F/J. Prepare the next finger; do not hold the others rigid.', 24),
    VISITS['inner-pair']!,
    move('Carry the coordination', 'mix', 'Read one short group ahead. Slow, accurate movement counts fully.', 32),
  ];
  if (t.newKeys && ['rhythm', 'words'].includes(t.kind)) {
    const names = [...t.newKeys].map(k => k === ' ' ? 'Space' : k.toUpperCase()).join(' and ');
    const ownership = [...t.newKeys].map(k => `${k.toUpperCase()} uses your {${k}}`).join('; ');
    const visits = VISITS[t.id] ? [VISITS[t.id]!] : [];
    return [
      guide(`Find ${names} deliberately`, t.newKeys, [...t.newKeys].map(k => k.repeat(2)).join('').repeat(2), `${ownership}. Find each without rushing; use only the pressure you need.`),
      // Spec C1: the first technical target enters as soon as its keys exist (E D → `ed`, the commonest same-finger movement).
      t.id === 'middle-up' ? loop('ed') : move('Connect the movements', 'mix', 'Move between nearby keys with the same finger, then alternate hands. Prepare instead of resetting.', 24),
      use('Carry it into words', 'words', 'See the whole word. Let the next finger prepare while the current one presses.', t.n <= 5 ? 32 : 40),
      ...visits,
      use('A small phrase', 'passage', 'Connect the word to the next. Pause between words when you need to; there is no hurry.', t.n === 3 ? 32 : 48),
    ];
  }
  if (t.newKeys || t.shift) {
    const keys = t.shift ? 'FfJj' : t.newKeys;
    const introduction = t.shift ? 'fFjJ fFjJ' : [...keys].map(k => k + k).join(' ');
    return [
      guide('Find the movement deliberately', keys, introduction, t.shift
        ? 'For F hold right Shift; for J hold left Shift. Release gently. The key and opposite-hand guide show each movement.'
        : 'Try each new key slowly. The guide names its finger and any opposite-hand Shift. Adjust the hand comfortably.'),
      use('Use it in context', 'words', 'Connect the movement to a useful word, number or expression. Accuracy has no minimum speed.', Math.min(48, t.length)),
      use('Put it to work', 'passage', 'Read ahead and prepare the next movement. Pause whenever the hands need to soften.', t.length),
    ];
  }
  const independent = t.grove === 'flow';
  const exercises = [
    use(t.id === 'bigrams' ? 'Connect common sequences' : 'Connect familiar words', 'words', t.id === 'bigrams'
      ? 'Meet th, he, in and other common sequences inside words. Let the next movement follow without a reset.'
      : 'Practice a word as a small connected phrase. Keep each press light and deliberate.', Math.min(60, t.length)),
    use(independent ? 'Write with less guidance' : 'Put it to work', 'passage', independent
      ? 'Read the words and recall their movements. Finger hints start hidden; show them whenever they help. There is no speed target.'
      : 'Connect familiar movements in a meaningful passage. Choose a pace that lets your hands stay comfortable.', t.length, independent),
  ];
  return t.id === 'index-stretch-down' ? exercises.map(e => ({ ...e, focusKeys: 'cvbnm' })) : exercises;
}
