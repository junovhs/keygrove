import { allowedChars, cumulativeKeys, type StageName, type Trail } from '../curriculum';
import WORDS from '../data/words.json';
import TOP from '../data/top200.json';
import SENTENCES from '../data/sentences.json';
import QUOTES from '../data/quotes.json';
import CODE from '../data/code.json';
import { rng, pickOne, shuffle, type Rng } from './rng';

/** Per-key heat (0..1+). Hotter keys pull their words in more often. */
export type Heat = Readonly<Record<string, number>>;
export interface GenOptions { heat?: Heat; seed?: number }

/** Home-row anchor for every key: which finger rests where. */
const ANCHOR: Record<string, string> = {
  q: 'a', a: 'a', z: 'a', '1': 'a', w: 's', s: 's', x: 's', '2': 's', e: 'd', d: 'd', c: 'd', '3': 'd',
  r: 'f', f: 'f', v: 'f', t: 'f', g: 'f', b: 'f', '4': 'f', '5': 'f', y: 'j', h: 'j', n: 'j', u: 'j', j: 'j', m: 'j', '6': 'j', '7': 'j',
  i: 'k', k: 'k', ',': 'k', '8': 'k', o: 'l', l: 'l', '.': 'l', '9': 'l', p: ';', ';': ';', '/': ';', '0': ';',
};
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
function sampler(words: readonly string[], heat: Heat): (r: Rng) => string {
  if (!words.length) return () => '';
  const cum = new Float64Array(words.length);
  let total = 0;
  words.forEach((x, i) => { total += 1 + [...x].reduce((s, c) => s + (heat[c] ?? 0), 0); cum[i] = total; });
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

/** Opposite-hand home key, used to give home-row keys a partner to alternate with. */
const MIRROR: Record<string, string> = { a: ';', s: 'l', d: 'k', f: 'j', j: 'f', k: 'd', l: 's', ';': 'a' };

function rhythmPatterns(keys: string): string[] {
  const ks = [...keys].filter((k) => k !== ' ');
  const pats: string[] = [];
  for (const k of ks) {
    const a = ANCHOR[k] ?? k;
    const p = a === k ? (MIRROR[k] ?? (ks.find((x) => x !== k) ?? k)) : a;
    pats.push(k + k, p + k + p, k + p + k, k + k + p, p + k + k);
  }
  if (ks.length > 1) { const [x, y] = ks as [string, string]; pats.push(x + y, y + x, x + y + x, y + x + y, x + x + y + y, x + y + y + x); }
  return pats;
}

/** Generate the text for a trail stage. Output only ever contains allowedChars(trail). */
export function generate(trail: Trail, stage: StageName, opts: GenOptions = {}): string {
  const r = rng(opts.seed === undefined ? undefined : opts.seed + ['drill', 'mix', 'words'].indexOf(stage) * 1000003);
  const heat = opts.heat ?? {};
  const allowed = allowedChars(trail);
  const bank = wordBank(trail);
  const pats = rhythmPatterns(trail.newKeys);
  const pat = () => pickOne(pats, r);
  const cold = Object.keys(heat).length === 0;
  const samplers = cold ? (coldSamplers.get(trail.id) ?? coldSamplers.set(trail.id, new Map()).get(trail.id)!) : new Map<number, (r: Rng) => string>();
  const word = (min = 2) => {
    let s = samplers.get(min);
    if (!s) { const b = bank.filter((w) => w.length >= min); s = sampler(b.length ? b : bank, heat); samplers.set(min, s); }
    return s(r) || (pats.length ? pat() : '');
  };
  const topWord = sampler(TOP, heat);
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
      if (stage === 'drill') return fill(short, () => { const k = pickOne([...LETTERS], r); const a = ANCHOR[k]!; const p = a === k ? MIRROR[k]! : a; return k.toUpperCase() + p + ' ' + p.toUpperCase() + k; });
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
      if (stage === 'drill') return fill(short, () => { const k = d(); const a = ANCHOR[k]!; return a + k + a + ' ' + k + k; });
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
      if (stage === 'drill') return fill(short, () => pickOne(BIGRAMS, r));
      if (stage === 'mix') return fill(short, () => (r() < 0.5 ? pickOne(BIGRAMS, r) : pickOne(TOP, r)));
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
