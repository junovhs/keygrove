/**
 * Steady beat (spec B2/F5): a pulse set from the learner's own pace, rounded slow, and timing-quality
 * feedback given once, as one word and a small three-bar glyph. Never a pace target, never a number.
 */

/** Slowest a beat gets for a learner with no pace on record, and the fastest it ever gets. */
export const BEAT_DEFAULT_MS = 600;
export const BEAT_FLOOR_MS = 400;

/** The beat interval: the learner's typical transition time, a quarter slower, rounded up to 50 ms — never faster than they type. */
export function beatInterval(referenceMs: number): number {
  if (!(referenceMs > 0)) return BEAT_DEFAULT_MS;
  return Math.max(BEAT_FLOOR_MS, Math.ceil((referenceMs * 1.25) / 50) * 50);
}

export type Evenness = { word: 'Even' | 'Mostly even' | 'Uneven'; bars: string; cv: number };

const cvOf = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  if (!(mean > 0)) return 0;
  const variance = xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length;
  return Math.sqrt(variance) / mean;
};
const BARS = ['▁', '▂', '▃', '▅', '▇'];
const bar = (cv: number): string => BARS[Math.max(0, Math.min(4, Math.round(4 - cv / 0.15)))]!;

/** How evenly the presses landed, from their inter-key latencies: one word for the whole run, one bar per third. */
export function evenness(latenciesMs: readonly number[]): Evenness {
  const xs = latenciesMs.filter((l) => l > 0);
  const cv = cvOf(xs);
  const n = Math.max(1, Math.floor(xs.length / 3));
  const bars = [0, 1, 2].map((i) => bar(cvOf(xs.slice(i * n, i === 2 ? xs.length : (i + 1) * n)))).join('');
  return { word: cv < 0.25 ? 'Even' : cv < 0.5 ? 'Mostly even' : 'Uneven', bars, cv };
}

/** 0..1: how close a press at `t` fell to the nearest beat of a pulse that started at `t0`. */
export function onBeat(t: number, t0: number, interval: number): number {
  const phase = ((t - t0) % interval + interval) % interval;
  return 1 - Math.min(phase, interval - phase) / (interval / 2);
}
