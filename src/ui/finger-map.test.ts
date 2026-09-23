import { describe, expect, it } from 'vitest';
import { fingerPlace } from './finger-map';

describe('finger ids on the hand illustrations (UI-14)', () => {
  it('place all nine finger ids on the right hand and finger', () => {
    expect(fingerPlace('lp')).toEqual({ sides: ['left'], kind: 'pinky' });
    expect(fingerPlace('lr')).toEqual({ sides: ['left'], kind: 'ring' });
    expect(fingerPlace('lm')).toEqual({ sides: ['left'], kind: 'middle' });
    expect(fingerPlace('li')).toEqual({ sides: ['left'], kind: 'index' });
    expect(fingerPlace('ri')).toEqual({ sides: ['right'], kind: 'index' });
    expect(fingerPlace('rm')).toEqual({ sides: ['right'], kind: 'middle' });
    expect(fingerPlace('rr')).toEqual({ sides: ['right'], kind: 'ring' });
    expect(fingerPlace('rp')).toEqual({ sides: ['right'], kind: 'pinky' });
    expect(fingerPlace('thumb')).toEqual({ sides: ['left', 'right'], kind: 'thumb' });
  });
  it('reject anything else', () => {
    for (const id of ['', 'x', 'lx', 'lpp', 'thumbs']) expect(fingerPlace(id)).toBeNull();
  });
});
