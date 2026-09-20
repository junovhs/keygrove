import type { SaveV6 } from '../state/save';
export interface Keepsake { id: string; grove: string; checkpoint: string; name: string; line: string; invitation: string; color: string }
export const KEEPSAKES: readonly Keepsake[] = [
  { id: 'fir', grove: 'roots', checkpoint: 'roots-checkpoint', name: 'The little fir', line: 'A few keys became your first words.', invitation: 'Your first words are taking root.', color: '#24745e' },
  { id: 'cup', grove: 'home', checkpoint: 'home-checkpoint', name: 'The blue cup', line: 'The middle row feels a little more like home.', invitation: 'Something warm is waiting at Home.', color: '#386ac0' },
  { id: 'kite', grove: 'canopy', checkpoint: 'canopy-checkpoint', name: 'The paper kite', line: 'Your hands found the upper row.', invitation: 'There is more room above you.', color: '#e86c45' },
  { id: 'beetle', grove: 'undergrowth', checkpoint: 'undergrowth-checkpoint', name: 'The emerald beetle', line: 'Every letter is within reach.', invitation: 'A small discovery beneath the leaves.', color: '#25847e' },
  { id: 'letter', grove: 'bark', checkpoint: 'bark-checkpoint', name: 'The sealed letter', line: 'You can give a sentence its shape and voice.', invitation: 'Soon you will have a whole sentence to send.', color: '#c34666' },
  { id: 'watch', grove: 'rings', checkpoint: 'rings-checkpoint', name: 'The brass watch', line: 'Dates, times and little details are yours.', invitation: 'Small details make the world legible.', color: '#b47a28' },
  { id: 'music', grove: 'flow', checkpoint: 'flow-checkpoint', name: 'The music box', line: 'Separate movements became a fluent whole.', invitation: 'One last passage brings it all together.', color: '#7561ad' },
  { id: 'fox', grove: 'code', checkpoint: 'snippets', name: 'The folded fox', line: 'Brackets and symbols became familiar shapes.', invitation: 'A little extra for curious hands.', color: '#d36930' },
];
export const keepsakeFor = (grove: string): Keepsake => KEEPSAKES.find(k => k.grove === grove) ?? KEEPSAKES[0]!;
export const ownedKeepsakes = (s: SaveV6): Keepsake[] => KEEPSAKES.filter(k => s.trails[k.checkpoint]?.cleared);
export const courseComplete = (s: SaveV6): boolean => !!s.trails['flow-checkpoint']?.cleared;
