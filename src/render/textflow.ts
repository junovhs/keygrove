import { layoutNextLineRange, layoutWithLines, materializeLineRange, prepareWithSegments, type LayoutCursor, type PreparedTextWithSegments } from '@chenglou/pretext';

/** One character of the prompt with its position, in CSS px relative to the flow's top-left. */
export interface Glyph { ch: string; index: number; line: number; x: number; y: number; w: number }
export interface FlowLine { index: number; text: string; width: number; x: number; y: number; maxWidth: number }
export interface Flow { lines: FlowLine[]; glyphs: Glyph[]; height: number; width: number }
/** Width available to line `i` whose top edge is at `y`. Lets text flow around obstacles. */
export type WidthForLine = (i: number, y: number) => number;

/**
 * Pretext-backed prompt layout. Pretext breaks lines (reflow-free, any width per line);
 * glyph x positions are prefix sums of a per-font advance cache, so per-character effects
 * never touch the DOM. `letterSpacing` is applied identically to both.
 */
export class TextFlow {
  private prepared: PreparedTextWithSegments | null = null;
  private text = '';
  /** Text as laid out: each space widened to `spaceScale` spaces so it can carry a SPACE pill. */
  private display = '';
  private map: number[] = [];
  private advances = new Map<string, number>();
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private last: { key: string; flow: Flow } | null = null;

  constructor(public font: string, public lineHeight: number, public letterSpacing = 0, public align: 'left' | 'center' = 'center', public spaceScale = 1) {
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1).getContext('2d') : document.createElement('canvas').getContext('2d');
    if (!c) throw new Error('No 2D context for text measurement');
    this.ctx = c;
    this.ctx.font = font;
  }

  setFont(font: string, lineHeight: number, letterSpacing = this.letterSpacing): void {
    if (font === this.font && lineHeight === this.lineHeight && letterSpacing === this.letterSpacing) return;
    this.font = font; this.lineHeight = lineHeight; this.letterSpacing = letterSpacing;
    this.ctx.font = font; this.advances.clear(); this.prepared = null; this.last = null;
  }

  setText(text: string): void {
    if (text === this.text && this.prepared) return;
    this.text = text; this.prepared = null; this.last = null;
    this.display = ''; this.map = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]!;
      const n = ch === ' ' ? this.spaceScale : 1;
      for (let k = 0; k < n; k++) { this.display += ch; this.map.push(i); }
    }
  }

  advance(ch: string): number {
    let w = this.advances.get(ch);
    if (w === undefined) { w = this.ctx.measureText(ch).width; this.advances.set(ch, w); }
    return w;
  }

  /** Lay the current text out. Constant-width layouts are cached; callbacks re-run every call. */
  layout(width: number | WidthForLine, containerWidth = typeof width === 'number' ? width : 0): Flow {
    if (!this.prepared) this.prepared = prepareWithSegments(this.display, this.font, { letterSpacing: this.letterSpacing, whiteSpace: 'pre-wrap' });
    const constant = typeof width === 'number';
    const key = constant ? `${width}|${this.text}` : '';
    if (constant && this.last && this.last.key === key) return this.last.flow;

    const lines: FlowLine[] = [];
    const glyphs: Glyph[] = [];
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    let pos = 0; // index into this.display
    let li = 0;
    const box = containerWidth || (constant ? width : 0);
    const disp = this.display;
    const push = (ch: string, di: number, x: number, w: number) => {
      const index = this.map[di]!;
      const prev = glyphs.at(-1);
      if (prev && prev.index === index && prev.line === li) { prev.w = x + w - prev.x; return; }
      glyphs.push({ ch, index, line: li, x, y: li * this.lineHeight, w });
    };
    while (pos < disp.length) {
      const y = li * this.lineHeight;
      const maxWidth = Math.max(1, constant ? width : width(li, y));
      const range = layoutNextLineRange(this.prepared, cursor, maxWidth);
      if (!range) break;
      const lineText = materializeLineRange(this.prepared, range).text;
      const at = disp.indexOf(lineText, pos);
      const start = at >= 0 ? at : pos;
      const x0 = this.align === 'center' ? Math.max(0, (box - this.measure(lineText)) / 2) : 0;
      let x = x0;
      for (let i = 0; i < lineText.length; i++) {
        const ch = lineText[i]!; const w = this.advance(ch);
        push(ch, start + i, x, w); x += w + this.letterSpacing;
      }
      let end = start + lineText.length;
      // Whitespace consumed by the break still has to be typed: pin it to the end of this line.
      const nextStart = Math.max(end, this.cursorOffset(range.end));
      while (end < disp.length && end < nextStart && /\s/.test(disp[end]!)) {
        const ch = disp[end]!; const w = this.advance(ch);
        push(ch, end, x, w); x += w + this.letterSpacing; end++;
      }
      lines.push({ index: li, text: lineText, width: x - x0, x: x0, y, maxWidth });
      if (end === pos) break; // no progress: bail rather than spin
      cursor = range.end; pos = end; li++;
    }
    const flow: Flow = { lines, glyphs, height: lines.length * this.lineHeight, width: box };
    if (constant) this.last = { key, flow };
    return flow;
  }

  private cursorOffset(end: LayoutCursor): number {
    // Character offset of a Pretext cursor: sum of segment lengths before it plus the grapheme offset.
    const segs = this.prepared!.segments;
    let n = 0;
    for (let i = 0; i < end.segmentIndex && i < segs.length; i++) n += segs[i]!.length;
    const seg = segs[end.segmentIndex];
    if (seg) n += Math.min(seg.length, [...seg].slice(0, end.graphemeIndex).join('').length);
    return n;
  }

  measure(s: string): number {
    let w = 0;
    for (const ch of s) w += this.advance(ch) + this.letterSpacing;
    return Math.max(0, w - this.letterSpacing);
  }

  /** Reference line breaks straight from Pretext, for self-tests. */
  referenceLines(width: number): string[] {
    if (!this.prepared) this.prepared = prepareWithSegments(this.display, this.font, { letterSpacing: this.letterSpacing, whiteSpace: 'pre-wrap' });
    return layoutWithLines(this.prepared, width, this.lineHeight).lines.map((l) => l.text);
  }
}

/** Browser-only self-test (Pretext needs a canvas). Returns human-readable failures; empty = pass. */
export function selfTest(): string[] {
  const out: string[] = [];
  const font = '600 30px ui-monospace, Menlo, Consolas, monospace';
  const tf = new TextFlow(font, 40, 0, 'left');
  const text = 'take the long path home, and keep a gentle pace. small accurate steps turn into useful speed.';
  tf.setText(text);
  const ref = tf.referenceLines(420);
  const got = tf.layout(420).lines.map((l) => l.text);
  if (JSON.stringify(ref) !== JSON.stringify(got)) out.push(`constant width: expected ${JSON.stringify(ref)} got ${JSON.stringify(got)}`);
  const covered = tf.layout(420).glyphs.map((g) => g.index).sort((a, b) => a - b);
  if (covered.length !== text.length || covered.some((v, i) => v !== i)) out.push(`glyph coverage: ${covered.length}/${text.length}`);
  const wide3 = new TextFlow(font, 40, 8, 'center', 3);
  wide3.setText('fj jf ff jj');
  const g3 = wide3.layout(600).glyphs;
  if (g3.length !== 11) out.push(`spaceScale glyph count ${g3.length}`);
  const sp = g3.find((g) => g.ch === ' ');
  if (!sp || sp.w < tf.advance(' ') * 2.5) out.push(`space pill not widened: ${sp?.w}`);
  const narrow = tf.layout((i) => (i === 1 || i === 2 ? 200 : 420));
  const wide = tf.layout(420);
  for (const i of [1, 2]) {
    const n = narrow.lines[i], w = wide.lines[i];
    if (!n || !w) { out.push(`missing line ${i}`); continue; }
    if (!(n.width <= 200 + 1)) out.push(`line ${i} not narrowed: ${n.width}`);
    if (!(n.text.length < w.text.length)) out.push(`line ${i} narrow text not shorter: ${JSON.stringify(n.text)} vs ${JSON.stringify(w.text)}`);
  }
  if (narrow.lines.length <= wide.lines.length) out.push(`narrowing should add lines: ${narrow.lines.length} vs ${wide.lines.length}`);
  return out;
}
