import { Effects } from './effects';
import { TextFlow, type Flow, type WidthForLine } from './textflow';

export interface PromptState { text: string; pos: number; wrong: boolean }

const COLORS = { ink: '#e8e6df', done: '#8e8d86', orange: '#ff5418', wrongBg: '#ffb49f', wrongInk: '#201814', pill: '#2b2c29', pillLine: '#5c5e59', pillInk: '#c5c3bc', pillDone: '#222320', pillDoneInk: '#74766f' };

/**
 * Canvas prompt. Owns a <canvas> inside the host, keeps a hidden text mirror for screen readers,
 * and redraws on demand (coalesced to one rAF). Nothing in draw() reads DOM layout.
 */
export class CanvasPrompt {
  readonly canvas: HTMLCanvasElement;
  private mirror: HTMLElement;
  private ctx: CanvasRenderingContext2D;
  private flow: TextFlow;
  private state: PromptState = { text: '', pos: 0, wrong: false };
  private width = 0;
  private dpr = 1;
  private raf = 0;
  private fontPx = 32;
  private padding = 16;
  /** Optional per-line width override; null = full width (the orb sets one while present). */
  widthForLine: WidthForLine | null = null;
  private lastFlow: Flow | null = null;
  readonly effects = new Effects();
  private loop = 0;
  private lastTick = 0;
  private top = 0;

  constructor(private host: HTMLElement) {
    host.innerHTML = '';
    host.classList.add('prompt-canvas');
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden', 'true');
    this.mirror = document.createElement('div');
    this.mirror.className = 'sr-only';
    this.mirror.setAttribute('aria-live', 'polite');
    host.append(this.canvas, this.mirror);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d unavailable');
    this.ctx = ctx;
    this.flow = new TextFlow(this.font(), this.lineHeight(), this.letterSpacing(), 'center', 3);
    const ro = new ResizeObserver(() => this.measureHost());
    ro.observe(host);
    this.measureHost();
    host.addEventListener('pointermove', (e) => this.pointer(e));
    const leave = () => { this.effects.clearOrb(); this.widthForLine = null; this.lastFlow = null; this.requestDraw(); };
    host.addEventListener('pointerleave', leave);
    host.addEventListener('pointercancel', leave);
    document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  }

  /** Pointer → orb in flow coordinates. Reads one rect per event, never inside the frame loop. */
  private pointer(e: PointerEvent): void {
    if (!this.effects.enabled) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.padding, y = e.clientY - rect.top - this.top;
    this.effects.setOrb(x, y, Math.round(this.fontPx * 1.6));
    this.widthForLine = (i, ly) => this.effects.band(this.width, this.flow.lineHeight, i, ly);
    this.ensureLoop();
  }

  /** Feed a key result so effects can react. */
  onKey(kind: 'ok' | 'miss', index: number, strong = false): void {
    const g = this.lastFlow?.glyphs.find((x) => x.index === index);
    const now = performance.now();
    if (kind === 'ok' && g) this.effects.spawnLeaf(g, strong);
    if (kind === 'miss') this.effects.shake(now);
    this.ensureLoop();
  }

  private ensureLoop(): void {
    if (this.loop) return;
    this.lastTick = performance.now();
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - this.lastTick) / 1000); this.lastTick = t;
      this.effects.tick(dt);
      this.draw();
      if (this.effects.active(t)) this.loop = requestAnimationFrame(step); else { this.loop = 0; this.requestDraw(); }
    };
    this.loop = requestAnimationFrame(step);
  }

  private font(): string { return `600 ${this.fontPx}px ${getComputedStyle(this.host).getPropertyValue('--mono') || 'ui-monospace, monospace'}`; }
  private lineHeight(): number { return Math.round(this.fontPx * 1.75); }
  private letterSpacing(): number { return Math.round(this.fontPx * 0.32); }

  /** Reads host size once per resize (outside the frame loop) and re-lays out. */
  private measureHost(): void {
    const rect = this.host.getBoundingClientRect();
    const fontPx = Math.max(22, Math.min(34, Math.round(rect.width * 0.024)));
    this.width = Math.max(1, Math.floor(rect.width) - this.padding * 2);
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    if (fontPx !== this.fontPx) { this.fontPx = fontPx; this.flow.setFont(this.font(), this.lineHeight(), this.letterSpacing()); }
    this.lastFlow = null;
    this.requestDraw();
  }

  set(s: PromptState): void {
    if (s.text !== this.state.text) { this.flow.setText(s.text); this.lastFlow = null; this.mirror.textContent = s.text; }
    this.state = { ...s };
    this.requestDraw();
  }

  /** Current layout (recomputed only when text/width changed or a width callback is active). */
  layout(): Flow {
    if (this.widthForLine) { this.lastFlow = this.flow.layout(this.widthForLine, this.width); return this.lastFlow; }
    if (!this.lastFlow) this.lastFlow = this.flow.layout(this.width);
    return this.lastFlow;
  }

  requestDraw(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
  }

  private sizeCanvas(cssH: number): void {
    const cssW = this.width + this.padding * 2;
    const w = Math.round(cssW * this.dpr), h = Math.round(cssH * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
      this.canvas.style.width = cssW + 'px'; this.canvas.style.height = cssH + 'px';
    }
  }

  draw(): void {
    const flow = this.layout();
    const lh = this.flow.lineHeight;
    const cssH = Math.max(lh * 2, flow.height) + this.padding * 2;
    this.sizeCanvas(cssH);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width + this.padding * 2, cssH);
    ctx.font = this.flow.font;
    ctx.textBaseline = 'middle';
    const top = this.padding + Math.max(0, (cssH - this.padding * 2 - flow.height) / 2);
    this.top = top;
    const { pos, wrong } = this.state;
    const now = performance.now();
    const shake = this.effects.shakeOffset(now);
    for (const g of flow.glyphs) {
      const x = this.padding + g.x + (g.index === pos ? shake : 0), cy = top + g.y + lh / 2;
      const done = g.index < pos, current = g.index === pos, bad = current && wrong;
      if (g.ch === ' ') {
        const h = Math.round(this.fontPx * 1.25), w = g.w;
        ctx.fillStyle = bad ? COLORS.wrongBg : current ? COLORS.orange : done ? COLORS.pillDone : COLORS.pill;
        ctx.strokeStyle = bad ? COLORS.wrongBg : current ? COLORS.orange : COLORS.pillLine;
        ctx.beginPath(); ctx.roundRect(x, cy - h / 2, w, h, 4); ctx.fill(); if (!done && !current) ctx.stroke();
        ctx.fillStyle = bad ? COLORS.wrongInk : current ? '#fff' : done ? COLORS.pillDoneInk : COLORS.pillInk;
        ctx.font = `600 ${Math.round(this.fontPx * 0.36)}px ${this.flow.font.split('px ')[1]}`;
        ctx.textAlign = 'center'; ctx.fillText('SPACE', x + w / 2, cy + 1); ctx.textAlign = 'left';
        ctx.font = this.flow.font;
        continue;
      }
      if (current) {
        const box = Math.round(this.fontPx * 1.4), pad = (box - g.w) / 2;
        ctx.fillStyle = bad ? COLORS.wrongBg : COLORS.orange;
        ctx.beginPath(); ctx.roundRect(x - pad, cy - box / 2, box, box, 5); ctx.fill();
        ctx.fillStyle = bad ? COLORS.wrongInk : '#fff';
      } else ctx.fillStyle = done ? COLORS.done : COLORS.ink;
      ctx.fillText(g.ch, x, cy + 1);
    }
    this.effects.draw(ctx, this.padding, top, lh, this.flow.font, flow);
  }
}
