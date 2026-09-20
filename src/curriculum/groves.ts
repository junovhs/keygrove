import type { Grove } from './types';

/** The seven groves, in path order. Numbers mirror docs/progression.md §Gates. */
export const GROVES: readonly Grove[] = [
  { id: 'roots', n: 1, name: 'Roots', blurb: 'Strong fingers first: index and middle, home and top row.', passAcc: 90, wpmTarget: 15 },
  { id: 'home', n: 2, name: 'Home', blurb: 'The rest of the home row. Use F and J to stay oriented — it is a landmark, not a cage.', passAcc: 91, wpmTarget: 18 },
  { id: 'canopy', n: 3, name: 'Canopy', blurb: 'The rest of the top row. Let the hand drift a little toward the reach.', passAcc: 92, wpmTarget: 20 },
  { id: 'undergrowth', n: 4, name: 'Undergrowth', blurb: 'Bottom row: Z {z}, X {x}, C {c}, B {b}.', passAcc: 94, wpmTarget: 25 },
  { id: 'bark', n: 5, name: 'Bark', blurb: 'Shift and punctuation. Real sentences begin.', passAcc: 95, wpmTarget: 30 },
  { id: 'rings', n: 6, name: 'Rings', blurb: 'Numbers and symbols.', passAcc: 95, wpmTarget: 30 },
  { id: 'flow', n: 7, name: 'Flow', blurb: 'Make familiar movements work together in longer, varied passages.', passAcc: 96, wpmTarget: 40, ladder: [40, 50, 60, 70] },
  { id: 'code', n: 8, name: 'Code', blurb: 'Optional branch. Brackets and snippets.', passAcc: 96, wpmTarget: 40, optional: true, opensAfter: 'bark-checkpoint' },
];

export const groveById = (id: string): Grove => {
  const g = GROVES.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown grove ${id}`);
  return g;
};
