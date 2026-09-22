/**
 * Sequence mastery (docs/typing-method-spec.md §25/§49): how well each two-key
 * transition flows, tracked beside the per-key model. A pair is the two
 * consecutive wanted letters ('th'); its evidence is the latency and outcome of
 * the second press. Spaces end a sequence, so pairs never cross a word break.
 *
 * Mastery is judged against the typist's own pace: a pair typed at twice the
 * median transition time is a weak one however fast the typist is.
 */
/** `last`: ms timestamp of the most recent recorded press, so review can know how long a pair has gone unpractised (spec C6/D5). */
export interface TransitionStat { err: number; lat: number; lat2: number; seen: number; hits: number; last: number }
export type TransitionStats = Record<string, TransitionStat>;

const ALPHA = 0.15;
/** Correct presses before a pair can reach full mastery. */
export const PAIR_VOLUME = 12;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const isPairKey = (k: string): boolean => k.length === 1 && k !== ' ';

export class TransitionModel {
  constructor(private stats: TransitionStats = {}) {}

  /** Record the press of `cur` after `prev`. `latencyMs` null = no timing evidence. */
  record(prev: string, cur: string, correct: boolean, latencyMs: number | null, now = Date.now()): void {
    if (!isPairKey(prev) || !isPairKey(cur)) return;
    const pair = (prev + cur).toLowerCase();
    const timed = latencyMs !== null && Number.isFinite(latencyMs) && latencyMs > 0;
    const lat = timed ? Math.min(latencyMs, 5000) : 0;
    const s = this.stats[pair];
    if (!s) { this.stats[pair] = { err: correct ? 0 : 1, lat: timed ? lat : 0, lat2: timed ? lat * lat : 0, seen: 1, hits: correct ? 1 : 0, last: now }; return; }
    s.err += ALPHA * ((correct ? 0 : 1) - s.err);
    s.seen++;
    s.last = now;
    if (correct) {
      s.hits++;
      if (timed) {
        if (s.lat === 0) { s.lat = lat; s.lat2 = lat * lat; }
        else { s.lat += ALPHA * (lat - s.lat); s.lat2 += ALPHA * (lat * lat - s.lat2); }
      }
    }
  }

  stat(pair: string): TransitionStat | undefined { return this.stats[pair.toLowerCase()]; }
  pairs(): string[] { return Object.keys(this.stats); }

  /** The typist's typical transition time: the median EMA latency over pairs with some evidence. */
  reference(minSeen = 3): number {
    const lats = Object.values(this.stats).filter((s) => s.seen >= minSeen && s.lat > 0).map((s) => s.lat).sort((a, b) => a - b);
    return lats.length ? lats[Math.floor(lats.length / 2)]! : 0;
  }

  /** How many times slower than the typist's reference this pair is (1 = typical). */
  slowness(pair: string, ref = this.reference()): number {
    const s = this.stats[pair.toLowerCase()];
    if (!s || !s.lat || !ref) return 1;
    return s.lat / ref;
  }

  /** 0..1: volume × accuracy × flow. Flow reaches 0 at twice the reference time; unevenness trims it. A slow pair is never mastered. */
  mastery(pair: string, ref = this.reference()): number {
    const s = this.stats[pair.toLowerCase()];
    if (!s) return 0;
    const volume = clamp01(s.hits / PAIR_VOLUME);
    const acc = clamp01((1 - s.err - 0.8) / 0.15);
    const speed = clamp01(1 - (this.slowness(pair, ref) - 1));
    const variance = Math.max(0, s.lat2 - s.lat * s.lat);
    const cv = s.lat > 0 ? Math.sqrt(variance) / s.lat : 1;
    const even = clamp01(1 - cv / 0.6);
    return volume * acc * speed * (0.7 + 0.3 * even);
  }

  /** Pairs made only of `keys` with enough evidence, weakest first. */
  weakest(keys: Iterable<string>, minSeen = 6): { pair: string; mastery: number; slowness: number; err: number }[] {
    const set = new Set([...keys].map((k) => k.toLowerCase()));
    const ref = this.reference();
    const out: { pair: string; mastery: number; slowness: number; err: number }[] = [];
    for (const [pair, s] of Object.entries(this.stats)) {
      if (s.seen < minSeen || !set.has(pair[0]!) || !set.has(pair[1]!)) continue;
      out.push({ pair, mastery: this.mastery(pair, ref), slowness: this.slowness(pair, ref), err: s.err });
    }
    return out.sort((a, b) => a.mastery - b.mastery);
  }

  /** Heat for textgen: weak pairs pull words that contain them. */
  heatMap(keys: Iterable<string>): Record<string, number> {
    const out: Record<string, number> = {};
    for (const w of this.weakest(keys)) out[w.pair] = (1 - w.mastery) * 2;
    return out;
  }

  toJSON(): TransitionStats { return structuredClone(this.stats); }

  static fromJSON(raw: unknown): TransitionModel {
    const stats: TransitionStats = {};
    const n = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, x) : d);
    if (raw && typeof raw === 'object') {
      for (const [pair, v] of Object.entries(raw as Record<string, unknown>)) {
        if (!v || typeof v !== 'object' || pair.length !== 2 || pair.includes(' ')) continue;
        const r = v as Record<string, unknown>;
        const seen = Math.floor(n(r.seen)), lat = n(r.lat);
        stats[pair] = { err: Math.min(1, n(r.err)), lat, lat2: n(r.lat2, lat * lat), seen, hits: Math.min(seen, Math.floor(n(r.hits))), last: n(r.last) };
      }
    }
    return new TransitionModel(stats);
  }
}
