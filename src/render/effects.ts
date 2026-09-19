import type { Band, Flow, Glyph } from './textflow';

/** A glyph that has lifted off the line. Pooled; `life` ≤ 0 means free. */
interface Leaf { ch: string; x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; ttl: number }

export const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Per-frame effects over the canvas prompt: leaves on correct keys, a shake on misses,
 * and an orb that carves the line bands so text wraps around it. No allocations in tick().
 */
export class Effects {
  readonly leaves: Leaf[] = Array.from({ length: 64 }, () => ({ ch: '', x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, life: 0, ttl: 1 }));
  private live = 0;
  shakeUntil = 0;
  /** Orb in flow px, or null when the pointer is away. */
  orb: { x: number; y: number; r: number } | null = null;
  enabled = !reducedMotion();
  private seed = 1;
  private rnd(): number { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }

  /** Anything animating right now? Drives whether the prompt keeps a rAF loop alive. */
  active(now: number): boolean { return this.enabled && (this.live > 0 || now < this.shakeUntil || this.orb !== null); }

  spawnLeaf(g: Glyph, strong = false): void {
    if (!this.enabled) return;
    const n = strong ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const l = this.leaves.find((x) => x.life <= 0);
      if (!l) return;
      l.ch = g.ch === ' ' ? '·' : g.ch; l.x = g.x + g.w / 2; l.y = g.y;
      l.vx = (this.rnd() - 0.5) * 90 + (k ? 40 : 0); l.vy = -(60 + this.rnd() * 70);
      l.rot = 0; l.vr = (this.rnd() - 0.5) * 6; l.ttl = 0.45 + this.rnd() * 0.25; l.life = l.ttl;
      this.live++;
    }
  }
  shake(now: number): void { if (this.enabled) this.shakeUntil = now + 120; }
  /** Horizontal shake offset for the current glyph, px. */
  shakeOffset(now: number): number { if (now >= this.shakeUntil) return 0; const t = (this.shakeUntil - now) / 120; return Math.sin(t * Math.PI * 6) * 6 * t; }

  setOrb(x: number, y: number, r: number): void { if (!this.enabled) return; if (!this.orb) this.orb = { x, y, r }; else { this.orb.x = x; this.orb.y = y; this.orb.r = r; } }
  clearOrb(): void { this.orb = null; }

  /** Band for a line so it avoids the orb: text goes to whichever side has more room. */
  band(width: number, lineHeight: number, i: number, y: number): number | Band {
    const o = this.orb;
    if (!o) return width;
    const cy = y + lineHeight / 2;
    const dy = Math.abs(cy - o.y);
    if (dy >= o.r + lineHeight * 0.45) return width;
    const half = Math.sqrt(Math.max(0, o.r * o.r - dy * dy)) + lineHeight * 0.4; // chord half-width plus breathing room
    const left = o.x - half, right = o.x + half;
    if (left >= width - left && left > 0) return { x: 0, width: Math.max(1, left) };
    return { x: Math.min(width - 1, Math.max(0, right)), width: Math.max(1, width - right) };
  }

  tick(dt: number): void {
    if (this.live === 0) return;
    for (const l of this.leaves) {
      if (l.life <= 0) continue;
      l.life -= dt;
      if (l.life <= 0) { this.live--; continue; }
      l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 40 * dt; l.rot += l.vr * dt;
    }
  }

  /** Draw leaves and the orb. `ox/oy` = flow origin on the canvas. */
  draw(ctx: CanvasRenderingContext2D, ox: number, oy: number, lineHeight: number, font: string, flow: Flow): void {
    void flow;
    const o = this.orb;
    if (o) {
      const g = ctx.createRadialGradient(ox + o.x, oy + o.y, 0, ox + o.x, oy + o.y, o.r);
      g.addColorStop(0, 'rgba(255,84,24,.55)'); g.addColorStop(0.55, 'rgba(255,84,24,.18)'); g.addColorStop(1, 'rgba(255,84,24,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox + o.x, oy + o.y, o.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8b61'; ctx.beginPath(); ctx.arc(ox + o.x, oy + o.y, 5, 0, Math.PI * 2); ctx.fill();
    }
    if (this.live === 0) return;
    ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const l of this.leaves) {
      if (l.life <= 0) continue;
      const a = l.life / l.ttl;
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.translate(ox + l.x, oy + l.y + lineHeight / 2);
      ctx.rotate(l.rot);
      ctx.fillStyle = '#ff8b61';
      ctx.fillText(l.ch, 0, 0);
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }
}
