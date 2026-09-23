import { describe, expect, it } from 'vitest';
import { DEMO_WPM, demoSchedule, demoSpan, demoStepMs } from './demo';

describe('press-like-this demo (PACE-04)', () => {
  it('steps at 25 WPM: 480 ms apart, starting at once', () => {
    expect(DEMO_WPM).toBe(25);
    expect(demoStepMs()).toBe(480);
    expect(demoSchedule('ed de ded ed de').map(s => s.at)).toEqual([0, 480, 960, 1440, 1920, 2400, 2880, 3360, 3840]);
  });
  it('covers only the first loop or word', () => {
    expect(demoSpan('ed de ded ed de ded')).toBe('ed de ded');
    expect(demoSpan('eeiieeii')).toBe('eeiieeii');
    expect(demoSpan('together with everyone')).toBe('together');
    expect(demoSpan('extraordinarily long')).toBe('extraordinar');
  });
  it('maps each character to its key and intended finger', () => {
    expect(demoSchedule('Fj ed').map(s => [s.char, s.key, s.finger])).toEqual([
      ['F', 'f', 'li'], ['j', 'j', 'ri'], [' ', ' ', 'thumb'], ['e', 'e', 'lm'], ['d', 'd', 'lm'],
    ]);
  });
});
