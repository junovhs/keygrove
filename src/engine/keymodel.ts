import type { Heat } from './textgen';

/** Per-key running stats. `err` and `lat` are EMAs; `last` is a ms timestamp. */
export interface KeyStat { err: number; lat: number; seen: number; last: number }
export type KeyStats = Record<string, KeyStat>;

const ALPHA = 0.2;
export const HOT = 0.35;
const DAY = 86_400_000;

/**
 * Adaptive per-key model. Heat = 0.7·error-rate + 0.3·(how much slower than your median key).
 * Feeds textgen word weighting and the remedial/warm-up offers. Never touches the path.
 */
export class KeyModel {
  constructor(private stats: KeyStats = {}) {}

  record(key: string, correct: boolean, latencyMs: number, now = Date.now()): void {
    const k = key.toLowerCase();
    const lat = Math.min(Math.max(latencyMs, 0), 5000);
    const s = this.stats[k];
    if (!s) { this.stats[k] = { err: correct ? 0 : 1, lat, seen: 1, last: now }; return; }
    s.err += ALPHA * ((correct ? 0 : 1) - s.err);
    if (correct) s.lat += ALPHA * (lat - s.lat);
    s.seen++; s.last = now;
  }

  /** Median EMA latency across keys with enough samples; falls back to 400 ms. */
  medianLatency(): number {
    const ls = Object.values(this.stats).filter((s) => s.seen >= 3).map((s) => s.lat).sort((a, b) => a - b);
    if (!ls.length) return 400;
    return ls[Math.floor(ls.length / 2)]!;
  }

  heat(key: string): number {
    const s = this.stats[key.toLowerCase()];
    if (!s) return 0;
    const slow = Math.max(0, s.lat / this.medianLatency() - 1);
    return 0.7 * s.err + 0.3 * slow;
  }

  heatMap(): Heat {
    const out: Record<string, number> = {};
    for (const k of Object.keys(this.stats)) out[k] = this.heat(k);
    return out;
  }

  /** Hottest key among `keys` above the threshold, or null. Needs ≥ 3 samples to count. */
  hottest(keys: Iterable<string>, threshold = HOT): { key: string; heat: number } | null {
    let best: { key: string; heat: number } | null = null;
    for (const k of keys) {
      const s = this.stats[k];
      if (!s || s.seen < 3) continue;
      const h = this.heat(k);
      if (h >= threshold && (!best || h > best.heat)) best = { key: k, heat: h };
    }
    return best;
  }

  /** Keys among `keys` that have been practised before but not in the last `days`. */
  stale(keys: Iterable<string>, now = Date.now(), days = 2): string[] {
    const out: string[] = [];
    for (const k of keys) { const s = this.stats[k]; if (s && now - s.last > days * DAY) out.push(k); }
    return out;
  }

  toJSON(): KeyStats { return structuredClone(this.stats); }
  static fromJSON(raw: unknown): KeyModel {
    const out: KeyStats = {};
    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        if (!v || typeof v !== 'object' || k.length !== 1) continue;
        const r = v as Record<string, unknown>;
        const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, x) : 0);
        out[k] = { err: Math.min(1, n(r.err)), lat: n(r.lat), seen: Math.floor(n(r.seen)), last: n(r.last) };
      }
    }
    return new KeyModel(out);
  }
}
