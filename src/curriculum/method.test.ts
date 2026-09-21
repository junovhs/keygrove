import { describe, expect, it } from 'vitest';
import { METHODS, RELAXED_QWERTY, TRADITIONAL, fingerOf, homeOf, keysOf, mirrorOf, setMethod, activeMethod, DEFAULT_METHOD_ID } from './method';
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
    expect(fingerOf('!')).toBe('lp'); expect(fingerOf('(')).toBe('rr'); expect(fingerOf('C')).toBe('li'); expect(fingerOf('?')).toBe('rp');
    expect(homeOf('c')).toBe('f'); expect(homeOf('b')).toBe('j'); expect(homeOf('z')).toBe('s');
    expect(mirrorOf('f')).toBe('j'); expect(mirrorOf('a')).toBe(';');
  });
  it('switching methods changes the derived fingers everywhere', () => {
    setMethod(TRADITIONAL.id);
    expect(activeMethod().id).toBe(TRADITIONAL.id);
    expect(fingerForKey('c')?.id).toBe('lm');
    expect(fingers().find((f) => f.id === 'lp')!.keys).toContain('z');
    setMethod('nope');
    expect(activeMethod().id).toBe(DEFAULT_METHOD_ID);
    expect(fingerForKey('c')?.id).toBe('li');
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
    setMethod(RELAXED_QWERTY.id);
  });
});
