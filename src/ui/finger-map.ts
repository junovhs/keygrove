/** Where a finger id (lp…rp, thumb) sits on the hand illustrations: which hand and which finger. The thumb is both hands. */
export type HandSide = 'left' | 'right';
export type FingerKind = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
const KIND: Record<string, FingerKind> = { p: 'pinky', r: 'ring', m: 'middle', i: 'index' };
export function fingerPlace(id: string): { sides: HandSide[]; kind: FingerKind } | null {
  if (id === 'thumb') return { sides: ['left', 'right'], kind: 'thumb' };
  const side = id[0] === 'l' ? 'left' : id[0] === 'r' ? 'right' : null, kind = KIND[id[1] ?? ''];
  return side && kind && id.length === 2 ? { sides: [side], kind } : null;
}
