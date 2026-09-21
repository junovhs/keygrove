import type { Band, Flow, Glyph } from './textflow';

/** A glyph that has lifted off the line. Pooled; `life` ≤ 0 means free. */
interface Leaf { ch: string; x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; ttl: number }
/** A hot fleck thrown off a miss. Drawn as a short streak along its velocity. */
interface Spark { x: number; y: number; vx: number; vy: number; life: number; ttl: number; size: number }
/** An expanding ring left where a key settled. */
interface Ring { x: number; y: number; r0: number; r1: number; life: number; ttl: number; strong: boolean }
/** A glyph that just turned from current to done: it pops for a moment. */
interface Settle { index: number; at: number }

export const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const MISS_MS = 420;
const SETTLE_MS = 240;
const POP_MS = 140;

/**
 * Per-frame effects over the canvas prompt. Everything here is positioned from the Pretext
 * glyph layout, so nothing reads the DOM: a sprung cursor box that glides to the next glyph,
 * a pop + ring + leaf where a key settled, a combo glow that warms up under the cursor, and
 * the miss — a black pill, an orange letter, a violent shake and a spray of sparks before the
 * box returns to waiting. Pools are fixed; tick() allocates nothing.
 */
export class Effects {
  readonly leaves: Leaf[] = Array.from({ length: 96 }, () => ({ ch: '', x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, ttl: 1 }));
  readonly sparks: Spark[] = Array.from({ length: 160 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, ttl: 1, size: 1 }));
  readonly rings: Ring[] = Array.from({ length: 24 }, () => ({ x: 0, y: 0, r0: 0, r1: 0, life: 0, ttl: 1, strong: false }));
  private readonly settles: Settle[] = Array.from({ length: 12 }, () => ({ index: -1, at: -Infinity }));
  private settleHead = 0;
  private liveLeaves = 0;
  private liveSparks = 0;
  private liveRings = 0;

  /** Cursor box in flow px: animated position/size and the target it is springing to. */
  readonly cursor = { x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, vw: 0, tx: 0, ty: 0, tw: 0, th: 0, movedAt: -Infinity, placed: false };
  /** Miss window: when it started (−∞ = not missing). */
  missAt = -Infinity;
  /** 0..1 combo warmth under the cursor. Rises with correct keys, collapses on a miss. */
  heat = 0;
  /** Orb in flow px, or null when the pointer is away. */
  orb: { x: number; y: number; r: number } | null = null;
  enabled = !reducedMotion();
  private seed = 1;
  private rnd(): number { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }

  /** Anything animating right now? Drives whether the prompt keeps a rAF loop alive. */
  active(now: number): boolean {
    if (!this.enabled) return false;
    const c = this.cursor;
    const springing = Math.abs(c.x - c.tx) > 0.2 || Math.abs(c.y - c.ty) > 0.2 || Math.abs(c.w - c.tw) > 0.2 || Math.abs(c.vx) > 1 || Math.abs(c.vy) > 1;
    return this.liveLeaves > 0 || this.liveSparks > 0 || this.liveRings > 0 || springing || now < this.missAt + MISS_MS
      || now < c.movedAt + POP_MS || this.heat > 0.01 || this.orb !== null || this.settles.some((s) => now < s.at + SETTLE_MS);
  }

  /** Aim the cursor at a glyph. Snaps when nothing has been placed yet (new text) or motion is off. */
  target(g: Glyph, w: number, h: number, now: number, snap = false): void {
    const c = this.cursor;
    const moved = c.tx !== g.x || c.ty !== g.y;
    c.tx = g.x; c.ty = g.y; c.tw = w; c.th = h;
    if (snap || !c.placed || !this.enabled) { c.x = g.x; c.y = g.y; c.w = w; c.h = h; c.vx = c.vy = c.vw = 0; c.placed = true; return; }
    if (moved) c.movedAt = now;
  }
  /** Forget the cursor so the next target snaps (new passage). */
  reset(): void { this.cursor.placed = false; this.missAt = -Infinity; this.heat = 0; for (const s of this.settles) s.at = -Infinity; }

  /** A correct key on glyph `g`: pop it, ring it, lift a leaf, warm the glow. */
  hit(g: Glyph, now: number, strong = false): void {
    if (!this.enabled) return;
    const s = this.settles[this.settleHead]!; s.index = g.index; s.at = now; this.settleHead = (this.settleHead + 1) % this.settles.length;
    this.spawnRing(g.x + g.w / 2, g.y, strong);
    this.spawnLeaf(g, strong);
    this.heat = Math.min(1, this.heat + (strong ? 0.12 : 0.07));
  }
  /** A wrong key on the current glyph: the pill, the shake and the sparks. */
  miss(g: Glyph, now: number): void {
    if (!this.enabled) return;
    this.missAt = now;
    this.heat = 0;
    this.spawnSparks(g.x + g.w / 2, g.y, 22);
  }
  /** Passage finished: every visible glyph lifts and the line throws sparks. */
  burst(flow: Flow, firstLine: number, lastLine: number): void {
    if (!this.enabled) return;
    let n = 0;
    for (const g of flow.glyphs) {
      if (g.line < firstLine || g.line > lastLine || g.ch === ' ') continue;
      if (n++ % 2 === 0) this.spawnLeaf(g, true);
    }
    const line = flow.lines[Math.min(lastLine, flow.lines.length - 1)];
    if (line) { for (let i = 0; i < 6; i++) this.spawnSparks(line.x + (line.width * (i + 0.5)) / 6, line.y, 6); this.spawnRing(line.x + line.width / 2, line.y, true); }
    this.heat = 1;
  }

  /** Pop progress 0..1 for a glyph that just settled, or −1 if it did not. */
  settleT(index: number, now: number): number {
    for (const s of this.settles) if (s.index === index && now < s.at + SETTLE_MS) return (now - s.at) / SETTLE_MS;
    return -1;
  }
  /** Inside the miss window? */
  missing(now: number): boolean { return now < this.missAt + MISS_MS; }
  /** Shake offset for the current glyph, px. Violent at first, dying to nothing over the window. */
  shake(now: number): { x: number; y: number } {
    if (!this.missing(now)) return { x: 0, y: 0 };
    const t = (now - this.missAt) / MISS_MS, env = (1 - t) * (1 - t);
    const w = now * 0.28; // ~45 Hz
    return { x: Math.sin(w) * 11 * env, y: Math.cos(w * 0.63) * 4 * env };
  }
  /** Scale pop for the cursor box after it lands, and for the miss pill. */
  cursorScale(now: number): number {
    const pop = Math.max(0, 1 - (now - this.cursor.movedAt) / POP_MS);
    const miss = this.missing(now) ? (1 - (now - this.missAt) / MISS_MS) : 0;
    return 1 + 0.14 * pop * pop + 0.22 * miss * miss;
  }

  spawnLeaf(g: Glyph, strong = false): void {
    if (!this.enabled) return;
    const n = strong ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const l = this.leaves.find((x) => x.life <= 0);
      if (!l) return;
      l.ch = g.ch === ' ' ? '·' : g.ch; l.x = g.x + g.w / 2; l.y = g.y;
      l.vx = (this.rnd() - 0.5) * 110 + (k ? 40 : 0); l.vy = -(80 + this.rnd() * 90);
      l.rot = (this.rnd() - 0.5) * 0.6; l.vr = (this.rnd() - 0.5) * 7; l.ttl = 0.5 + this.rnd() * 0.3; l.life = l.ttl;
      this.liveLeaves++;
    }
  }
  private spawnSparks(x: number, y: number, n: number): void {
    for (let k = 0; k < n; k++) {
      const s = this.sparks.find((p) => p.life <= 0);
      if (!s) return;
      const a = -Math.PI / 2 + (this.rnd() - 0.5) * Math.PI * 1.5; // mostly upward, some sideways
      const v = 160 + this.rnd() * 320;
      s.x = x + (this.rnd() - 0.5) * 8; s.y = y + (this.rnd() - 0.5) * 8;
      s.vx = Math.cos(a) * v; s.vy = Math.sin(a) * v;
      s.ttl = 0.3 + this.rnd() * 0.35; s.life = s.ttl; s.size = 1.8 + this.rnd() * 2.2;
      this.liveSparks++;
    }
  }
  private spawnRing(x: number, y: number, strong: boolean): void {
    const r = this.rings.find((q) => q.life <= 0);
    if (!r) return;
    r.x = x; r.y = y; r.r0 = strong ? 12 : 8; r.r1 = strong ? 46 : 26; r.ttl = strong ? 0.5 : 0.32; r.life = r.ttl; r.strong = strong;
    this.liveRings++;
  }

  setOrb(x: number, y: number, r: number): void { if (!this.enabled) return; if (!this.orb) this.orb = { x, y, r }; else { this.orb.x = x; this.orb.y = y; this.orb.r = r; } }
  clearOrb(): void { this.orb = null; }

  /** Band for a line so it avoids the orb: text goes to whichever side has more room. */
  band(width: number, lineHeight: number, i: number, y: number): number | Band {
    const o = this.orb;
    if (!o) return width;
    const cy = y + lineHeight / 2;
    const dy = Math.abs(cy - o.y);
    if (dy >= o.r + lineHeight * 0.45) return width;
    const half = Math.sqrt(Math.max(0, o.r * o.r - dy * dy)) + lineHeight * 0.4;
    const left = o.x - half, right = o.x + half;
    if (left >= width - left && left > 0) return { x: 0, width: Math.max(1, left) };
    return { x: Math.min(width - 1, Math.max(0, right)), width: Math.max(1, width - right) };
  }

  tick(dt: number): void {
    // Cursor spring: a touch under-damped so the box lands with a little life.
    const c = this.cursor;
    if (c.placed) {
      const k = 900, d = 2 * Math.sqrt(k) * 0.82;
      c.vx += ((c.tx - c.x) * k - c.vx * d) * dt; c.x += c.vx * dt;
      c.vy += ((c.ty - c.y) * k - c.vy * d) * dt; c.y += c.vy * dt;
      c.vw += ((c.tw - c.w) * k - c.vw * d) * dt; c.w += c.vw * dt;
      c.h = c.th;
    }
    this.heat = Math.max(0, this.heat - dt * 0.28);
    if (this.liveLeaves > 0) for (const l of this.leaves) {
      if (l.life <= 0) continue;
      l.life -= dt;
      if (l.life <= 0) { this.liveLeaves--; continue; }
      l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 60 * dt; l.rot += l.vr * dt;
    }
    if (this.liveSparks > 0) for (const s of this.sparks) {
      if (s.life <= 0) continue;
      s.life -= dt;
      if (s.life <= 0) { this.liveSparks--; continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 1100 * dt; s.vx *= 1 - 1.6 * dt;
    }
    if (this.liveRings > 0) for (const r of this.rings) {
      if (r.life <= 0) continue;
      r.life -= dt;
      if (r.life <= 0) this.liveRings--;
    }
  }

  /** The glow that sits under the cursor. Drawn before the glyphs. */
  drawHeat(ctx: CanvasRenderingContext2D, ox: number, oy: number, lineHeight: number): void {
    if (this.heat <= 0.01) return;
    const c = this.cursor, cx = ox + c.x + c.w / 2, cy = oy + c.y + lineHeight / 2;
    const r = lineHeight * (0.9 + this.heat * 1.1), a = 0.08 + this.heat * 0.3;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,120,60,${a})`); g.addColorStop(0.5, `rgba(255,84,24,${a * 0.35})`); g.addColorStop(1, 'rgba(255,84,24,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  /** Draw rings, sparks, leaves and the orb over the glyphs. `ox/oy` = flow origin on the canvas. */
  draw(ctx: CanvasRenderingContext2D, ox: number, oy: number, lineHeight: number, font: string, flow: Flow): void {
    void flow;
    const o = this.orb;
    if (o) {
      const g = ctx.createRadialGradient(ox + o.x, oy + o.y, 0, ox + o.x, oy + o.y, o.r);
      g.addColorStop(0, 'rgba(255,84,24,.55)'); g.addColorStop(0.55, 'rgba(255,84,24,.18)'); g.addColorStop(1, 'rgba(255,84,24,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox + o.x, oy + o.y, o.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8b61'; ctx.beginPath(); ctx.arc(ox + o.x, oy + o.y, 5, 0, Math.PI * 2); ctx.fill();
    }
    if (this.liveRings > 0) {
      ctx.lineWidth = 2;
      for (const r of this.rings) {
        if (r.life <= 0) continue;
        const t = 1 - r.life / r.ttl, e = 1 - (1 - t) * (1 - t);
        ctx.strokeStyle = `rgba(255,84,24,${(1 - t) * (r.strong ? 0.6 : 0.45)})`;
        ctx.beginPath(); ctx.arc(ox + r.x, oy + r.y + lineHeight / 2, r.r0 + (r.r1 - r.r0) * e, 0, Math.PI * 2); ctx.stroke();
      }
    }
    if (this.liveSparks > 0) {
      ctx.lineCap = 'round';
      for (const s of this.sparks) {
        if (s.life <= 0) continue;
        const a = s.life / s.ttl;
        const x = ox + s.x, y = oy + s.y + lineHeight / 2;
        ctx.strokeStyle = a > 0.5 ? `rgba(255,200,120,${a})` : `rgba(255,84,24,${a * 1.6})`;
        ctx.lineWidth = s.size * a + 0.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.028, y - s.vy * 0.028); ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
    if (this.liveLeaves > 0) {
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const l of this.leaves) {
        if (l.life <= 0) continue;
        const a = l.life / l.ttl;
        ctx.save();
        ctx.globalAlpha = a * 0.9;
        ctx.translate(ox + l.x, oy + l.y + lineHeight / 2);
        ctx.rotate(l.rot);
        ctx.scale(0.7 + a * 0.3, 0.7 + a * 0.3);
        ctx.fillStyle = '#ff8b61';
        ctx.fillText(l.ch, 0, 0);
        ctx.restore();
      }
      ctx.textAlign = 'left';
    }
  }
}
