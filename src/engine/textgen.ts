import { allowedChars, cumulativeKeys, type StageName, type Trail } from '../curriculum';
import WORDS from '../data/words.json';
import TOP from '../data/top200.json';
import SENTENCES from '../data/sentences.json';
import QUOTES from '../data/quotes.json';
import CODE from '../data/code.json';
import { rng, pickOne, shuffle, type Rng } from './rng';
import { homeOf, mirrorOf } from '../curriculum/method';

/** Per-key heat (0..1+). Hotter keys pull their words in more often. */
export type Heat = Readonly<Record<string, number>>;
/** `pairHeat`: per-bigram heat ('th') from the transition model; `weakPairs`: the player's weakest real transitions for the Bigrams trail. */
export interface GenOptions { heat?: Heat; pairHeat?: Heat; weakPairs?: string[]; seed?: number }

const anchorOf = (k: string) => homeOf(k);
const BIGRAMS = 'th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng se ha as ou io le ve co me de hi ri ro ic ne ea ra ce li ch ll be ma si om ur'.split(' ');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

const bankCache = new Map<string, string[]>();
const coldSamplers = new Map<string, Map<number, (r: Rng) => string>>();
/** Words from the bank that use only this trail's unlocked (lowercase) keys, in frequency order. */
export function wordBank(trail: Trail): string[] {
  let b = bankCache.get(trail.id);
  if (!b) {
    const set = cumulativeKeys(trail).keys;
    b = WORDS.filter((w) => [...w].every((c) => set.has(c)));
    bankCache.set(trail.id, b);
  }
  return b;
}

const fits = (s: string, allowed: Set<string>) => [...s].every((c) => allowed.has(c));

/** Heat-weighted sampler over a fixed word list; weights are computed once. */
function sampler(words: readonly string[], heat: Heat, pairHeat: Heat = {}): (r: Rng) => string {
  if (!words.length) return () => '';
  const cum = new Float64Array(words.length);
  let total = 0;
  const pairs = Object.keys(pairHeat).length > 0;
  words.forEach((x, i) => {
    let w = 1 + [...x].reduce((s, c) => s + (heat[c] ?? 0), 0);
    if (pairs) for (let j = 1; j < x.length; j++) w += pairHeat[x.slice(j - 1, j + 1)] ?? 0;
    total += w; cum[i] = total;
  });
  return (r) => {
    const t = r() * total;
    let lo = 0, hi = words.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid]! < t) lo = mid + 1; else hi = mid; }
    return words[lo]!;
  };
}

/** Join pieces until the text reaches `len` characters (never cuts a piece). */
function fill(len: number, next: () => string): string {
  let s = '';
  let guard = 0;
  while (s.length < len && guard++ < 400) { const p = next(); if (!p) break; s += (s ? ' ' : '') + p; }
  return s;
}

function rhythmPatterns(keys: string): string[] {
  const ks = [...keys].filter((k) => k !== ' ');
  const pats: string[] = [];
  for (const k of ks) {
    const a = anchorOf(k);
    const p = a === k ? mirrorOf(k) : a;
    pats.push(k + k, p + k + p, k + p + k, k + k + p, p + k + k);
  }
  if (ks.length > 1) { const [x, y] = ks as [string, string]; pats.push(x + y, y + x, x + y + x, y + x + y, x + x + y + y, x + y + y + x); }
  return pats;
}

/** Coach drills: alternate a confused pair, rebuild one reach, or review rusty keys through real words. */
function generateDrillRaw(kind: 'confusion' | 'reach' | 'review' | 'transition', keys: string[], trail: Trail, opts: GenOptions = {}): string {
  const r = rng(opts.seed);
  const allowed = allowedChars(trail);
  const ks = keys.filter((k) => allowed.has(k) && k !== ' ');
  if (kind === 'confusion' && ks.length >= 2) {
    const [a, b] = ks as [string, string];
    const pats = [a + b, b + a, a + a + b, b + b + a, a + b + a, b + a + b, a + b + b + a, b + a + a + b];
    return fill(34, () => pickOne(pats, r));
  }
  if (kind === 'reach' && ks.length) {
    const k = ks[0]!; const a = anchorOf(k); const p = a === k ? mirrorOf(k) : a;
    const pats = [p + k + p, k + p + k, k + k + p, p + k + k, k + p + p + k];
    return fill(30, () => pickOne(pats, r));
  }
  if (kind === 'transition' && ks.length >= 2) {
    // Words rich in the pair, in the pair's order (R→F: refer fret free); patterns when the bank is thin.
    const [a, b] = ks as [string, string]; const pair = a + b;
    const bank = [...new Set([...wordBank(trail), ...TOP.filter((w) => fits(w, allowed))])].filter((w) => w.includes(pair));
    if (bank.length >= 4) return fill(Math.min(60, trail.length), () => pickOne(bank, r));
    const pats = [pair, pair + a, b + pair, pair + pair, a + pair + b];
    return fill(30, () => pickOne(pats, r));
  }
  // Review is short, even if the current trail is the long final assessment.
  const heat: Record<string, number> = {}; for (const k of ks) heat[k] = 4;
  const bank = wordBank(trail).filter((w) => w.length >= 3 && [...w].some((c) => ks.includes(c)));
  if (bank.length >= 6) { const pick = sampler(bank, heat); return fill(Math.min(60, trail.length), () => pick(r)); }
  const pats = rhythmPatterns(ks.join(''));
  return pats.length ? fill(30, () => pickOne(pats, r)) : generate(trail, 'mix', opts);
}

/** Every selected review key must actually occur; sampling alone can omit rare letters. */
export function generateDrill(kind: 'confusion' | 'reach' | 'review' | 'transition', keys: string[], trail: Trail, opts: GenOptions = {}): string {
  let text = generateDrillRaw(kind, keys, trail, opts);
  const allowed = allowedChars(trail);
  const bank = wordBank(trail);
  for (const k of new Set(keys.filter(k => k !== ' ' && allowed.has(k)))) {
    const count = [...text.toLowerCase()].filter(c => c === k.toLowerCase()).length;
    if (count >= 2) continue;
    const word = bank.find(w => w.includes(k) && w.length <= 5) ?? k;
    text += ' ' + Array.from({ length: 2 - count }, () => word).join(' ');
  }
  return text;
}

/** A coherent transfer assessment, with a varied opening and every taught character in context. */
function finalPassage(r: Rng): string {
  const opening = pickOne([
    'The last bend in the path leads to a small workshop. A blue cup stands beside an open notebook. Someone has left a drawing of a quick fox jumping over a lazy dog. You sit by the window and begin a letter. There is no need to hurry; the words will wait for you.',
    'Rain has left bright beads on the garden gate. Inside, a quiet jazz record plays while a fox explores the empty yard. You put the kettle on, move a vase of flowers and open your notebook. A few separate movements have become something you can use.',
    'At the end of the grove, you find a wooden desk with a view of the hills. A tiny bronze fox guards a jar of pencils. The room is quiet except for a bird outside the window. You pull up a chair and write a few lines about the journey.'
  ], r);
  return opening + ` The note begins: "Meet at 10:30 on 26/09/2026 by gate 7." Bring $8.50 for tea & cake (table 4). Don't forget page 3! Is everyone coming? Send a reply to hello@grove.dev and mark #home on your map. A pencilled puzzle reads: blue_fox = 2 * 4 + 1. Keep 95% of the seeds in the red-green box. When you are ready, close the notebook; the page will wait. The next thing you type can be your own.`;
}

/** Generate the text for a trail stage. Output only ever contains allowedChars(trail). */
function generateRaw(trail: Trail, stage: StageName, opts: GenOptions = {}): string {
  const r = rng(opts.seed === undefined ? undefined : opts.seed + ['drill', 'mix', 'words'].indexOf(stage) * 1000003);
  const heat = opts.heat ?? {};
  const allowed = allowedChars(trail);
  const bank = wordBank(trail);
  const pats = rhythmPatterns(trail.newKeys);
  const pat = () => pickOne(pats, r);
  const cold = Object.keys(heat).length === 0 && !opts.pairHeat;
  const samplers = cold ? (coldSamplers.get(trail.id) ?? coldSamplers.set(trail.id, new Map()).get(trail.id)!) : new Map<number, (r: Rng) => string>();
  const word = (min = 2) => {
    let s = samplers.get(min);
    if (!s) { const b = bank.filter((w) => w.length >= min); s = sampler(b.length ? b : bank, heat, opts.pairHeat); samplers.set(min, s); }
    return s(r) || (pats.length ? pat() : '');
  };
  const topWord = sampler(TOP, heat, opts.pairHeat);
  const len = trail.length;
  const short = Math.round(len * 0.8);
  const patternsOr = (fallback: () => string) => (pats.length ? pat : fallback);

  switch (trail.kind) {
    case 'rhythm': {
      if (stage === 'drill') return fill(short, pat);
      if (stage === 'mix') return bank.length >= 4 ? fill(short, () => (r() < 0.6 ? pat() : word())) : fill(short, pat);
      return bank.length >= 8 ? fill(len, () => word()) : fill(len, () => (r() < 0.5 ? pat() : word()));
    }
    case 'words': {
      if (stage === 'drill') return fill(short, patternsOr(() => word(3)));
      if (stage === 'mix') return fill(short, pats.length ? () => (r() < 0.5 ? pat() : word()) : () => word(3));
      return fill(len, () => word(3));
    }
    case 'lower-sentences': {
      const ok = SENTENCES.filter((s) => s === s.toLowerCase() && fits(s, allowed));
      if (stage === 'drill') return fill(short, () => word(4));
      return fill(stage === 'mix' ? short : len, () => pickOne(ok, r));
    }
    case 'caps': {
      const cap = (w: string) => w[0]!.toUpperCase() + w.slice(1);
      if (stage === 'drill') return fill(short, () => { const k = pickOne([...LETTERS], r); const a = anchorOf(k); const p = a === k ? mirrorOf(k) : a; return k.toUpperCase() + p + ' ' + p.toUpperCase() + k; });
      if (stage === 'mix') return fill(short, () => cap(word(3)));
      return fill(len, () => (r() < 0.5 ? cap(word(3)) : word(3)));
    }
    case 'sentences': {
      const ok = SENTENCES.filter((s) => fits(s, allowed));
      const fresh = trail.newKeys ? ok.filter((s) => [...trail.newKeys].some((k) => s.includes(k))) : ok.filter((s) => /[A-Z]/.test(s));
      const pool = fresh.length ? fresh : ok;
      if (stage === 'drill') return trail.newKeys ? fill(short, () => { const k = pickOne([...trail.newKeys], r); return word(3) + k; }) : pickOne(pool, r);
      return fill(stage === 'mix' ? short : len, () => pickOne(shuffle(pool, r), r));
    }
    case 'numbers': {
      const digits = [...allowed].filter((c) => /[0-9]/.test(c));
      const d = () => pickOne(digits, r);
      const nn = (n: number) => Array.from({ length: n }, d).join('');
      if (stage === 'drill') return fill(short, () => { const k = d(); const a = anchorOf(k); return a + k + a + ' ' + k + k; });
      if (stage === 'mix') return fill(short, () => (r() < 0.5 ? nn(2 + Math.floor(r() * 3)) : word(3)));
      const tmpl = [() => `${nn(2)}/${nn(2)}`, () => `${d()}:${nn(2)}`, () => `${nn(2)}.${nn(2)}`, () => nn(3), () => word(3), () => word(4)];
      const usable = tmpl.filter((f) => fits(f(), allowed));
      return fill(len, () => pickOne(usable, r)());
    }
    case 'symbols': {
      const syms = [...allowed].filter((c) => '@#$%&*=+_'.includes(c));
      const digits = [...allowed].filter((c) => /[0-9]/.test(c));
      const d = () => pickOne(digits, r);
      const s = () => pickOne(syms, r);
      if (stage === 'drill') return fill(short, () => { const k = s(); return k + k + ' ' + pickOne(['a', 'f', 'j', ';'], r) + k; });
      if (stage === 'mix') return fill(short, () => pickOne([() => word(2) + s() + word(2), () => d() + d() + '%', () => '$' + d() + d(), () => word(2) + '=' + word(2), () => '#' + word(3)], r)());
      const tmpl = [() => `send $${d()}${d()} to ${word(3)}@${word(3)}.dev`, () => `${word(3)} & ${word(3)}`, () => `#${word(4)}`, () => `${word(2)}_${word(2)} = ${d()}${d()}`, () => `${d()}${d()}% ${word(3)}`, () => `${word(3)} * ${word(3)}`, () => `${word(4)} + ${word(4)}`];
      return fill(len, () => { let t = pickOne(tmpl, r)(); let g = 0; while (!fits(t, allowed) && g++ < 10) t = pickOne(tmpl, r)(); return fits(t, allowed) ? t : word(4); });
    }
    case 'bigrams': {
      // The player's own weakest transitions, when known; the English list until then.
      const grams = opts.weakPairs?.length ? opts.weakPairs : BIGRAMS;
      if (stage === 'drill') return fill(short, () => pickOne(grams, r));
      if (stage === 'mix') return fill(short, () => (r() < 0.5 ? pickOne(grams, r) : pickOne(TOP, r)));
      return fill(len, () => topWord(r));
    }
    case 'top': return fill(stage === 'words' ? len : short, () => topWord(r));
    case 'quotes': {
      const ok = QUOTES.filter((q) => fits(q, allowed));
      return fill(stage === 'words' ? len : short, () => pickOne(ok, r));
    }
    case 'long': {
      const pool = [...SENTENCES, ...QUOTES].filter((q) => fits(q, allowed));
      if (stage === 'drill') return fill(short, () => topWord(r));
      return fill(stage === 'mix' ? Math.round(len * 0.6) : len, () => pickOne(pool, r));
    }
    case 'code': {
      const ok = CODE.filter((c) => fits(c, allowed));
      if (stage === 'drill') return trail.newKeys ? fill(short, () => { const k = pickOne([...trail.newKeys], r); return k + k + ' ' + pickOne(['a', 'f', 'j', ';'], r) + k; }) : pickOne(ok, r);
      return fill(stage === 'mix' ? short : len, () => pickOne(ok, r));
    }
  }
}

/** Generate varied practice while guaranteeing evidence for every introduced key.
 * Checkpoints revisit the complete chapter vocabulary; characters never escape
 * the cumulative set. Coverage is explicit rather than left to random chance.
 */
export function generate(trail: Trail, stage: StageName, opts: GenOptions = {}): string {
  const allowed = allowedChars(trail);
  let text = trail.id === 'flow-checkpoint' ? finalPassage(rng(opts.seed)) : generateRaw(trail, stage, opts);
  const r = rng((opts.seed ?? Math.floor(Math.random() * 1e8)) + 17);
  const focus = trail.checkpoint ? [...cumulativeKeys(trail).keys] : [...trail.newKeys];
  const bank = wordBank(trail);
  for (const k of focus) {
    const count = [...text.toLowerCase()].filter(c => c === k).length;
    const needed = trail.checkpoint ? 1 : 3;
    if (count >= needed) continue;
    const words = bank.filter(w => w.includes(k) && w.length <= 6);
    for (let n = count; n < needed; n++) {
      const fragment = ({ ';': 'a; a', '/': 'a/b', "'": "'hi'", '"': '"hi"', '?': 'why?', '!': 'yes!', '-': 'a-b', ':': 'a:b', '(': '(a)', ')': '(a)', '@': 'a@b', '#': '#a', '$': '$2', '%': '2%', '&': 'a&b', '*': '2*2', '=': 'a=b', '+': '2+2', '_': 'a_b', '{': '{a}', '}': '{a}', '[': '[a]', ']': '[a]', '<': 'a<b', '>': 'a>b' } as Record<string, string>)[k];
      const piece = words.length && stage !== 'drill' ? pickOne(words, r) : stage === 'words' && fragment && fits(fragment, allowed) ? fragment : k;
      text += (text ? ' ' : '') + piece;
    }
  }
  if (trail.shift && !/[A-Z]/.test(text)) text += ' Fir Jar';
  if (![...text].every(c => allowed.has(c))) throw new Error(`Invalid curriculum text for ${trail.id}`);
  return text;
}
