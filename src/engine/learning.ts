import { type Run } from './run';
import { type KeyModel } from './keymodel';
import { type TransitionModel } from './transitions';

/** Assisted discovery is never performance evidence, including the boundary after it. */
export function recordPerformance(run: Run, keys: KeyModel, transitions: TransitionModel, now: number, assistedThrough = 0): void {
  const last = run.strokes.at(-1);
  if (!last || last.index < assistedThrough) return;
  const prev = run.strokes.at(-2);
  const consecutive = prev?.correct && prev.index === last.index - 1 && prev.index >= assistedThrough;
  const timed = consecutive && prev.key !== ' ' && last.key !== ' ' && last.latencyMs > 0 && last.latencyMs < 2000;
  keys.record(last.key, last.correct, timed ? last.latencyMs : null, now, last.correct ? undefined : last.typed);
  if (consecutive) transitions.record(prev.key, last.key, last.correct, last.latencyMs);
}
