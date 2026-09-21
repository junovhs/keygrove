import type { Trail, GroveId } from './types';

type Spec = Omit<Trail, 'id' | 'n' | 'grove'> & { id?: string };
const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function grove(g: GroveId, specs: Spec[]): Omit<Trail, 'n'>[] {
  return specs.map((s) => ({ ...s, id: s.id ?? slug(s.name), grove: g }));
}

/** All trails in path order. Groves 1–6 are the main path; the Code grove is a side branch. */
const SPECS: Omit<Trail, 'n'>[] = [
  ...grove('roots', [
    { id: 'anchors', name: 'Find Your Bearings', newKeys: 'fj', space: true, kind: 'rhythm', length: 36, blurb: 'Index fingers only, plus the spacebar with either thumb. F and J are your landmarks.' },
    { id: 'inner-pair', name: 'Two More Fingers', newKeys: 'dk', kind: 'rhythm', length: 36, blurb: 'Middle fingers. Small reach, easy rhythm.' },
    { id: 'middle-up', name: 'Your First Words', newKeys: 'ei', kind: 'words', length: 40, blurb: 'Middle fingers reach up. First real words appear.' },
    { id: 'index-reach', name: 'Reach Inward', newKeys: 'gh', kind: 'words', length: 42, blurb: 'Index fingers reach inward. H is one of the busiest letters, so the right hand gets real work early.' },
    { id: 'core-words', name: 'Reach Down', newKeys: 'vm', kind: 'words', length: 44, blurb: 'V with your {v}, M with your {m}. Connect the lower row to familiar words.' },
    { name: 'Roots Checkpoint', newKeys: '', checkpoint: true, kind: 'words', length: 60, blurb: 'A longer mixed run. Use everything so far in a fresh passage to open Home.' },
  ]),
  ...grove('home', [
    { name: 'Index Up', newKeys: 'ru', kind: 'words', length: 44, blurb: 'Index fingers reach up. R and U share a finger with F and J.' },
    { name: 'Ring Pair', newKeys: 'sl', kind: 'words', length: 42, blurb: 'Ring fingers. Give each new reach time to settle.' },
    { name: 'Outer Pair', newKeys: 'a;', kind: 'words', length: 42, blurb: 'Pinkies. A and semicolon use your outer fingers; keep the touch light.' },
    { id: 'home-words', name: 'Everyday Connections', newKeys: 'nt', kind: 'words', length: 48, blurb: 'N below and T above: prepare your next finger, then connect in, it, the and them.' },
    { name: 'Home Checkpoint', newKeys: '', checkpoint: true, kind: 'words', length: 70 },
  ]),
  ...grove('canopy', [
    { id: 'index-stretch-up', name: 'C and Y', newKeys: 'cy', kind: 'words', length: 44, blurb: 'C is your {c}; Y your {y}. A small hand adjustment is welcome.' },
    { name: 'Ring Up', newKeys: 'wo', kind: 'words', length: 44 },
    { name: 'Pinky Up', newKeys: 'qp', kind: 'words', length: 44 },
    { name: 'Canopy Checkpoint', newKeys: '', checkpoint: true, kind: 'words', length: 70 },
  ]),
  ...grove('undergrowth', [
    { id: 'index-down', name: 'Meet B', newKeys: 'b', kind: 'words', length: 46, blurb: 'B belongs to your {b}. Meet it deliberately, then connect bring, blue and book.' },
    { id: 'index-stretch-down', name: 'Connected Lower Row', newKeys: '', kind: 'words', length: 46, blurb: 'Connect C, V, B, N and M with the rest of a word. Prepare instead of resetting.' },
    { id: 'middle-down', name: 'X and Comma', newKeys: 'x,', kind: 'words', length: 46, blurb: 'X is the {x}, comma the {,}.' },
    { id: 'ring-down', name: 'Z and Full Stop', newKeys: 'z.', kind: 'words', length: 46, blurb: 'Z is the {Z}. Period is the {.}.' },
    { name: 'Last Reaches', newKeys: '/', kind: 'words', length: 46, blurb: 'Slash belongs to your {/}. Revisit the lower row in useful combinations.' },
    { name: 'Undergrowth Checkpoint', newKeys: '', checkpoint: true, kind: 'lower-sentences', length: 80, blurb: 'Full alphabet. Lowercase sentences, no shift yet.' },
  ]),
  ...grove('bark', [
    { name: 'Opposite Shift', newKeys: '', shift: true, kind: 'caps', length: 40, blurb: 'Right shift for left-hand letters, left shift for right-hand letters.' },
    { name: 'Sentences', newKeys: '', kind: 'sentences', length: 70, blurb: 'Capitals and full stops in real sentences.' },
    { name: 'Quotes & Questions', newKeys: '\'"?!', kind: 'sentences', length: 80 },
    { name: 'Dashes & Colons', newKeys: '-:()', kind: 'sentences', length: 80 },
    { name: 'Bark Checkpoint', newKeys: '', checkpoint: true, kind: 'sentences', length: 110 },
  ]),
  ...grove('rings', [
    { name: 'Left Numbers', newKeys: '12345', kind: 'numbers', length: 40 },
    { name: 'Right Numbers', newKeys: '67890', kind: 'numbers', length: 40 },
    { name: 'Mixed Numbers', newKeys: '', kind: 'numbers', length: 60, blurb: 'Dates, prices, times.' },
    { name: 'Symbols', newKeys: '@#$%&*=+_', kind: 'symbols', length: 60 },
    { name: 'Rings Checkpoint', newKeys: '', checkpoint: true, kind: 'symbols', length: 110 },
  ]),
  ...grove('flow', [
    { name: 'Bigrams', newKeys: '', kind: 'bigrams', length: 60, blurb: 'th he in er an — the rhythm units of English.' },
    { name: 'Common Words', newKeys: '', kind: 'top', length: 90, blurb: 'The 200 most common words, shuffled.' },
    { name: 'Pangrams & Quotes', newKeys: '', kind: 'quotes', length: 110 },
    { name: 'Endurance', newKeys: '', kind: 'long', length: 440, blurb: 'A longer passage. Let words arrive in groups; pause between sentences when you need to.' },
    { name: 'Flow Checkpoint', newKeys: '', checkpoint: true, kind: 'long', length: 720, wpmTarget: 50, blurb: 'Your final passage: letters, capitals, punctuation, numbers and symbols. Aim for 97% accuracy at your own pace.' },
  ]),
  ...grove('code', [
    { name: 'Braces', newKeys: '{}[]', kind: 'code', length: 40 },
    { name: 'Angles & Equals', newKeys: '<>=', kind: 'code', length: 40 },
    { name: 'Arrows', newKeys: '', kind: 'code', length: 50, blurb: '=> and dot chains.' },
    { name: 'Snippets', newKeys: '', checkpoint: true, kind: 'code', length: 90, blurb: 'Real one-liners in JS and Python.' },
  ]),
];

export const TRAILS: readonly Trail[] = SPECS.map((t, i) => ({ ...t, n: i + 1 }));
export const MAIN_TRAILS: readonly Trail[] = TRAILS.filter((t) => t.grove !== 'code');
