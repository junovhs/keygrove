import { $, maybe } from './dom';
import { fingerPlace } from './finger-map';

const HAND_SRC = 'assets/hand.svg';
type Kind = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
const HAND_POINTS: Record<Kind, { x: number; y: number; r: number }> = {
  pinky: { x: 242, y: 320, r: 360 },
  ring: { x: 493, y: 170, r: 390 },
  middle: { x: 780, y: 92, r: 410 },
  index: { x: 1060, y: 205, r: 390 },
  thumb: { x: 1260, y: 655, r: 360 },
};
type Side = 'left' | 'right';
interface HandRef {
  svg: SVGSVGElement;
  gradient: SVGElement;
  stops: SVGElement[];
  nails: Partial<Record<Kind, HTMLElement | SVGElement>>;
  /** The finger last painted (null = none); undefined until the first paint. */
  painted?: Kind | null;
}
const handRefs: Record<Side, HandRef | null> = { left: null, right: null };
/** Finger id (lp…rp / thumb) → hover callback, wired by the app. null = pointer left. */
let hoverCb: ((fingerId: string | null) => void) | null = null;
export function onFingerHover(cb: (fingerId: string | null) => void): void { hoverCb = cb; }
const FINGER_ID: Record<Side, Record<Kind, string>> = {
  left: { pinky: 'lp', ring: 'lr', middle: 'lm', index: 'li', thumb: 'thumb' },
  right: { pinky: 'rp', ring: 'rr', middle: 'rm', index: 'ri', thumb: 'thumb' },
};

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgNode(name: string, attrs?: Record<string, string>): SVGElement {
  const n = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const k of Object.keys(attrs ?? {})) n.setAttribute(k, attrs![k]!);
  return n;
}

function installHand(side: Side, svgText: string): void {
  const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (parsed.querySelector('parsererror')) throw new Error('Invalid hand SVG');
  const svg = document.importNode(parsed.documentElement, true) as unknown as SVGSVGElement;
  svg.removeAttribute('width'); svg.removeAttribute('height');
  svg.classList.add('vector-hand'); svg.setAttribute('focusable', 'false'); svg.setAttribute('aria-hidden', 'true');
  const byOriginal: Record<string, Element> = {};
  svg.querySelectorAll('[id]').forEach((el) => { const original = el.id; byOriginal[original] = el; el.id = original + '-' + side; });
  let defs = svg.querySelector('defs');
  if (!defs) { defs = svgNode('defs') as SVGDefsElement; svg.insertBefore(defs, svg.firstChild); }
  const gradient = svgNode('radialGradient', { id: 'kg-hand-gradient-' + side, gradientUnits: 'userSpaceOnUse', cx: '724', cy: '543', r: '560' });
  const stopData: [string, string][] = [['0%', '#efebe7'], ['34%', '#ece8e3'], ['68%', '#e9e5df'], ['100%', '#e7e6e7']];
  const stops = stopData.map(([offset, color]) => { const s = svgNode('stop', { offset, 'stop-color': color }); gradient.appendChild(s); return s; });
  defs.appendChild(gradient);
  const fill = byOriginal['fill'] as SVGElement | undefined, outline = byOriginal['base-outline'] as SVGElement | undefined;
  if (fill) { fill.style.fill = 'url(#kg-hand-gradient-' + side + ')'; fill.style.fillOpacity = '1'; }
  if (outline) { outline.style.fill = '#817e78'; outline.style.fillOpacity = '.32'; }
  const nails: HandRef['nails'] = {
    pinky: byOriginal['pinky-nail'] as SVGElement | undefined,
    ring: byOriginal['ring-nail'] as SVGElement | undefined,
    middle: byOriginal['middle-nail'] as SVGElement | undefined,
    index: byOriginal['index-nail'] as SVGElement | undefined,
    thumb: byOriginal['thumbnail'] as SVGElement | undefined,
  };
  Object.values(nails).forEach((n) => { if (n) { n.style.fill = '#fbf8f3'; n.style.fillOpacity = '1'; n.style.stroke = '#d7d2ca'; n.style.strokeWidth = '2'; } });
  // Transparent hit-areas over each fingertip so hovering a finger can light its keys.
  (Object.keys(HAND_POINTS) as Kind[]).forEach((kind) => {
    const pt = HAND_POINTS[kind];
    const hit = svgNode('circle', { cx: String(pt.x), cy: String(pt.y), r: String(Math.round(pt.r * 0.42)), fill: 'transparent', 'pointer-events': 'all' });
    (hit as SVGElement).style.cursor = 'default';
    hit.addEventListener('pointerenter', () => hoverCb?.(FINGER_ID[side][kind]));
    hit.addEventListener('pointerleave', () => hoverCb?.(null));
    svg.appendChild(hit);
  });
  const mount = $(side + 'HandMount'); mount.innerHTML = ''; mount.appendChild(svg);
  handRefs[side] = { svg, gradient, stops, nails };
  paintHand(side, null);
}

function activeKind(side: Side, fingerId: string | null): Kind | null {
  const place = fingerId ? fingerPlace(fingerId) : null;
  return place && place.sides.includes(side) ? place.kind : null;
}
/**
 * Pulse one finger's nail on its hand (UI-14: a finger named in copy is hovered or focused); null stops any pulse.
 * An animation on an element inside an SVG runs on the main thread and re-lays out the SVG every frame, so the pulse
 * plays on a copy instead (PERF-05): an overlay drawn over the hand with the same viewBox, holding only that nail at
 * its place, whose HTML wrapper scales and fades on the compositor. The real nail hides until the pulse ends.
 */
const pulses: Record<Side, { nail: SVGElement | HTMLElement; copy: Element; overlay: HTMLElement } | null> = { left: null, right: null };
export function pulseFinger(fingerId: string | null): void {
  const place = fingerId ? fingerPlace(fingerId) : null;
  (['left', 'right'] as Side[]).forEach((side) => {
    const ref = handRefs[side]; if (!ref) return;
    const nail = place && place.sides.includes(side) ? ref.nails[place.kind] ?? null : null;
    const current = pulses[side];
    if (current && current.nail === nail) return;
    if (current) { current.overlay.remove(); current.nail.classList.remove('nail-hidden'); pulses[side] = null; }
    if (!nail) return;
    const overlay = document.createElement('div'); overlay.className = 'nail-overlay'; overlay.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'vector-hand');
    for (const a of ['viewBox', 'preserveAspectRatio']) { const v = ref.svg.getAttribute(a); if (v !== null) svg.setAttribute(a, v); }
    // The nail's own place in the drawing: its transform to the hand's user space, then the nail itself.
    const g = document.createElementNS(SVG_NS, 'g');
    // (getCTM would already include the viewBox scaling; going through screen space and back leaves only the nail's own.)
    const nailToScreen = (nail as SVGGraphicsElement).getScreenCTM?.(), rootToScreen = ref.svg.getScreenCTM();
    if (nailToScreen && rootToScreen) {
      const m = rootToScreen.inverse().multiply(nailToScreen);
      g.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
    }
    const copy = nail.cloneNode(true) as Element; copy.removeAttribute('id');
    g.appendChild(copy); svg.appendChild(g); overlay.appendChild(svg);
    ref.svg.after(overlay);
    // Scale about the nail's centre, as the old fill-box pulse did.
    const box = nail.getBoundingClientRect(), at = overlay.getBoundingClientRect();
    overlay.style.transformOrigin = `${box.left + box.width / 2 - at.left}px ${box.top + box.height / 2 - at.top}px`;
    nail.classList.add('nail-hidden');
    pulses[side] = { nail, copy, overlay };
  });
}

export function paintHand(side: Side, fingerId: string | null): void {
  const ref = handRefs[side]; if (!ref) return;
  const kind = activeKind(side, fingerId), active = !!kind;
  // Most keystrokes keep the same finger: repainting the gradient and nails would re-raster the filtered SVG for nothing.
  if (ref.painted === kind) return;
  ref.painted = kind;
  const point = kind ? HAND_POINTS[kind] : { x: 724, y: 543, r: 560 };
  ref.gradient.setAttribute('cx', String(point.x)); ref.gradient.setAttribute('cy', String(point.y)); ref.gradient.setAttribute('r', String(point.r));
  const colors = active ? ['#ff5418', '#ff8a61', '#f1d2c5', '#e7e6e7'] : ['#efebe7', '#ece8e3', '#e9e5df', '#e7e6e7'];
  ref.stops.forEach((s, i) => s.setAttribute('stop-color', colors[i]!));
  (Object.keys(ref.nails) as Kind[]).forEach((name) => {
    const n = ref.nails[name]; if (!n) return;
    const hot = active && name === kind;
    n.style.fill = hot ? '#ff5418' : '#fbf8f3';
    n.style.stroke = hot ? '#ff5418' : '#d7d2ca';
    n.style.strokeWidth = hot ? '3' : '2';
  });
  const wrap = maybe(side + 'HandWrap'); if (wrap) wrap.classList.toggle('is-hot', active);
  const pulse = pulses[side];
  if (pulse) { const style = pulse.nail.getAttribute('style'); if (style !== null) pulse.copy.setAttribute('style', style); }
}

export async function loadHands(onReady: () => void): Promise<void> {
  try {
    const response = await fetch(HAND_SRC, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Could not load hand SVG');
    const text = await response.text();
    installHand('left', text); installHand('right', text); onReady();
  } catch {
    (['left', 'right'] as Side[]).forEach((side) => { const m = maybe(side + 'HandMount'); if (m) m.innerHTML = '<span style="font:10px var(--mono);color:var(--muted)">HAND SVG</span>'; });
  }
}
