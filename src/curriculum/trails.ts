import type { Trail, GroveId } from './types';

type Spec = Omit<Trail, 'id' | 'n' | 'grove'> & { id?: string };
const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function grove(g: GroveId, specs: Spec[]): Omit<Trail, 'n'>[] {
  return specs.map((s) => ({ ...s, id: s.id ?? slug(s.name), grove: g }));
}

/** All trails in path order. Groves 1–6 are the main path; the Code grove is a side branch. */
const SPECS: Omit<Trail, 'n'>[] = [
  ...grove('roots', [
    { name: 'Anchors', newKeys: 'fj', space: true, kind: 'rhythm', length: 36, blurb: 'Index fingers only, plus the spacebar with either thumb. F and J are your landmarks.' },
    { name: 'Inner Pair', newKeys: 'dk', kind: 'rhythm', length: 36, blurb: 'Middle fingers. Small reach, easy rhythm.' },
    { name: 'Middle Up', newKeys: 'ei', kind: 'words', length: 40, blurb: 'Middle fingers reach up. First real words appear.' },
    { name: 'Index Up', newKeys: 'ru', kind: 'words', length: 42, blurb: 'Index fingers reach up. R and U share a finger with F and J.' },
    { name: 'Core Words', newKeys: '', kind: 'words', length: 44, blurb: 'Everything so far, as words.' },
    { name: 'Roots Checkpoint', newKeys: '', checkpoint: true, kind: 'words', length: 60, blurb: 'A longer mixed run. ★★ here opens the Home grove.' },
  ]),
  ...grove('home', [
    { name: 'Ring Pair', newKeys: 'sl', kind: 'words', length: 42, blurb: 'Ring fingers. Weakest reach on the row; take it slow.' },
    { name: 'Outer Pair', newKeys: 'a;', kind: 'words', length: 42, blurb: 'Pinkies. The semicolon is a real key — treat it like one.' },
    { name: 'Index Reach', newKeys: 'gh', kind: 'words', length: 44, blurb: 'Index fingers reach inward. F and J stay your landmarks.' },
    { name: 'Home Words', newKeys: '', kind: 'words', length: 48, blurb: 'The whole home row plus E I R U.' },
    { name: 'Home Checkpoint', newKeys: '', checkpoint: true, kind: 'words', length: 70 },
  ]),
  ...grove('canopy', [
    { name: 'Index Stretch Up', newKeys: 'ty', kind: 'words', length: 44, blurb: 'T and Y: the index fingers\' far reach. Let the hand slide a little.' },
    { name: 'Ring Up', newKeys: 'wo', kind: 'words', length: 44 },
    { name: 'Pinky Up', newKeys: 'qp', kind: 'words', length: 44 },
    { name: 'Canopy Checkpoint', newKeys: '', checkpoint: true, kind: 'words', length: 70 },
  ]),
  ...grove('undergrowth', [
    { name: 'Index Down', newKeys: 'vm', kind: 'words', length: 46, blurb: 'V is the {v}, M is the {m}.' },
    { name: 'Index Stretch Down', newKeys: 'cb', kind: 'words', length: 46, blurb: 'C is the {C}, B is the {B}. Follow the stagger, not the column.' },
    { name: 'Middle Down', newKeys: 'x,', kind: 'words', length: 46, blurb: 'X is the {x}, comma the {,}.' },
    { name: 'Ring Down', newKeys: 'z.', kind: 'words', length: 46, blurb: 'Z is the {Z}. Period is the {.}.' },
    { name: 'Last Reaches', newKeys: 'n/', kind: 'words', length: 46, blurb: 'N joins the {n}; slash is the {/}.' },
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
    { name: 'Endurance', newKeys: '', kind: 'long', length: 220, blurb: '60 seconds continuous.' },
    { name: 'Flow Checkpoint', newKeys: '', checkpoint: true, kind: 'long', length: 320, wpmTarget: 50, blurb: '90 seconds. ★★ = 50 WPM at 97%.' },
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
