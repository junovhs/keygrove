import { baseKey, fingerOf, type FingerId } from '../curriculum/method';

/**
 * "Press like this" (PACE-04): before a slow replay, the keyboard and hands show a relaxed pace by lighting the first few
 * presses in a steady rhythm. It demonstrates the intended finger only (DEC-15); nothing is timed against it.
 */

/** The demonstrated pace, in words per minute (five characters to a word). */
export const DEMO_WPM = 25;
/** Milliseconds between demonstrated presses: 480 at 25 WPM. */
export const demoStepMs = (wpm = DEMO_WPM): number => 12_000 / wpm;
/** One demonstrated press: which on-screen key lights, which finger shows, and when. */
export interface DemoStep { char: string; key: string; finger: FingerId | null; at: number }

/** The first loop or word of `text`, grown word by word to at least `min` characters and never past `max`. */
export function demoSpan(text: string, min = 8, max = 12): string {
  const words = text.split(' ');
  let span = words[0] ?? '';
  for (const w of words.slice(1)) { if (span.length >= min || span.length + 1 + w.length > max) break; span += ' ' + w; }
  return span.slice(0, max);
}

/** The steady schedule for the demo span: one press every demoStepMs, starting at 0. */
export function demoSchedule(text: string, wpm = DEMO_WPM): DemoStep[] {
  const step = demoStepMs(wpm);
  return [...demoSpan(text)].map((char, i) => ({ char, key: baseKey(char), finger: fingerOf(baseKey(char)), at: i * step }));
}
