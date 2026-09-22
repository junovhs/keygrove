import { PRACTICE_WORDS, readablePhrases } from '../curriculum/language';
import type { LessonExercise } from '../curriculum/lesson-flow';
import { allowedChars, cumulativeKeys, type StageName, type Trail } from '../curriculum';
import WORDS from '../data/words.json';
import TOP from '../data/top200.json';
import SENTENCES from '../data/sentences.json';
import QUOTES from '../data/quotes.json';
import CODE from '../data/code.json';
import { rng, pickOne, shuffle, type Rng } from './rng';
import { fingerOf, handOf, homeOf, mirrorOf, type FingerId } from '../curriculum/method';

/** Per-key heat (0..1+). Hotter keys pull their words in more often. */
export type Heat = Readonly<Record<string, number>>;
/** `pairHeat`: per-bigram heat ('th') from the transition model; `weakPairs`: the player's weakest real transitions for the Bigrams trail. */
export interface GenOptions { exercise?: LessonExercise; heat?: Heat; pairHeat?: Heat; weakPairs?: string[]; seed?: number }

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
    b = [...new Set([...PRACTICE_WORDS, ...WORDS])].filter(w => !['iii', 'diff', 'ref', 'gnu', 'thru', 'thy', 'sol'].includes(w) && [...w].every(c => set.has(c)));
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

/** Running hand and finger load of a text under construction; Space (thumb) is not counted. */
export interface Load { left: number; right: number; fingers: Partial<Record<FingerId, number>> }
/** A load with nothing typed yet. */
export const emptyLoad = (): Load => ({ left: 0, right: 0, fingers: {} });
/** The load after `piece` is typed under the active method (pure; returns a new Load). */
export function addLoad(load: Load, piece: string): Load {
  const next: Load = { left: load.left, right: load.right, fingers: { ...load.fingers } };
  for (const c of piece) {
    const f = fingerOf(c);
    if (!f || f === 'thumb') continue;
    next.fingers[f] = (next.fingers[f] ?? 0) + 1;
    if (handOf(f) === 'left') next.left++; else next.right++;
  }
  return next;
}
/** Share of the busiest finger (0..1). */
export const peakFinger = (load: Load): number => { const t = load.left + load.right; return t ? Math.max(0, ...Object.values(load.fingers)) / t : 0; };

/** No finger should carry more than this share of an exercise; with few keys unlocked the floor is 1/active fingers. */
export const FINGER_CAP = 0.3;

/**
 * Pick the candidate that keeps the text closest to an even left/right split without any one finger
 * dominating. Candidates come from the heat-weighted sampler, so weak keys still pull their words in;
 * this only decides between a handful of otherwise acceptable choices. Repeating the previous piece
 * costs extra, and every reuse a little more, so short pools do not degenerate into one phrase.
 */
function balancedPick(load: Load, sample: () => string, used: Map<string, number>, last: string, r: Rng, tries = 8): string {
  let best = '', bestCost = Infinity;
  for (let i = 0; i < tries; i++) {
    const p = sample();
    if (!p) continue;
    const next = addLoad(load, p);
    const total = next.left + next.right;
    const imbalance = total ? Math.abs(next.left - next.right) / total : 0;
    const cost = imbalance + 2 * Math.max(0, peakFinger(next) - FINGER_CAP) + (p === last ? 0.35 : 0) + 0.04 * (used.get(p) ?? 0) + r() * 0.05;
    if (cost < bestCost) { best = p; bestCost = cost; }
  }
  return best;
}
/** `fill` with balance-aware selection. */
function balancedFill(len: number, sample: () => string, r: Rng): string {
  let load = emptyLoad(), last = '';
  const used = new Map<string, number>();
  return fill(len, () => { const p = balancedPick(load, sample, used, last, r); load = addLoad(load, p); used.set(p, (used.get(p) ?? 0) + 1); last = p; return p; });
}

/** Join pieces until the text reaches `len` characters (never cuts a piece). */
function fill(len: number, next: () => string): string {
  let s = '';
  let guard = 0;
  while (s.length < len && guard++ < 400) { const p = next(); if (!p) break; s += (s ? ' ' : '') + p; }
  return s;
}

/** Short connected movements: the next target need not be a return to home. */
function rhythmPatterns(keys: string): string[] {
  const ks = [...keys].filter(k => k !== ' ');
  const pats: string[] = [];
  for (const k of ks) {
    const a = anchorOf(k);
    const partner = a === k ? mirrorOf(k) : a;
    pats.push(k + k, partner + k, k + partner);
  }
  for (let i = 0; i + 1 < ks.length; i += 2) {
    const x = ks[i]!, y = ks[i + 1]!;
    pats.push(x + y, y + x, x + x + y + y);
  }
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
  const heat: Record<string, number> = { ...opts.heat };
  for (const k of opts.exercise?.focusKeys ?? '') heat[k] = (heat[k] ?? 0) + 3;
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
  const len = opts.exercise?.length ?? trail.length;
  const short = opts.exercise ? len : Math.round(len * 0.8);
  const patternsOr = (fallback: () => string) => (pats.length ? pat : fallback);

  const exercise = opts.exercise;
  if (exercise?.format === 'movement' && ['rhythm', 'words'].includes(trail.kind)) {
    const fresh = [...trail.newKeys];
    const familiar = [...cumulativeKeys(trail).keys].filter(k => k !== ' ');
    // Give each focus key a same-finger connection and an alternating-hand phrase.
    // These are literal destinations, not instructions to reset the hand after a press.
    const patterns = fresh.flatMap(k => {
      const same = familiar.filter(p => p !== k && fingerOf(p) === fingerOf(k)).slice(-2);
      const other = fresh.find(p => handOf(fingerOf(p)!) !== handOf(fingerOf(k)!))
        ?? familiar.find(p => handOf(fingerOf(p)!) !== handOf(fingerOf(k)!));
      return [k + k, ...same.flatMap(p => [p + k, k + p]), ...(other ? [k + other, other + k] : [])];
    }).filter(p => fits(p, allowed));
    const introduction = fresh.map(k => k.repeat(2)).join('');
    return introduction + ' ' + balancedFill(Math.max(8, len - introduction.length), () => pickOne(patterns, r), r);
  }
  if (exercise?.format === 'passage' && ['words', 'lower-sentences', 'bigrams', 'top'].includes(trail.kind)) {
    const phrases = readablePhrases(allowed);
    // Prefer language that actually exercises the new keys, rather than unrelated easy text.
    const target = phrases.filter(p => [...(exercise.focusKeys ?? trail.newKeys)].some(k => p.toLowerCase().includes(k)));
    // A thin target pool would repeat one phrase; widen it with the rest so the balancer has real choices.
    const pool = shuffle(target.length >= 4 ? target : [...target, ...phrases.filter(p => !target.includes(p))], r);
    if (pool.length) {
      // Cycle the whole eligible pool with balance-aware choice, rather than repeating the one or two longest phrases.
      return balancedFill(trail.id === 'middle-up' ? Math.min(32, len) : len, () => pickOne(pool, r), r);
    }
  }
  if (exercise?.format === 'words' && trail.kind === 'words') {
    const familiar = PRACTICE_WORDS.filter(w => w.length >= 2 && fits(w, allowed));
    const pool = familiar.length ? familiar : bank;
    const pick = sampler(pool, heat, opts.pairHeat);
    return balancedFill(len, () => pick(r), r);
  }

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
      if (exercise?.format === 'words') {
        const pool = [...new Set([...PRACTICE_WORDS, ...TOP])].filter(w => grams.some(pair => w.includes(pair)));
        const pick = sampler(pool, heat, opts.pairHeat);
        return balancedFill(len, () => pick(r), r);
      }
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

/** Spec B1: the target both ways with a rest between — `ed de ded ed de ded …` — only its two letters and spaces, about `len` characters. */
export function transitionLoop(target: string, len: number): string {
  const [a, b] = [target[0]!, target[1]!];
  const units = [a + b, b + a, a + b + a];
  let text = '';
  for (let i = 0; text.length + units[i % 3]!.length + 1 <= len + 1; i++) text += (text ? ' ' : '') + units[i % 3];
  return text;
}

/** Generate varied practice while guaranteeing evidence for every introduced key.
 * Checkpoints revisit the complete chapter vocabulary; characters never escape
 * the cumulative set. Coverage is explicit rather than left to random chance.
 */
export function generate(trail: Trail, stage: StageName, opts: GenOptions = {}): string {
  const allowed = allowedChars(trail);
  if (opts.exercise?.assessment === 'guided') for (const k of opts.exercise.guidedKeys ?? '') allowed.add(k);
  if (opts.exercise?.text !== undefined) {
    const text = opts.exercise.text;
    if (!text || ![...text].every(c => allowed.has(c))) throw new Error(`Invalid authored exercise for ${trail.id}`);
    return text;
  }
  if (opts.exercise?.target) {
    const text = transitionLoop(opts.exercise.target, opts.exercise.length);
    if (![...text].every(c => allowed.has(c))) throw new Error(`Transition target ${opts.exercise.target} is not unlocked in ${trail.id}`);
    return text;
  }
  let text = trail.id === 'flow-checkpoint' ? finalPassage(rng(opts.seed)) : generateRaw(trail, stage, opts);
  if (opts.exercise && trail.checkpoint && trail.id !== 'flow-checkpoint') {
    const pangram = readablePhrases(allowed).find(p => [...LETTERS].every(k => p.toLowerCase().includes(k)));
    if (pangram) text = pangram + ' ' + text;
  }
  const r = rng((opts.seed ?? Math.floor(Math.random() * 1e8)) + 17);
  const focus = trail.checkpoint ? [...cumulativeKeys(trail).keys] : [...(opts.exercise?.focusKeys ?? trail.newKeys)];
  const bank = wordBank(trail);
  for (const k of focus) {
    const count = [...text.toLowerCase()].filter(c => c === k).length;
    const needed = trail.checkpoint || opts.exercise?.format === 'passage' ? 1 : 3;
    if (count >= needed) continue;
    const familiarWords = PRACTICE_WORDS.filter(w => w.includes(k) && w.length <= 6 && fits(w, allowed));
    const words = familiarWords.length ? familiarWords : bank.filter(w => w.includes(k) && w.length <= 6);
    for (let n = count; n < needed; n++) {
      const fragment = ({ ';': 'a; a', '/': 'a/b', "'": "'hi'", '"': '"hi"', '?': 'why?', '!': 'yes!', '-': 'a-b', ':': 'a:b', '(': '(a)', ')': '(a)', '@': 'a@b', '#': '#a', '$': '$2', '%': '2%', '&': 'a&b', '*': '2*2', '=': 'a=b', '+': '2+2', '_': 'a_b', '{': '{a}', '}': '{a}', '[': '[a]', ']': '[a]', '<': 'a<b', '>': 'a>b' } as Record<string, string>)[k];
      const phrases = opts.exercise?.format === 'passage' ? readablePhrases(allowed).filter(p => p.toLowerCase().includes(k)).sort((a,b) => a.length - b.length) : [];
      const shortPhrases = phrases.filter(p => p.length <= (phrases[0]?.length ?? 0) + 8);
      const pool = shortPhrases.length ? shortPhrases : words.length && stage !== 'drill' ? words : [];
      const piece = pool.length ? balancedPick(addLoad(emptyLoad(), text), () => pickOne(pool, r), new Map(), '', r, 16)
        : stage === 'words' && fragment && fits(fragment, allowed) ? fragment : k;
      text += (text ? ' ' : '') + piece;
    }
  }
  if (trail.shift && !/[A-Z]/.test(text)) text += ' Fir Jar';
  if (opts.exercise?.format === 'movement' && ['rhythm', 'words'].includes(trail.kind)) {
    // Movement blocks are 6 letters, not a Space after every two presses.
    // The first three landmark exercises deliberately have no Space at all.
    const letters = text.replaceAll(' ', '');
    const noSpace = trail.id === 'anchors' ? opts.exercise.name !== 'Meet Space' : opts.exercise.stage === 'drill';
    text = noSpace ? letters : letters.match(/.{1,6}/g)!.join(' ');
  }

  if (![...text].every(c => allowed.has(c))) throw new Error(`Invalid curriculum text for ${trail.id}`);
  return text;
}
