import type { Heat } from './textgen';

/**
 * Per-key running stats. EMAs unless noted. `lat`/`lat2` feed variance; `base` is the EMA of this key's
 * own non-spike latency; `spikes` is the EMA rate of presses slower than 1.8× `base` (a pause = searching
 * for the key — a consistently slow key is not searching); `due`/`interval` drive spaced review.
 */
export interface KeyStat { err: number; lat: number; lat2: number; base: number; spikes: number; seen: number; hits: number; streak: number; last: number; reviews: number; interval: number; due: number }
export type KeyStats = Record<string, KeyStat>;
/** wanted→typed substitution counts, decayed per run. Key format "k>d". */
export type Confusions = Record<string, number>;

const ALPHA = 0.15;
const DAY = 86_400_000;
export const SPIKE_RATIO = 1.8;
/** Correct presses needed before a key can reach full mastery. */
export const VOLUME = 50;
export const MASTERED = 0.8;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Adaptive per-key model. Mastery = volume × (0.55·accuracy + 0.45·rhythm), decaying past its review date.
 * Speed is deliberately not a factor: accuracy and a steady rhythm are what we train; WPM only earns stars.
 */
export class KeyModel {
  constructor(private stats: KeyStats = {}, private conf: Confusions = {}) {}

  /**
   * Record one press of `wanted`. `typed` (on a miss) feeds the confusion matrix.
   * `latencyMs` null = no timing evidence (the first key of a run, or a review touch): accuracy only.
   */
  record(wanted: string, correct: boolean, latencyMs: number | null, now = Date.now(), typed?: string): void {
    const k = wanted.toLowerCase();
    const timed = latencyMs !== null && Number.isFinite(latencyMs);
    const lat = timed ? Math.min(Math.max(latencyMs, 0), 5000) : 0;
    const s = this.stats[k];
    if (!s) {
      this.stats[k] = { err: correct ? 0 : 1, lat: timed ? lat : 0, lat2: timed ? lat * lat : 0, base: timed ? lat : 0, spikes: 0, seen: 1, hits: correct ? 1 : 0, streak: correct ? 1 : 0, last: now, reviews: 0, interval: DAY, due: now + DAY };
    } else {
      const fresh = s.base === 0 && timed; // first timed sample seeds the latency EMAs
      const spike = timed && !fresh && s.hits >= 3 && lat > SPIKE_RATIO * s.base ? 1 : 0;
      s.err += ALPHA * ((correct ? 0 : 1) - s.err);
      if (correct) {
        s.hits++; s.streak++;
        if (timed) {
          if (fresh) { s.lat = lat; s.lat2 = lat * lat; s.base = lat; }
          else { s.lat += ALPHA * (lat - s.lat); s.lat2 += ALPHA * (lat * lat - s.lat2); if (!spike) s.base += ALPHA * (lat - s.base); }
        }
      } else s.streak = 0;
      if (timed && !fresh) s.spikes += ALPHA * (spike - s.spikes);
      s.seen++; s.last = now;
      if (now > s.due) { s.interval = Math.min(30 * DAY, s.interval * (correct ? 2 : 1)); s.due = now + s.interval; if (correct) s.reviews++; }
    }
    if (!correct && typed && typed.length === 1 && typed !== ' ') {
      const key = `${k}>${typed.toLowerCase()}`;
      this.conf[key] = (this.conf[key] ?? 0) + 1;
    }
  }

  /** Call once per finished run: confusion counts fade so old mistakes stop haunting. */
  endRun(): void { for (const k of Object.keys(this.conf)) { this.conf[k] = this.conf[k]! * 0.85; if (this.conf[k]! < 0.5) delete this.conf[k]; } }

  accuracy(key: string): number { const s = this.stats[key.toLowerCase()]; return s ? 1 - s.err : 1; }

  /** 0..1 — how even the timing on this key is: low variance and few searching pauses. */
  rhythm(key: string): number {
    const s = this.stats[key.toLowerCase()];
    if (!s || s.hits < 3) return 0;
    const variance = Math.max(0, s.lat2 - s.lat * s.lat);
    const cv = s.lat > 0 ? Math.sqrt(variance) / s.lat : 1;
    const cvScore = clamp01(1 - cv / 0.6);
    const spikeScore = clamp01(1 - s.spikes / 0.3);
    return 0.5 * cvScore + 0.5 * spikeScore;
  }

  /** 0..1 mastery; ≥ MASTERED counts as mastered. */
  mastery(key: string, now = Date.now()): number {
    const s = this.stats[key.toLowerCase()];
    if (!s) return 0;
    const volume = clamp01(s.hits / VOLUME);
    const acc = clamp01((1 - s.err - 0.88) / 0.1); // 88% → 0, 98% → 1
    const raw = volume * (0.55 * acc + 0.45 * this.rhythm(key));
    if (now <= s.due) return raw;
    const overdue = (now - s.due) / Math.max(DAY, s.interval);
    return raw * Math.max(0.4, 1 - 0.25 * overdue);
  }

  /** Heat for textgen: weak, rusty, and confused keys pull their words in. */
  heatMap(now = Date.now(), due: ReadonlySet<string> = new Set()): Heat {
    const out: Record<string, number> = {};
    for (const k of Object.keys(this.stats)) out[k] = (1 - this.mastery(k, now)) * 1.5 + this.stats[k]!.err + (due.has(k) ? 1 : 0);
    return out;
  }

  /** Keys among `keys` below mastery threshold with enough evidence, worst first. */
  weakest(keys: Iterable<string>, now = Date.now(), minSeen = 8): { key: string; mastery: number; err: number }[] {
    const out: { key: string; mastery: number; err: number }[] = [];
    for (const k of keys) { const s = this.stats[k]; if (!s || s.seen < minSeen) continue; out.push({ key: k, mastery: this.mastery(k, now), err: s.err }); }
    return out.sort((a, b) => a.mastery - b.mastery);
  }

  /** Keys you pause before: spike rate ≥ 0.3 with ≥ 10 presses. Consistently slow keys do not count. */
  searching(keys: Iterable<string>): { key: string; spikes: number }[] {
    const out: { key: string; spikes: number }[] = [];
    for (const k of keys) { const s = this.stats[k]; if (!s || s.seen < 10) continue; if (s.spikes >= 0.3) out.push({ key: k, spikes: s.spikes }); }
    return out.sort((a, b) => b.spikes - a.spikes);
  }

  /** Substitution pairs at or above `min` recent occurrences, strongest first. */
  confusions(min = 4): { wanted: string; typed: string; count: number }[] {
    return Object.entries(this.conf).filter(([, n]) => n >= min).map(([k, n]) => { const [wanted, typed] = k.split('>') as [string, string]; return { wanted, typed, count: n }; }).sort((a, b) => b.count - a.count);
  }

  /** Keys whose review date has passed, most overdue first. */
  dueKeys(keys: Iterable<string>, now = Date.now()): string[] {
    const out: { k: string; over: number }[] = [];
    for (const k of keys) { const s = this.stats[k]; if (s && s.seen >= 5 && now > s.due) out.push({ k, over: now - s.due }); }
    return out.sort((a, b) => b.over - a.over).map((x) => x.k);
  }

  stat(key: string): KeyStat | undefined { return this.stats[key.toLowerCase()]; }
  toJSON(): { keys: KeyStats; confusions: Confusions } { return structuredClone({ keys: this.stats, confusions: this.conf }); }

  static fromJSON(rawKeys: unknown, rawConf?: unknown): KeyModel {
    const keys: KeyStats = {};
    const n = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, x) : d);
    if (rawKeys && typeof rawKeys === 'object') {
      for (const [k, v] of Object.entries(rawKeys as Record<string, unknown>)) {
        if (!v || typeof v !== 'object' || k.length !== 1) continue;
        const r = v as Record<string, unknown>;
        const seen = Math.floor(n(r.seen)), err = Math.min(1, n(r.err)), lat = n(r.lat), last = n(r.last);
        keys[k] = {
          err, lat, lat2: n(r.lat2, lat * lat), base: n(r.base, lat) || lat, spikes: Math.min(1, n(r.spikes)), seen,
          hits: Math.floor(n(r.hits, Math.round(seen * (1 - err)))), streak: Math.floor(n(r.streak)), last,
          reviews: Math.floor(n(r.reviews)), interval: n(r.interval, DAY) || DAY, due: n(r.due, last + DAY),
        };
      }
    }
    const conf: Confusions = {};
    if (rawConf && typeof rawConf === 'object') for (const [k, v] of Object.entries(rawConf as Record<string, unknown>)) if (/^.>.$/.test(k)) conf[k] = n(v);
    return new KeyModel(keys, conf);
  }
}
