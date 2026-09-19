import { $, maybe } from './dom';

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
}
const handRefs: Record<Side, HandRef | null> = { left: null, right: null };

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
  const mount = $(side + 'HandMount'); mount.innerHTML = ''; mount.appendChild(svg);
  handRefs[side] = { svg, gradient, stops, nails };
  paintHand(side, null);
}

function activeKind(side: Side, fingerId: string | null): Kind | null {
  if (fingerId === 'thumb') return 'thumb';
  if (!fingerId) return null;
  const map: Record<string, Kind> = side === 'left'
    ? { lp: 'pinky', lr: 'ring', lm: 'middle', li: 'index' }
    : { rp: 'pinky', rr: 'ring', rm: 'middle', ri: 'index' };
  return map[fingerId] ?? null;
}

export function paintHand(side: Side, fingerId: string | null): void {
  const ref = handRefs[side]; if (!ref) return;
  const kind = activeKind(side, fingerId), active = !!kind;
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
