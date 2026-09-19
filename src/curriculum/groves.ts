import type { Grove } from './types';

/** The seven groves, in path order. Numbers mirror docs/progression.md §Gates. */
export const GROVES: readonly Grove[] = [
  { id: 'roots', n: 1, name: 'Roots', blurb: 'Home row. Plant the anchors.', passAcc: 90, wpmTarget: 15 },
  { id: 'canopy', n: 2, name: 'Canopy', blurb: 'Top row. Reach up, come straight home.', passAcc: 92, wpmTarget: 20 },
  { id: 'undergrowth', n: 3, name: 'Undergrowth', blurb: 'Bottom row. Same light return, downward.', passAcc: 94, wpmTarget: 25 },
  { id: 'bark', n: 4, name: 'Bark', blurb: 'Shift and punctuation. Real sentences begin.', passAcc: 95, wpmTarget: 30 },
  { id: 'rings', n: 5, name: 'Rings', blurb: 'Numbers and symbols.', passAcc: 95, wpmTarget: 30 },
  { id: 'flow', n: 6, name: 'Flow', blurb: 'No new keys. Speed ladders and endurance.', passAcc: 96, wpmTarget: 40, ladder: [40, 50, 60, 70] },
  { id: 'code', n: 7, name: 'Code', blurb: 'Optional branch. Brackets and snippets.', passAcc: 96, wpmTarget: 40, optional: true, opensAfter: 'bark-checkpoint' },
];

export const groveById = (id: string): Grove => {
  const g = GROVES.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown grove ${id}`);
  return g;
};
