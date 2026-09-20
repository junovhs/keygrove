import type { Gate } from '../curriculum';

export type Stars = 0 | 1 | 2 | 3;

export const wpmOf = (hits: number, elapsedMs: number): number => (elapsedMs <= 0 ? 0 : Math.round((hits / 5) / Math.max(0.01, elapsedMs / 60000)));
export const accOf = (hits: number, attempts: number): number => (attempts ? Math.round((hits / attempts) * 100) : 100);

/** ★ pass (accuracy only) · ★★ 97% + steady rhythm (≥ 0.6) · ★★★ 100% + very steady (≥ 0.8). Speed never gates a star. */
export function starsFor(gate: Gate, acc: number, rhythm: number): Stars {
  if (acc < gate.passAcc) return 0;
  if (acc >= gate.star3Acc && rhythm >= gate.star3Rhythm) return 3;
  if (acc >= gate.star2Acc && rhythm >= gate.star2Rhythm) return 2;
  return 1;
}

/** Legacy save compatibility: speed no longer changes learning rewards. */
export const swiftBonus = (_wpm: number, _swiftWpm: number): number => 0;

/** hits·(acc/100)² + 2·⌊maxCombo/8⌋, ×(1 + swift), ×1.5 on a first clear; never below 5. */
export function xpFor(hits: number, acc: number, maxCombo: number, firstClear: boolean, swift = 0): number {
  const base = (hits * Math.pow(acc / 100, 2) + 2 * Math.floor(maxCombo / 8));
  void swift;
  return Math.max(5, Math.round(firstClear ? base * 1.5 : base));
}

export const RANKS: readonly { name: string; xp: number }[] = [
  { name: 'Seed', xp: 0 }, { name: 'Sprout', xp: 500 }, { name: 'Sapling', xp: 2000 }, { name: 'Young Tree', xp: 6000 },
  { name: 'Tree', xp: 15000 }, { name: 'Grove', xp: 35000 }, { name: 'Old Growth', xp: 80000 },
];
export function rankFor(xp: number): { name: string; next: number | null } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1]!.xp) i++;
  return { name: RANKS[i]!.name, next: RANKS[i + 1]?.xp ?? null };
}

export const dayKey = (now: number): string => new Date(now).toISOString().slice(0, 10);
/** Consecutive-day streak: same day → unchanged; yesterday → +1; otherwise reset to 1. */
export function bumpStreak(days: number, lastDay: string, now: number): { days: number; lastDay: string } {
  const today = dayKey(now);
  if (lastDay === today) return { days: Math.max(1, days), lastDay };
  const yesterday = dayKey(now - 86_400_000);
  return { days: lastDay === yesterday ? days + 1 : 1, lastDay: today };
}
