import { CHARM_ART, flipRows, type CharmArt } from './charm-art';
import { keepsakeById, type CharmMotion, type Keepsake } from '../engine/keepsakes';
import { escapeHtml as esc } from './dom';

/**
 * Charms on screen (UI-16). Art is painted once per pattern into a canvas at its whole-pixel size (one bitmap, so no
 * seams between pixels), then moved by a pose function: every behaviour is `(t, stage) → where, how turned, which frame`.
 * The snake, the flock and the music box's notes are several actors driven by the same clock.
 */

// ---- Painting -----------------------------------------------------------------------------------------------------

function paint(art: CharmArt, pattern: string[], opts: { flip?: boolean; silhouette?: string } = {}): HTMLCanvasElement {
  const rows = opts.flip ? flipRows(pattern) : pattern;
  const c = document.createElement('canvas');
  c.width = rows[0]!.length * art.pixel; c.height = rows.length * art.pixel;
  const g = c.getContext('2d');
  if (!g) return c;
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const color = ch === '.' ? undefined : opts.silhouette ?? art.palette[ch];
    if (!color) return;
    g.fillStyle = color; g.fillRect(x * art.pixel, y * art.pixel, art.pixel, art.pixel);
  }));
  return c;
}
const urls = new Map<string, string>();
/** A data URL of a charm's first frame (cached), for static art in HTML: the collection, chapter tiles, the result card. */
export function charmUrl(id: string, silhouette = false): string {
  const key = id + (silhouette ? ':s' : '');
  let url = urls.get(key);
  if (!url) { const art = CHARM_ART[id]!; url = paint(art, art.pattern, silhouette ? { silhouette: '#d2cabd' } : {}).toDataURL(); urls.set(key, url); }
  return url;
}
export function charmImg(k: Keepsake, cls = '', locked = false): string {
  const art = CHARM_ART[k.id]!;
  return `<img class="charm-img ${cls}" src="${charmUrl(k.id, locked)}" width="${art.pattern[0]!.length * art.pixel}" height="${art.pattern.length * art.pixel}" alt="${esc(locked ? 'A charm still to find' : k.name)}" draggable="false">`;
}

// ---- The stage ------------------------------------------------------------------------------------------------------

interface Pose { x: number; y: number; rot?: number; sx?: number; sy?: number; op?: number; frame?: number }
interface Stage { W: number; H: number; w: number; h: number; dir: 1 | -1; seed: number }
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const fade = (t: number, a = 0.08, b = 0.88) => Math.min(clamp01(t / a), clamp01((1 - t) / (1 - b)));
const backOut = (t: number) => { const c = 1.7; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
/** Horizontal crossing in the travel direction, from just off one edge to just off the other. */
const across = (s: Stage, t: number) => s.dir > 0 ? -s.w / 2 + t * (s.W + s.w) : s.W + s.w / 2 - t * (s.W + s.w);

interface Behaviour { life: number; pose(t: number, s: Stage): Pose; frameMs?: number; turns?: boolean }
const BEHAVIOURS: Record<Exclude<CharmMotion, 'slither' | 'flock' | 'music' | 'streak' | 'shower'>, Behaviour> = {
  // Sprouts from the floor with a springy overshoot, sways, then settles away.
  grow: { life: 5200, pose: (t, s) => { const g = backOut(clamp01(t * 3.2)); const sy = Math.max(0.02, g); return { x: s.W * (0.2 + 0.6 * s.seed), y: s.H - 16 - s.h * sy / 2, sy, sx: 0.6 + 0.4 * g, rot: t > 0.3 ? Math.sin(t * 16) * 3 * (1 - t) : 0, op: fade(t, 0.02, 0.86) }; } },
  // Floats up from below with a lazy side-to-side drift.
  rise: { life: 9500, pose: (t, s) => ({ x: s.W * (0.25 + 0.5 * s.seed) + Math.sin(t * 6.5) * 34, y: s.H + s.h / 2 - t * (s.H * 0.8 + s.h), rot: Math.sin(t * 5) * 5, sx: 0.5 + 0.5 * clamp01(t * 6), sy: 0.5 + 0.5 * clamp01(t * 6), op: fade(t, 0.05, 0.8) }) },
  // Rides the wind across the upper sky, dipping and tilting.
  kite: { life: 9000, pose: (t, s) => ({ x: across(s, t), y: s.H * 0.28 + Math.sin(t * 9) * s.H * 0.08, rot: Math.sin(t * 9 + 1) * 14 * s.dir, op: fade(t, 0.03, 0.95) }) },
  // Along the floor, in little bursts; top-down art is turned to face the way it goes.
  crawl: { life: 11000, frameMs: 170, pose: (t, s) => ({ x: across(s, t + Math.sin(t * 40) / 90), y: s.H - s.h / 2 - 10, op: fade(t, 0.02, 0.97) }) },
  run: { life: 4600, frameMs: 110, pose: (t, s) => ({ x: across(s, t), y: s.H - s.h / 2 - 10 - Math.abs(Math.sin(t * 44)) * 8, op: fade(t, 0.02, 0.97) }) },
  // Six hops across the floor: crouched on landing, stretched in the air.
  hop: { life: 7000, pose: (t, s) => { const n = 6, ph = (t * n) % 1, air = ph > 0.12 && ph < 0.9; return { x: across(s, t), y: s.H - s.h / 2 - 10 - Math.sin(clamp01((ph - 0.12) / 0.78) * Math.PI) * s.H * 0.13, frame: air ? 1 : 0, sy: air ? 1.05 : 0.9, op: fade(t, 0.02, 0.97) }; } },
  // Falls like paper: swinging side to side and tipping with each swing.
  flutter: { life: 9000, pose: (t, s) => ({ x: s.W * (0.2 + 0.6 * s.seed) + Math.sin(t * 8) * 90, y: -s.h / 2 + t * (s.H + s.h), rot: Math.sin(t * 8) * 26, sy: 0.75 + 0.25 * Math.cos(t * 16), op: fade(t, 0.02, 0.95) }) },
  // Hangs on its chain from the top edge and swings, slowly settling.
  swing: { life: 8000, pose: (t, s) => { const L = s.H * 0.34 * backOut(clamp01(t * 5)), a = Math.sin(t * Math.PI * 7) * 0.5 * (1 - t * 0.7); return { x: s.W * (0.3 + 0.4 * s.seed) + Math.sin(a) * L, y: Math.cos(a) * L - s.h / 2 + 10, rot: -a * 57.3, op: fade(t, 0.02, 0.9) }; } },
  fly: { life: 7500, frameMs: 120, pose: (t, s) => ({ x: across(s, t), y: s.H * (0.22 + 0.2 * s.seed) + Math.sin(t * 9) * 46 - Math.sin(t * 2.3) * 40, rot: Math.cos(t * 9) * 8 * s.dir, op: fade(t, 0.02, 0.97) }) },
  // A loop-the-loop in the middle of the crossing; the nose follows the path.
  loop: { life: 7500, turns: true, pose: (t, s) => { const R = Math.min(90, s.H * 0.14); const a = clamp01((t - 0.38) / 0.3) * Math.PI * 2; return { x: across(s, t) + Math.sin(a) * R * s.dir, y: s.H * 0.4 - (1 - Math.cos(a)) * R + Math.sin(t * 5) * 18, op: fade(t, 0.02, 0.97) }; } },
  // Swims an S-curve through the lower half; the tail flicks.
  swim: { life: 9500, frameMs: 220, turns: true, pose: (t, s) => ({ x: across(s, t), y: s.H * 0.64 + Math.sin(t * 7) * 60, op: fade(t, 0.05, 0.92) }) },
  // Rises to the middle and turns on its axis, catching the light.
  spin: { life: 6500, pose: (t, s) => ({ x: s.W * (0.3 + 0.4 * s.seed), y: s.H * 0.75 - clamp01(t * 2.4) * s.H * 0.35 + Math.sin(t * 7) * 10, sx: Math.cos(t * Math.PI * 9) * (0.8 + 0.4 * clamp01(t * 3)), sy: 0.8 + 0.4 * clamp01(t * 3), op: fade(t, 0.05, 0.85) }) },
};

let sky: HTMLElement | null = null;
const layer = () => sky ??= Object.assign(document.body.appendChild(document.createElement('div')), { className: 'charm-sky', ariaHidden: 'true' });
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** One sprite on the stage: its frames, an optional holographic overlay, and a transform per tick. */
class Actor {
  el = document.createElement('div');
  frames: HTMLCanvasElement[];
  w: number; h: number;
  constructor(art: CharmArt, patterns: string[][], flip: boolean, holo: boolean, extra = '') {
    this.el.className = 'charm-actor' + (holo ? ' holo' : '') + (extra ? ' ' + extra : '');
    this.frames = patterns.map((p, i) => { const c = paint(art, p, { flip }); c.hidden = i > 0; this.el.appendChild(c); return c; });
    this.w = this.frames[0]!.width; this.h = this.frames[0]!.height;
    this.el.style.width = `${this.w}px`; this.el.style.height = `${this.h}px`;
    if (holo) {
      // A rainbow sheen cut to the sprite's own shape, sliding across it.
      const sheen = document.createElement('i'); sheen.className = 'charm-holo';
      const mask = `url(${this.frames[0]!.toDataURL()})`;
      sheen.style.maskImage = mask; sheen.style.setProperty('-webkit-mask-image', mask);
      this.el.appendChild(sheen);
    }
    layer().appendChild(this.el);
  }
  set(p: Pose, frame: number): void {
    this.frames.forEach((f, i) => { f.hidden = i !== frame % this.frames.length; });
    this.el.style.transform = `translate(${Math.round(p.x - this.w / 2)}px, ${Math.round(p.y - this.h / 2)}px) rotate(${(p.rot ?? 0).toFixed(1)}deg) scale(${(p.sx ?? 1).toFixed(3)}, ${(p.sy ?? 1).toFixed(3)})`;
    this.el.style.opacity = String(p.op ?? 1);
  }
}

/** A burst of square sparks where a charm arrives. */
function sparks(x: number, y: number, colors: string[], n = 14): void {
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'); p.className = 'charm-spark';
    p.style.left = `${Math.round(x)}px`; p.style.top = `${Math.round(y)}px`; p.style.background = colors[i % colors.length]!;
    const a = (i / n) * Math.PI * 2, d = 40 + (i % 3) * 22;
    p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.round(Math.cos(a) * d)}px, ${Math.round(Math.sin(a) * d)}px) scale(.4)`, opacity: 0 }], { duration: 700 + (i % 4) * 90, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    layer().appendChild(p); setTimeout(() => p.remove(), 1200);
  }
}
/** Tick an animation until `life` ms, then clean up. */
function run(life: number, tick: (t: number, ms: number) => void, done: () => void): void {
  const t0 = performance.now();
  const step = (now: number) => { const ms = now - t0, t = Math.min(1, ms / life); tick(t, ms); if (t < 1) requestAnimationFrame(step); else done(); };
  requestAnimationFrame(step);
}

/**
 * Summon a charm onto the screen. Each one moves its own way; reduced motion shows it still, briefly, in the corner.
 * Several can be on screen at once.
 */
export function spawnCharm(id: string): void {
  const k = keepsakeById(id), art = CHARM_ART[id];
  if (!k || !art) return;
  const W = innerWidth, H = innerHeight, seed = Math.random(), dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  const colors = [...new Set(Object.values(art.palette))].slice(0, 6);
  const frames = art.frames ?? [art.pattern];
  if (reduced()) {
    const a = new Actor(art, [art.pattern], false, false, 'still');
    a.set({ x: W - a.w / 2 - 24, y: H - a.h / 2 - 24 }, 0);
    a.el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 2600, fill: 'forwards' });
    setTimeout(() => a.el.remove(), 2700); return;
  }
  if (k.motion === 'slither') return slither(art, W, H, dir);
  if (k.motion === 'flock') { for (let i = 0; i < 3; i++) setTimeout(() => flyOne(art, frames, W, H, dir, i), i * 380); return; }
  if (k.motion === 'streak') return streak(art, W, H, dir);
  if (k.motion === 'shower') { for (let i = 0; i < 18; i++) setTimeout(() => fallingStar(art, frames, W, H, colors), i * 130 + Math.random() * 160); return; }
  const b = k.motion === 'music' ? BEHAVIOURS.rise : BEHAVIOURS[k.motion];
  // Art faces right; anything that travels left is mirrored so it never goes backwards. Top-down crawlers turn instead.
  const topDown = id === 'beetle';
  const a = new Actor(art, frames, !topDown && dir < 0 && k.motion !== 'rise' && k.motion !== 'grow' && k.motion !== 'spin' && k.motion !== 'swing' && k.motion !== 'flutter', !!k.holo);
  const stage: Stage = { W, H, w: a.w, h: a.h, dir, seed };
  if (k.motion === 'grow') a.el.style.transformOrigin = '50% 100%';
  let last = { x: 0, y: 0 }, noteAt = 0;
  // The snail takes its time.
  run(id === 'snail' ? 17000 : b.life, (t, ms) => {
    const p = b.pose(t, stage);
    if (topDown) p.rot = (p.rot ?? 0) + 90 * dir;
    if (b.turns) { const ang = Math.atan2(p.y - last.y, p.x - last.x) * 57.3; if (ms > 30) p.rot = (p.rot ?? 0) + (dir > 0 ? ang : ang - 180); }
    last = { x: p.x, y: p.y };
    const frame = p.frame ?? (b.frameMs || frames.length > 1 ? Math.floor(ms / (b.frameMs ?? 420)) : 0);
    a.set(p, frame);
    if (k.motion === 'music' && ms > noteAt && t < 0.8) { noteAt = ms + 360; note(art, p.x + (Math.random() - 0.5) * a.w * 0.6, p.y - a.h / 2); }
    if (k.holo && Math.random() < 0.12) glint(p.x + (Math.random() - 0.5) * a.w, p.y + (Math.random() - 0.5) * a.h);
  }, () => a.el.remove());
  const first = b.pose(0.06, stage); sparks(first.x, first.y, colors, 10);
}

function flyOne(art: CharmArt, frames: string[][], W: number, H: number, dir: 1 | -1, i: number): void {
  const a = new Actor(art, frames, false, false, 'small');
  const lane = 0.2 + i * 0.16, wob = 1 + i * 0.35;
  run(9500 - i * 700, (t, ms) => a.set({
    x: dir > 0 ? -a.w + t * (W + 2 * a.w) : W + a.w - t * (W + 2 * a.w),
    y: H * lane + Math.sin(t * 13 * wob + i) * 34 + Math.sin(t * 31 + i * 2) * 10,
    rot: Math.sin(t * 20 + i) * 12, sx: 0.8, sy: 0.8, op: fade(t, 0.02, 0.96),
  }, Math.floor(ms / (130 + i * 20))), () => a.el.remove());
}

/** One star of the shower: drops from the top edge, spinning and twinkling, lands with a bounce and a burst, and fades. */
function fallingStar(art: CharmArt, frames: string[][], W: number, H: number, colors: string[]): void {
  const a = new Actor(art, frames, false, false, 'small');
  const size = 0.55 + Math.random() * 0.9, x0 = a.w + Math.random() * (W - 2 * a.w), drift = (Math.random() - 0.5) * 180;
  const spin = (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 340), floor = H - (a.h * size) / 2 - 6;
  const twinkle = 110 + Math.random() * 90;
  let landed = false, trail = 0;
  run(2300 + Math.random() * 1500, (t, ms) => {
    const fall = 0.72;
    if (t < fall) {
      const u = t / fall, x = x0 + drift * u, y = -a.h + u * u * (floor + a.h);
      a.set({ x, y, rot: spin * u, sx: size, sy: size }, Math.floor(ms / twinkle));
      if (ms > trail) { trail = ms + 70; glint(x - drift * 0.02, y - a.h * size * 0.4); }
      return;
    }
    const v = (t - fall) / (1 - fall), x = x0 + drift;
    if (!landed) { landed = true; sparks(x, floor, colors, 7); }
    a.set({ x, y: floor - Math.sin(Math.min(1, v * 1.6) * Math.PI) * 26 * size, rot: spin, sx: size, sy: size, op: 1 - clamp01((v - 0.55) / 0.45) }, Math.floor(ms / twinkle));
  }, () => a.el.remove());
}

/** The comet cuts diagonally across the sky, shedding a trail of glints. */
function streak(art: CharmArt, W: number, H: number, dir: 1 | -1): void {
  const a = new Actor(art, [art.pattern], dir < 0, true);
  const from = { x: dir > 0 ? -a.w : W + a.w, y: H * 0.12 }, to = { x: dir > 0 ? W + a.w : -a.w, y: H * 0.55 };
  const ang = Math.atan2(to.y - from.y, to.x - from.x) * 57.3 + (dir < 0 ? 180 : 0);
  let trail = 0;
  run(2800, (t, ms) => {
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const x = from.x + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e;
    a.set({ x, y, rot: ang }, 0);
    if (ms > trail) { trail = ms + 28; glint(x - Math.cos(ang / 57.3) * a.w * 0.3 * dir, y - Math.sin(ang / 57.3) * a.w * 0.3 * dir, true); }
  }, () => a.el.remove());
}

/** The snake: a head and a chain of body segments following one smooth path through the bottom-right corner. */
function slither(art: CharmArt, W: number, H: number, dir: 1 | -1): void {
  const parts = art.parts!, n = 12;
  const tail = new Actor(art, [parts.tail!], false, false, 'seg');
  const body = Array.from({ length: n }, () => new Actor(art, [parts.body!], false, false, 'seg'));
  const head = new Actor(art, [art.pattern], false, false, 'seg');
  const R = Math.min(W, H) * 0.3, cx = dir > 0 ? W : 0;
  // An arc round the corner from below the floor to beyond the side edge, with a travelling wiggle across it.
  const at = (u: number, ms: number) => {
    const phi = -0.35 + u * (Math.PI / 2 + 0.7);
    const bx = cx - dir * R * Math.cos(phi), by = H - R * Math.sin(phi);
    const nx = -dir * Math.cos(phi), ny = -Math.sin(phi);
    const wig = Math.sin(u * 26 - ms / 140) * 11;
    return { x: bx + nx * wig, y: by + ny * wig };
  };
  const gap = 0.022;
  run(10000, (t, ms) => {
    const u = -0.05 + t * (1.1 + (n + 1) * gap);
    const hp = at(u, ms), ahead = at(u + 0.004, ms);
    const ang = Math.atan2(ahead.y - hp.y, ahead.x - hp.x) * 57.3;
    head.set({ ...hp, rot: ang }, 0);
    body.forEach((b, i) => b.set({ ...at(u - (i + 1) * gap, ms), sx: 1 - i * 0.025, sy: 1 - i * 0.025 }, 0));
    tail.set(at(u - (n + 1) * gap, ms), 0);
  }, () => [head, tail, ...body].forEach(a => a.el.remove()));
}

function note(art: CharmArt, x: number, y: number): void {
  const a = new Actor(art, [art.parts!.note!], false, false, 'small');
  const drift = (Math.random() - 0.5) * 80;
  run(2200, t => a.set({ x: x + drift * t + Math.sin(t * 9) * 8, y: y - t * 140, rot: Math.sin(t * 7) * 15, op: fade(t, 0.1, 0.6) }, 0), () => a.el.remove());
}
function glint(x: number, y: number, trail = false): void {
  const p = document.createElement('i'); p.className = 'charm-glint' + (trail ? ' trail' : '');
  p.style.left = `${Math.round(x)}px`; p.style.top = `${Math.round(y)}px`;
  layer().appendChild(p); setTimeout(() => p.remove(), 900);
}
