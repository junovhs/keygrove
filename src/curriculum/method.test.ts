import { describe, expect, it } from 'vitest';
import { METHODS, RELAXED_QWERTY, TRADITIONAL, fingerOf, homeOf, keysOf, mirrorOf, reassignedKeys, setMethod, activeMethod, DEFAULT_METHOD_ID } from './method';
import { fingerForKey, fingers } from './fingers';

const KEYS = "abcdefghijklmnopqrstuvwxyz0123456789;,./-=[]'\\` ";

describe('typing methods (spec §44, §63)', () => {
  it('every method covers every key exactly once, with eight fingers plus thumb', () => {
    for (const m of METHODS) {
      for (const k of KEYS) expect(m.assignments[k], `${m.id} ${JSON.stringify(k)}`).toBeTruthy();
      const ids = new Set(Object.values(m.assignments));
      expect([...ids].sort()).toEqual(['li', 'lm', 'lp', 'lr', 'ri', 'rm', 'rp', 'rr', 'thumb']);
    }
  });
  it('relaxed qwerty 1.0 is the spec map; traditional differs only on Z X C B', () => {
    expect(keysOf('lp', RELAXED_QWERTY).sort()).toEqual(['1', '`', 'a', 'q']);
    expect(fingerOf('~')).toBe('lp');
    expect(keysOf('lr', RELAXED_QWERTY).sort()).toEqual(['2', 's', 'w', 'z']);
    expect(keysOf('lm', RELAXED_QWERTY).sort()).toEqual(['3', 'd', 'e', 'x']);
    expect(keysOf('li', RELAXED_QWERTY).sort()).toEqual(['4', '5', 'c', 'f', 'g', 'r', 't', 'v']);
    expect(keysOf('ri', RELAXED_QWERTY).sort()).toEqual(['6', '7', 'b', 'h', 'j', 'm', 'n', 'u', 'y']);
    const diff = KEYS.split('').filter((k) => RELAXED_QWERTY.assignments[k] !== TRADITIONAL.assignments[k]);
    expect(diff.sort()).toEqual(['b', 'c', 'x', 'z']);
    expect(fingerOf('z', TRADITIONAL)).toBe('lp'); expect(fingerOf('b', TRADITIONAL)).toBe('li');
  });
  it('shifted symbols inherit the base key; landmarks and mirrors come from the finger', () => {
    setMethod(RELAXED_QWERTY.id);
    expect(fingerOf('!')).toBe('lp'); expect(fingerOf('(')).toBe('rr'); expect(fingerOf('C')).toBe('li'); expect(fingerOf('?')).toBe('rp');
    expect(homeOf('c')).toBe('f'); expect(homeOf('b')).toBe('j'); expect(homeOf('z')).toBe('s');
    expect(mirrorOf('f')).toBe('j'); expect(mirrorOf('a')).toBe(';');
    setMethod(DEFAULT_METHOD_ID);
  });
  it('traditional is the default (DEC-12); an unknown id falls back to it', () => {
    expect(DEFAULT_METHOD_ID).toBe(TRADITIONAL.id);
    expect(METHODS[0]!.id).toBe(TRADITIONAL.id);
    setMethod('nope');
    expect(activeMethod().id).toBe(TRADITIONAL.id);
    expect(fingerForKey('c')?.id).toBe('lm'); expect(fingerForKey('z')?.id).toBe('lp'); expect(fingerForKey('b')?.id).toBe('li');
  });
  it('switching methods changes the derived fingers everywhere; the reset set is derived, not hard-coded', () => {
    setMethod(RELAXED_QWERTY.id);
    expect(activeMethod().id).toBe(RELAXED_QWERTY.id);
    expect(fingerForKey('c')?.id).toBe('li');
    expect(fingers().find((f) => f.id === 'lr')!.keys).toContain('z');
    expect(reassignedKeys(RELAXED_QWERTY, TRADITIONAL).sort()).toEqual(['b', 'c', 'x', 'z']);
    expect(reassignedKeys(TRADITIONAL, TRADITIONAL)).toEqual([]);
    setMethod(DEFAULT_METHOD_ID);
    expect(fingerForKey('c')?.id).toBe('lm');
  });
  it('lesson titles never name a finger the active method contradicts (DEC-12)', async () => {
    const { TRAILS } = await import('./index');
    const WORDS: Record<string, string> = { index: 'i', middle: 'm', ring: 'r', pinky: 'p' };
    for (const method of METHODS) {
      setMethod(method.id);
      for (const t of TRAILS) {
        const named = Object.keys(WORDS).filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(t.name)); // "Bearings" is not "ring"
        if (!named.length || !t.newKeys) continue;
        // A title that names a finger claims every key it introduces for that finger.
        const claimed = new Set(named.map((w) => WORDS[w]));
        for (const k of t.newKeys) expect(claimed.has(fingerOf(k)!.slice(1)), `${method.id}: "${t.name}" teaches ${k} with the ${fingerOf(k)}`).toBe(true);
      }
    }
    setMethod(DEFAULT_METHOD_ID);
  });
});

describe('method-aware lesson copy', () => {
  it('resolves finger placeholders under whichever method is active', async () => {
    const { resolveCopy, trailById } = await import('./index');
    setMethod(RELAXED_QWERTY.id);
    expect(resolveCopy(trailById('index-stretch-up').blurb)).toContain('C is your left index');
    expect(resolveCopy(trailById('index-down').blurb)).toContain('B belongs to your right index');
    expect(resolveCopy(trailById('ring-down').blurb)).toBe('Z is the LEFT RING. Period is the right ring.');
    setMethod(TRADITIONAL.id);
    expect(resolveCopy(trailById('index-stretch-up').blurb)).toContain('C is your left middle');
    expect(resolveCopy(trailById('index-down').blurb)).toContain('B belongs to your left index');
    expect(resolveCopy(trailById('ring-down').blurb)).toBe('Z is the LEFT PINKY. Period is the right ring.');
    setMethod(DEFAULT_METHOD_ID);
  });
});
