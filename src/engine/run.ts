import { accOf, wpmOf } from './scoring';

export type RunStatus = 'idle' | 'playing' | 'complete';
export type KeyOutcome = 'ok' | 'miss' | 'done' | 'space-wait' | 'ignored';
export interface Keystroke { key: string; correct: boolean; latencyMs: number }

/** One attempt at a text. Pure: no DOM, no clock of its own (pass `now`). */
export class Run {
  pos = 0; status: RunStatus = 'idle';
  hits = 0; attempts = 0; errors = 0; combo = 0; maxCombo = 0; wrong = false;
  start = 0; end = 0; private lastKeyAt = 0;
  readonly strokes: Keystroke[] = [];
  constructor(public readonly text: string) {}

  get current(): string { return this.text[this.pos] ?? ''; }
  begin(now: number): void {
    if (this.status === 'playing') return;
    this.status = 'playing'; this.pos = this.hits = this.attempts = this.errors = this.combo = this.maxCombo = 0;
    this.wrong = false; this.start = now; this.lastKeyAt = now; this.strokes.length = 0;
  }
  /** Feed one printable key. A non-space key while space is expected is a soft nudge, not a miss. */
  type(k: string, now: number): KeyOutcome {
    if (this.status !== 'playing' || k.length !== 1) return 'ignored';
    const want = this.current;
    if (want === ' ' && k !== ' ') { this.wrong = true; return 'space-wait'; }
    const latencyMs = now - this.lastKeyAt; this.lastKeyAt = now;
    this.attempts++;
    const ok = k === want;
    this.strokes.push({ key: want, correct: ok, latencyMs });
    if (ok) {
      this.hits++; this.pos++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); this.wrong = false;
      if (this.pos === this.text.length) { this.status = 'complete'; this.end = now; return 'done'; }
      return 'ok';
    }
    this.errors++; this.combo = 0; this.wrong = true; return 'miss';
  }
  elapsed(now: number): number { return this.start ? (this.end || now) - this.start : 0; }
  metrics(now: number): { wpm: number; acc: number; pct: number } {
    return { wpm: wpmOf(this.hits, this.elapsed(now)), acc: accOf(this.hits, this.attempts), pct: Math.round((this.pos / this.text.length) * 100) };
  }
}
