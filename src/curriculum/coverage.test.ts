import { describe, expect, it } from 'vitest';
import { MAIN_TRAILS, allowedChars } from '.';
import { readablePhrases } from './language';
import { wordBank } from '../engine/textgen';
// The 43 core bigrams (research: coverage, not drills). Test-only, straight from the candidate table.
import coreCsv from '../../research/typing-movements/outputs/candidates/core_transitions.csv?raw';

const CORE = coreCsv.split('\n').filter((l: string) => l && !l.startsWith('#')).slice(1).map((l: string) => l.split(',')[0]!);

describe('core-bigram coverage (spec C5)', () => {
  it('reads all 43 core bigrams', () => { expect(CORE.length).toBe(43); expect(CORE).toContain('th'); });
  it('every word lesson can produce each core bigram whose two keys are unlocked', () => {
    for (const t of MAIN_TRAILS.filter(t => ['words', 'lower-sentences', 'bigrams', 'top'].includes(t.kind) && t.id !== 'flow-checkpoint')) {
      const allowed = allowedChars(t);
      const sources = [...wordBank(t), ...readablePhrases(allowed).map(p => p.toLowerCase())];
      for (const bg of CORE) {
        if (!allowed.has(bg[0]!) || !allowed.has(bg[1]!)) continue;
        expect(sources.some(w => w.includes(bg)), `${t.id} cannot produce core bigram ${bg}`).toBe(true);
      }
    }
  });
});
