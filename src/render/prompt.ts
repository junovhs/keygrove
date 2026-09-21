import { Effects } from './effects';
import { TextFlow, type Flow, type WidthForLine } from './textflow';

export interface PromptState { text: string; pos: number; wrong: boolean; reading?: boolean }

type Palette = { ink: string; done: string; orange: string; wrongBg: string; wrongInk: string; missPill: string; missInk: string; pill: string; pillLine: string; pillInk: string; pillDone: string; pillDoneInk: string };
const DARK: Palette = { ink: '#e8e6df', done: '#8e8d86', orange: '#ff5418', wrongBg: '#ffb49f', wrongInk: '#201814', missPill: '#000', missInk: '#ff5418', pill: '#2b2c29', pillLine: '#5c5e59', pillInk: '#c5c3bc', pillDone: '#222320', pillDoneInk: '#74766f' };
const LIGHT: Palette = { ink: '#11110f', done: '#b3afa8', orange: '#ff5418', wrongBg: '#ffb49f', wrongInk: '#201814', missPill: '#11110f', missInk: '#ff5418', pill: '#fbfaf7', pillLine: '#c9c5bd', pillInk: '#6d6a65', pillDone: '#f3f1ec', pillDoneInk: '#b3afa8' };
export interface PromptOptions { theme?: 'dark' | 'light'; compact?: boolean; orb?: boolean }

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
  private padding = 8;
  /** Optional per-line width override; null = full width (the orb sets one while present). */
  widthForLine: WidthForLine | null = null;
  private lastFlow: Flow | null = null;
  readonly effects = new Effects();
  private loop = 0;
  private lastTick = 0;
  private top = 0;

  private colors: Palette;
  private compact: boolean;
  private orbEnabled: boolean;
  constructor(private host: HTMLElement, opts: PromptOptions = {}) {
    this.colors = opts.theme === 'light' ? LIGHT : DARK;
    this.compact = !!opts.compact;
    this.orbEnabled = opts.orb !== false;
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
    if (!this.effects.enabled || !this.orbEnabled) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.padding, y = e.clientY - rect.top - this.top;
    this.effects.setOrb(x, y, Math.round(this.fontPx * 1.6));
    this.widthForLine = (i, ly) => this.effects.band(this.width, this.flow.lineHeight, i, ly);
    this.ensureLoop();
  }

  /** Feed a key result so effects can react. `index` is the glyph that settled (ok) or the one still waited on (miss). */
  onKey(kind: 'ok' | 'miss', index: number, strong = false): void {
    const g = this.lastFlow?.glyphs.find((x) => x.index === index);
    const now = performance.now();
    if (g && kind === 'ok') this.effects.hit(g, now, strong);
    if (g && kind === 'miss') this.effects.miss(g, now);
    this.ensureLoop();
  }
  /** The passage is done: lift the visible lines and throw a little light. */
  onComplete(): void {
    const flow = this.lastFlow;
    if (!flow) return;
    const last = flow.lines.length - 1;
    this.effects.burst(flow, Math.max(0, last - 2), last);
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
  private lineHeight(): number { return Math.round(this.fontPx * (this.compact ? 1.9 : 1.75)); }
  /** Gap between glyphs. Must exceed 2× the current-box padding so the box never touches a neighbour. */
  private letterSpacing(): number { return this.state.reading ? 2 : Math.round(this.fontPx * (this.compact ? 0.5 : 0.32)); }
  private boxPad(): number { return Math.round(this.fontPx * 0.2); }

  /** Reads host size once per resize (outside the frame loop) and re-lays out. */
  private measureHost(): void {
    const rect = this.host.getBoundingClientRect();
    const fontPx = this.state.reading ? Math.max(20, Math.min(28, Math.round(rect.width * 0.033))) : this.compact ? Math.max(24, Math.min(33, Math.round(rect.width * 0.03))) : Math.max(22, Math.min(34, Math.round(rect.width * 0.024)));
    this.width = Math.max(1, Math.floor(rect.width) - this.padding * 2);
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    if (fontPx !== this.fontPx) { this.fontPx = fontPx; this.flow.setFont(this.font(), this.lineHeight(), this.letterSpacing()); }
    this.lastFlow = null;
    this.requestDraw();
  }

  set(s: PromptState): void {
    const readingChanged = !!s.reading !== !!this.state.reading;
    const textChanged = s.text !== this.state.text;
    this.state = { ...s };
    if (readingChanged) {
      this.flow = new TextFlow(this.font(), this.lineHeight(), this.letterSpacing(), s.reading ? 'left' : 'center', s.reading ? 1 : 3);
      this.measureHost();
    }
    if (textChanged || readingChanged) { this.flow.setText(s.text); this.lastFlow = null; this.mirror.textContent = s.text; this.effects.reset(); }
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
    // Keep the current line and its neighbours in view, even for the final long passage.
    const currentLine = flow.glyphs.find(g => g.index === this.state.pos)?.line ?? Math.max(0, flow.lines.length - 1);
    const firstLine = Math.max(0, Math.min(currentLine - 1, flow.lines.length - 3));
    const visibleHeight = Math.min(flow.height, lh * 3);
    const cssH = Math.max(lh * (this.compact ? 1 : 2), visibleHeight) + this.padding * 2;
    this.sizeCanvas(cssH);
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width + this.padding * 2, cssH);
    ctx.font = this.flow.font;
    ctx.textBaseline = 'middle';
    const top = this.padding - firstLine * lh + Math.max(0, (cssH - this.padding * 2 - visibleHeight) / 2);
    this.top = top;
    const { pos, wrong } = this.state;
    const now = performance.now();
    const fx = this.effects, colors = this.colors, reading = !!this.state.reading;
    const pad = this.boxPad();
    // Aim the sprung cursor at the current glyph (flow px). A brand-new passage snaps it.
    const cur = flow.glyphs.find((g) => g.index === pos);
    if (cur) {
      const isSpace = cur.ch === ' ';
      const h = isSpace && !reading ? Math.round(this.fontPx * 1.25) : Math.round(this.fontPx * 1.4);
      const w = isSpace && !reading ? cur.w : cur.w + pad * 2;
      const x = isSpace && !reading ? cur.x : cur.x - pad;
      fx.target({ ...cur, x }, w, h, now);
    }
    const c = fx.cursor;
    const bad = !!cur && (fx.enabled ? fx.missing(now) : wrong);
    const shake = fx.shake(now);
    const scale = fx.cursorScale(now);
    const arrived = cur ? Math.abs(c.x - c.tx) < c.tw * 0.45 : false;
    fx.drawHeat(ctx, this.padding, top, lh);
    // The cursor box, drawn once at its animated position before any glyph.
    if (cur && c.placed) {
      const bx = this.padding + c.x + shake.x, by = top + c.y + lh / 2 + shake.y, bw = c.w * scale, bh = c.h * scale;
      const cx = bx + c.w / 2, r = bad ? bh / 2 : 6;
      ctx.fillStyle = bad ? colors.missPill : colors.orange;
      if (!bad && fx.heat > 0.02) { ctx.shadowColor = `rgba(255,84,24,${0.25 + fx.heat * 0.5})`; ctx.shadowBlur = 6 + fx.heat * 18; }
      ctx.beginPath(); ctx.roundRect(cx - bw / 2, by - bh / 2, bw, bh, r); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    }
    for (const g of flow.glyphs) {
      if (g.line < firstLine || g.line >= firstLine + 3) continue;
      const current = g.index === pos, done = g.index < pos;
      const x = this.padding + g.x + (current ? shake.x : 0), cy = top + g.y + lh / 2 + (current ? shake.y : 0);
      const settle = done ? fx.settleT(g.index, now) : -1;
      // Ink for the current glyph follows the box: white (or orange on a miss) once it has arrived, plain ink while it is still travelling.
      const currentInk = bad ? colors.missInk : arrived ? '#fff' : colors.ink;
      if (g.ch === ' ' && reading) {
        ctx.fillStyle = current ? currentInk : done ? colors.done : '#b8b1a5';
        ctx.fillText('·', x, cy + 1); continue;
      }
      if (g.ch === ' ') {
        const h = Math.round(this.fontPx * 1.25), w = g.w;
        if (!current) {
          ctx.fillStyle = done ? colors.pillDone : colors.pill;
          ctx.strokeStyle = colors.pillLine; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(x, cy - h / 2, w, h, 5); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = current ? currentInk : done ? colors.pillDoneInk : colors.pillInk;
        ctx.font = `600 ${Math.round(this.fontPx * 0.36)}px ${this.flow.font.split('px ')[1]}`;
        ctx.textAlign = 'center';
        // The label rides inside the sprung pill while current, so it never lags behind the box.
        const lx = current && c.placed ? this.padding + c.x + c.w / 2 + shake.x : x + w / 2;
        ctx.fillText('SPACE', lx, cy + 1); ctx.textAlign = 'left';
        ctx.font = this.flow.font;
        continue;
      }
      if (current) {
        ctx.fillStyle = currentInk;
        if (bad || scale > 1.001) {
          const s = current ? scale : 1;
          ctx.save(); ctx.translate(x + g.w / 2, cy + 1); ctx.scale(s, s); ctx.fillText(g.ch, -g.w / 2, 0); ctx.restore();
        } else ctx.fillText(g.ch, x, cy + 1);
        continue;
      }
      if (settle >= 0) {
        // A key that just settled pops up and cools from orange to the done grey.
        const e = 1 - settle, s = 1 + 0.38 * e * e;
        ctx.save(); ctx.translate(x + g.w / 2, cy + 1); ctx.scale(s, s);
        ctx.fillStyle = settle < 0.55 ? colors.orange : colors.done;
        ctx.globalAlpha = settle < 0.55 ? 1 : 1 - (settle - 0.55) * 0.5;
        ctx.fillText(g.ch, -g.w / 2, 0); ctx.restore();
        continue;
      }
      ctx.fillStyle = done ? colors.done : colors.ink;
      ctx.fillText(g.ch, x, cy + 1);
    }
    this.effects.draw(ctx, this.padding, top, lh, this.flow.font, flow);
    if (!this.loop && this.effects.active(now)) this.ensureLoop();
  }
}
