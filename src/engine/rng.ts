/** Small seeded PRNG (mulberry32) so generated texts are reproducible in tests. */
export type Rng = () => number;
export function rng(seed: number = Math.floor(Math.random() * 2 ** 31)): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pickOne = <T>(list: readonly T[], r: Rng): T => list[Math.floor(r() * list.length)] as T;
export function shuffle<T>(list: readonly T[], r: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}
