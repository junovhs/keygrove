import type { Grove } from './types';

/** The seven groves, in path order. Numbers mirror docs/progression.md §Gates. */
export const GROVES: readonly Grove[] = [
  { id: 'roots', n: 1, name: 'Roots', blurb: 'Find your bearings, then connect small movements across all three letter rows.', passAcc: 90, wpmTarget: 15 },
  { id: 'home', n: 2, name: 'Home', blurb: 'Bring more fingers into useful words. Prepare the next movement; let the hand stay easy.', passAcc: 91, wpmTarget: 18 },
  { id: 'canopy', n: 3, name: 'Canopy', blurb: 'Connect distant reaches into readable phrases, with small comfortable adjustments.', passAcc: 92, wpmTarget: 20 },
  { id: 'undergrowth', n: 4, name: 'Undergrowth', blurb: 'Refine the stagger and rarer reaches: Z {z}, X {x}, C {c}, B {b}.', passAcc: 94, wpmTarget: 25 },
  { id: 'bark', n: 5, name: 'Bark', blurb: 'Shift and punctuation. Real sentences begin.', passAcc: 95, wpmTarget: 30 },
  { id: 'rings', n: 6, name: 'Rings', blurb: 'Numbers and symbols.', passAcc: 95, wpmTarget: 30 },
  { id: 'flow', n: 7, name: 'Flow', blurb: 'Carry whole words into unfamiliar writing. Try recalling the movements; hints remain available.', passAcc: 96, wpmTarget: 40, ladder: [40, 50, 60, 70] },
  { id: 'code', n: 8, name: 'Code', blurb: 'Optional branch. Brackets and snippets.', passAcc: 96, wpmTarget: 40, optional: true, opensAfter: 'bark-checkpoint' },
];

export const groveById = (id: string): Grove => {
  const g = GROVES.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown grove ${id}`);
  return g;
};
