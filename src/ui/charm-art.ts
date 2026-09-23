/**
 * Pixel art for the charms (UI-16), in the style of noceremony's rewards: a pattern grid of palette letters, one
 * saturated palette per charm, and a whole-pixel size. Each object carries a coloured outline (a deep shade of its own
 * hue, never black), a base, a shade on its right and lower side, a highlight blob and a few near-white sheen pixels.
 * '.' is transparent. Pure data: rendering lives in charm-fx.ts.
 */
export interface CharmArt {
  pattern: string[];
  palette: Record<string, string>;
  /** Screen pixels per art pixel. */
  pixel: number;
  /** Alternate frames (wings, legs, steam), cycled while the charm moves. */
  frames?: string[][];
  /** Extra sprites a behaviour needs (the snake's body, the music box's notes). */
  parts?: Record<string, string[]>;
}

/** Pads every row to the widest so a pattern is always a rectangle. */
const grid = (rows: string[]): string[] => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => r.padEnd(w, '.')); };
/**
 * Mirror left halves (the last character is the centre column) into symmetric rows. `shade` recolours the right-hand
 * side so symmetric objects are still lit from the upper left.
 */
function sym(halves: string[], shade: Record<string, string> = {}): string[] {
  return halves.map(h => h + [...h.slice(0, -1)].reverse().map(c => shade[c] ?? c).join(''));
}
/** Mirror a whole pattern left to right (for art drawn facing the other way). */
export const flipRows = (rows: string[]): string[] => rows.map(r => [...r].reverse().join(''));

// ---- Chapter charms --------------------------------------------------------------------------------------------------

const FIR = grid([
  ...sym(['........y', '.......yw', '........y'], {}),
  ...sym([
    '........s', '.......sh', '......shg', '.....shgg', '....shggg', '....sssgg',
    '......shg', '.....shgr', '....shggg', '...shgggg', '...ssssgg',
    '.....shgg', '....shggg', '...shgrgg', '..shggggg', '.shgggggg', '.ssssssss',
    '......stt', '......stt', '......sss',
  ], { h: 'g', g: 'd', r: 'r', t: 'T' }),
]);

const CUP_BODY = [
  '.ssssssssssssss....',
  'sKkkkkkkkkkkkkKs...',
  'swKKKKKKKKKKKKws...',
  'sbwhhbbbbbbbbbbcssss',
  'sbwhhbbbbbbbbbbcbbbcs',
  'sbwhbbbbbbbbbbbcs..cs',
  'sbwhbbbbbbbbbbbcs..cs',
  'sbbhbbbbbbbbbbccs.cs.',
  'sbbbbbbbbbbbbbccbccs.',
  '.sbbbbbbbbbbbccssss..',
  '.sbbbbbbbbbbbccs.....',
  '..scbbbbbbbbccs......',
  '...sscccccccss.......',
  '.ssssssssssssssss....',
];
const CUP = grid(['....m....m.........', '...m....m..........', '....m....m.........', '...................', ...CUP_BODY]);
const CUP_STEAM = grid(['...m....m..........', '....m....m.........', '...m....m..........', '...................', ...CUP_BODY]);

const KITE = grid([
  ...sym(['.......s', '......st', '.....syt', '....syht', '...syhyt', '..syyyyt', '.syyyyyt', 'stttttt'], { y: 'r', h: 'o', t: 't' }),
  ...sym(['.soooooot', '..sooooot', '..soooot', '...sooot', '...soot', '....sot', '....st', '.....s'].map(r => r.slice(-8)), { o: 'p' }),
  '.......t.......', '........t......', '.......bbb.....', '......t........', '.....t.........', '.....bbb.......', '......t........', '.......t.......', '.......bbb.....',
]);

const beetle = (legs: 'a' | 'b') => grid(sym([
  '....k...', '.....k..', '......kk', '.....kkk',
  legs === 'a' ? '.k..sssk' : '..k.sssk', legs === 'a' ? '..kshhgs' : '.k.shhgs',
  '...shwhg', legs === 'a' ? 'kk.shhgg' : '.kkshhgg', '..kshggg', '...sgggs',
  legs === 'a' ? '.k.sgggs' : 'k..sgggs', legs === 'a' ? 'k..sgggs' : '.k.sgggs', '....sggs', '.....sss',
], { h: 'g', g: 'd', w: 'g' }));

const LETTER = grid([
  'ssssssssssssssssssss',
  'shhhpppppppppppppccs',
  'scppppppppppppppccds',
  'spcpppppppppppppcdps',
  'sppcpppppppppppcdpps',
  'spppccpppppppccdppps',
  'sppppcccpprrcdddppps',
  'spppppccprwrRdpppccs',
  'spppppppprrRRpppcpds',
  'spppppppppRRpppcpdds',
  'sppppppppppppppcddds',
  'scccccccccccccccddds',
  'ssssssssssssssssssss',
]);

const WATCH = grid([
  ...sym(['.......c', '......cc', '.......c', '......ss', '.....sgg', '......ss'], { g: 'd' }),
  ...sym([
    '....ssss', '..ssgggg', '.sghhggg', '.sghffff', 'sghffffk', 'sgffffkk', 'sgffkfff', 'sgfffffk',
    'sgffkfff', 'sgffffff', '.sgfffff', '.sggffff', '..ssgggg', '....ssss',
  ], { h: 'g', g: 'd', f: 'f', k: 'k' }),
]);

const MUSIC = grid([
  '....sssssssssssss...',
  '...svvvvvvvvvvvvvs..',
  '..shhvvvvvvvvvvvVVs.',
  '.sggggggggggggggggs.',
  '.ssssssssssssssssss.',
  '........sgs.........',
  '.......sgwgs........',
  '........sgs.........',
  '.ssssssssssssssssss.',
  '.sgggggggggggggggds.',
  '.svhhvvvvvvvvvvvVVs.',
  '.svhvvvvggvvvvvvVVs.',
  '.svvvvvgwwgvvvvvVVs.',
  '.svvvvvvggvvvvvvVVs.',
  '.sVVVVVVVVVVVVVVVVs.',
  '.sgggggggggggggggds.',
  '..sss..........sss..',
]);
const NOTE = grid(['...ss', '...sn', '...sn', '...s.', '.nns.', 'nnns.', '.nn..']);

const fox = (step: 'a' | 'b') => grid([
  '..........................s.s.',
  '.........................sosos',
  '........................soooos',
  '.ss....................sookoows',
  'sOOs..................soooooows',
  'sOOOs...............ssooooowwws',
  '.sOOOs.......sssssssoooooowwk..',
  '..sOOOsssssssoooooooooooowws...',
  '...swwsooooooooooooooooooos....',
  '....sssoooooooooooooooooOs.....',
  '.......sOoooooooooooooOOs......',
  ...(step === 'a'
    ? ['.......soOs.........sOos.......', '......soOs..........sOs........', '.....sks............sks........']
    : ['........sOos.......sOs.........', '.........sOs......soOs.........', '.........sks.....sks..........']),
]);

// ---- Finger charms ---------------------------------------------------------------------------------------------------

const sparrow = (wings: 'up' | 'down') => grid(wings === 'up' ? [
  '........sss..........',
  '.......sccs..........',
  '......sccbs..........',
  '.....sccbbs...sss....',
  '....sccbbs...sbbbs...',
  '...sccbbbs..sbbkbs...',
  '..sscbbbbssssbbbbyy..',
  '.sccbbbbbbbbbbbbbs...',
  'sccsbbbbhhhhhhhbs....',
  '.ss.sbhhhhhhhhs......',
  '.....sshhhhhss.......',
  '.......sssss.........',
] : [
  '.............sss.....',
  '............sbbbs....',
  '...........sbbkbs....',
  '..sssssssssbbbbbyy...',
  '.sccbbbbbbbbbbbbs....',
  'sccsbbbbhhhhhhhs.....',
  '.ss.sbcchhhhhhs......',
  '.....sccbbhhss.......',
  '......sccbbs.........',
  '.......sccs..........',
  '........ss...........',
  '.....................',
]);

const PLANE = grid([
  '.....................sss',
  '..................ssssws',
  '...............sssswwcs.',
  '............sssswwwwcs..',
  '.........sssswwwwwwcs...',
  '......sssswwwwwwwwcs....',
  '...sssswwwwwwwwwwcs.....',
  'ssswwwwwwwwwwwwwcbs.....',
  '.sscccccccccccccbs......',
  '...sssbbbbbbbbbbs.......',
  '......sssbbbbbbs........',
  '.........sssbbs.........',
  '............sss.........',
]);

const COMET = grid([
  '........................hh..',
  '.................bbv...hhwhh',
  '............bbbvvvvbbhhwwwwh',
  '.......bbbvvvvvvbbbbhwwwwwwh',
  'bbbvvvvvvbbbbbbbbbbbhwwwwwwh',
  '.......bbbvvvvvvbbbbhwwwwwwh',
  '............bbbvvvvbbhhwwwwh',
  '.................bbv...hhwhh',
  '........................hh..',
]);

const SNAIL = grid([
  '..........sssss.........',
  '........sspppppss.......',
  '.......sphhpppppPs......',
  '......sphssssspppPs.....',
  '......sphsPPPsspPPs.....',
  '......sphsPsPPspPPs...k.k',
  '......sppsPssPspPPs...s.s',
  '......spppsPPPspPPs..sbbs',
  '.......sppPsssPPPs..sbbbs',
  '........sPPPPPPPs..sbbbs.',
  '...sssssssssssssssbbbbs..',
  '..sbbbbbbbbbbbbbbbbbbs...',
  '.sbhhhbbbbbbbbbbbbbBs....',
  '..sBBBBBBBBBBBBBBBBs.....',
  '...ssssssssssssssss......',
]);

const BALLOON = grid([
  '.....ssss......',
  '...ssbbbbss....',
  '..sbbhhhhbbs...',
  '.sbbhwwhbbbbs..',
  '.sbbhwhhbbbbbs.',
  'sbbbhhhbbbbbbbs',
  'sbbbbbbbbbbbbbs',
  'sbbbbbbbbbbbbcs',
  '.sbbbbbbbbbbccs',
  '.sbbbbbbbbbccs.',
  '..sbbbbbbbccs..',
  '...sbbbbbccs...',
  '....sbbbbcs....',
  '.....sbcs......',
  '......ss.......',
  '.....sbbs......',
  '.......k.......',
  '.......k.......',
  '......k........',
  '......k........',
  '.......k.......',
  '........k......',
]);

const MOON = grid([
  '.......mmmm.....',
  '.....mmhhhm.....',
  '...mmhwhhm......',
  '..mhhwhhm.......',
  '.mhhhhhm........',
  '.mhhchhm........',
  'mhhhchm.........',
  'mhhhhhm.........',
  'mhhhhhm.........',
  'mhhchhhm........',
  '.mhhcchm........',
  '.mhhhhhhm.......',
  '..mhhhhhhmmm....',
  '...mmhhhhhhhm...',
  '.....mmmmmmm....',
]);

const SNAKE_HEAD = grid([
  '....sssssss....',
  '..ssgghhhgggs..',
  '.sgghhwhgggggs.',
  'sgggghhggskggs.',
  'sgggggggggkgggs',
  'syygggggggggggsrr',
  '.syyyyyggggggs.r.r',
  '..ssyyyyyyyss..',
  '....sssssss....',
]);
const SNAKE_BODY = grid(['..sssss..', '.sgghggs.', 'sgghhgggs', 'sgyyggygs', 'sgggggggs', '.syyyyys.', '..sssss..']);
const SNAKE_TAIL = grid(['.sss.', 'sghgs', 'sgygs', '.sss.']);

const koi = (tail: 'a' | 'b') => grid([
  '..........sssss.........',
  '........ssrrrrrss.......',
  tail === 'a' ? 'ss....ssrrwwwwwrrss.....' : '......ssrrwwwwwrrss.....',
  tail === 'a' ? 'sos..swwwwwwwwwwwwwss...' : '.ss..swwwwwwwwwwwwwss...',
  tail === 'a' ? 'soosswwwrrrwwwwwwkwwss..' : 'sooosswwrrrwwwwwwkwwss..',
  '.sooowwrrrrrwwwwwwwhwws.',
  tail === 'a' ? 'soosswwwrrwwwwwwwwwwss..' : 'sooosswwwrrwwwwwwwwwss..',
  tail === 'a' ? 'sos..sswwwwwwwwwwwwss...' : '.ss..sswwwwwwwwwwwwss...',
  tail === 'a' ? 'ss.....ssooooooooss.....' : '.......ssooooooooss.....',
  '.........sssssss........',
]);

const CRYSTAL = grid(sym([
  '......s', '.....sw', '....shw', '...shhb', '..shhbb', '.shhbbb', 'sssssss',
  'svvvbbb', '.svvvbb', '..svvvb', '...svvb', '....svb', '.....sv', '......s',
], { h: 'b', b: 'c', w: 'h', v: 'p' }));

const frog = (pose: 'sit' | 'leap') => grid(pose === 'sit' ? sym([
  '...sss..', '..swkws.', '..skkks.', '..swwwss', '.sgggggg', 'sghhgggg', 'sghgpggg', 'sgggggss', '.sgggsyy', 'sggsyyyy', 'sgsyyyyy', 'sggsyyyy', '.sgggsss', 'sgg.sggg', 'ssss.sss',
], { h: 'g', g: 'd', w: 'w', k: 'k' }) : sym([
  '...sss..', '..swkws.', '..skkks.', '..swwwss', '.sgggggg', 'sghhgggg', 'sghgpggg', '.sggggss', '..sggsyy', '...sgyyy', '..sggsyy', '.sgg.sgg', 'sgg...sg', 'ss.....s', '........',
], { h: 'g', g: 'd', w: 'w', k: 'k' }));

const BUTTERFLY = grid([
  '.sss...........sss.',
  'shhhs..k...k..shhhs',
  'sppphs..k.k..shppps',
  'spooohs..k..shooops',
  'spooohhs.k.shhooops',
  'spooohhhskshhhooops',
  '.spoohhhskshhhoops.',
  '..sppohhskshhopps..',
  '...sspphskshppss...',
  '..sppoosskssoopps..',
  '.sphooohskshooohps.',
  '.sphooohs.shooohps.',
  '..sphhhs...shhhps..',
  '...ssss.....ssss...',
]);
const BUTTERFLY_CLOSED = grid([
  '...................',
  '.......k...k.......',
  '.....ss.k.k.ss.....',
  '....shhs.k.shhs....',
  '....sphhsksshps....',
  '....spohskshops....',
  '.....sohskshos.....',
  '.....sphskshps.....',
  '......shskshs......',
  '.....sphskshps.....',
  '.....sohskshos.....',
  '.....sphs.shps.....',
  '......shs.shs......',
  '.......s...s.......',
]);

/**
 * The first charm's arc, adapted from noceremony's rainbow: every grid cell asks which band its centre falls in, so
 * bands keep one thickness all the way round instead of staircasing.
 */
function rainbowWithClouds(): string[] {
  const bands = ['r', 'o', 'y', 'g', 'b', 'v'], outer = 15, cells = Array.from({ length: 24 }, () => Array<string>(46).fill('.'));
  for (let y = 0; y < outer; y++) for (let x = 0; x < outer * 2; x++) {
    const band = Math.floor(outer - Math.hypot(x - outer + 0.5, y - outer + 0.5));
    if (band >= 0 && band < bands.length) cells[y + 1]![x + 8] = bands[band]!;
  }
  const cloud = ['.......ssssss...........', '.....sswwwwwwss.........', '....swwwhhhwwws.........', '....swwhhhhwwwsssss.....', '..ssswwhhhhwwwwwwwwss...', '.swwwwwwwwwwwwwhhwwws...', 'swwwhhwwwwwwwwhhhhwwwss.', 'swwhhhhwwwwwwwwwwwwwwws.', 'swwwwwwwwwwwwwwwwwwwwws.', '.swwwwwwwwwwwwwwwwwwws..', '..sssscccccccccccssss...', '......sssssssssss.......'];
  for (const left of [0, 22]) cloud.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') cells[y + 12]![x + left] = c; }));
  return cells.map(r => r.join(''));
}

// ---- The collection's art ----------------------------------------------------------------------------------------

export const CHARM_ART: Readonly<Record<string, CharmArt>> = {
  fir: { pattern: FIR, pixel: 5, palette: { s: '#1b5a45', g: '#2fae6e', d: '#21845a', h: '#8ef0a6', y: '#ffc93a', w: '#fff6c2', r: '#ff5470', t: '#9a5f37', T: '#6d3f22' } },
  cup: { pattern: CUP, frames: [CUP, CUP_STEAM], pixel: 5, palette: { s: '#23407a', b: '#4a86ec', c: '#2f63c4', h: '#9cc4ff', w: '#eaf3ff', k: '#6b3b23', K: '#b4744a', m: '#c9bfb2' } },
  kite: { pattern: KITE, pixel: 5, palette: { s: '#a3372a', y: '#ffd35a', h: '#fff1c2', r: '#f2503a', o: '#ff9a3c', p: '#e6337a', t: '#7d5a44', b: '#39a7ff' } },
  beetle: { pattern: beetle('a'), frames: [beetle('a'), beetle('b')], pixel: 5, palette: { s: '#0f4a44', g: '#1fb893', d: '#128066', h: '#7bf5cf', w: '#eafff8', k: '#2c2a3a' } },
  letter: { pattern: LETTER, pixel: 5, palette: { s: '#8a5a2e', p: '#f8e6c2', c: '#e0bf87', d: '#c9a26a', h: '#fffbf1', r: '#ec3552', R: '#a8173a', w: '#ffc2cc' } },
  watch: { pattern: WATCH, pixel: 5, palette: { s: '#7a4a12', g: '#f5b92e', d: '#c9861a', h: '#fff1a8', f: '#fffaf0', k: '#3a2a2a', c: '#d8a53c' } },
  music: { pattern: MUSIC, pixel: 5, parts: { note: NOTE }, palette: { s: '#3e2a6b', v: '#8b62dc', V: '#6843b8', h: '#cdb6ff', g: '#ffcf4a', d: '#d19a1e', w: '#fff6c8', n: '#ff5fa8' } },
  fox: { pattern: fox('a'), frames: [fox('a'), fox('b')], pixel: 4, palette: { s: '#8a3312', o: '#ff7a1a', O: '#d9560a', w: '#fff4e6', k: '#2a1f1f' } },
  sparrow: { pattern: sparrow('up'), frames: [sparrow('up'), sparrow('down')], pixel: 4, palette: { s: '#5a3524', b: '#b8743f', c: '#7d4a28', h: '#f7dcae', k: '#1f1a1a', y: '#ffb02e' } },
  plane: { pattern: PLANE, pixel: 4, palette: { s: '#34539e', w: '#ffffff', c: '#d3e2ff', b: '#86aaf2' } },
  comet: { pattern: COMET, pixel: 5, palette: { h: '#ffe57a', w: '#fffdf0', b: '#4fb6ff', v: '#a268ff' } },
  snail: { pattern: SNAIL, pixel: 4, palette: { s: '#6b2f5e', p: '#ec64b0', P: '#b93d88', h: '#ffc0e4', b: '#ffd36e', B: '#dca23f', k: '#3a2233' } },
  balloon: { pattern: BALLOON, pixel: 5, palette: { b: '#ed7892', h: '#ffb7c3', w: '#fff0dc', c: '#cb526f', s: '#993f61', k: '#887286' } },
  moon: { pattern: MOON, pixel: 5, palette: { m: '#9b5fd7', h: '#fff0c4', w: '#ffffff', c: '#f7c864' } },
  snake: { pattern: SNAKE_HEAD, pixel: 4, parts: { body: SNAKE_BODY, tail: SNAKE_TAIL }, palette: { s: '#1b5a2a', g: '#58c95e', h: '#b9f78c', w: '#f2ffe0', y: '#ffd84a', k: '#1a1a22', r: '#ff4d6d' } },
  koi: { pattern: koi('a'), frames: [koi('a'), koi('b')], pixel: 4, palette: { s: '#a83414', o: '#ff7a2a', r: '#ff3d2e', w: '#fff6ea', h: '#ffd4ac', k: '#1f1a1a' } },
  crystal: { pattern: CRYSTAL, pixel: 5, palette: { s: '#284b9c', w: '#ffffff', h: '#aef3ff', b: '#4fd2ff', c: '#2a95e6', v: '#b27dff', p: '#8a4fe6' } },
  frog: { pattern: frog('sit'), frames: [frog('sit'), frog('leap')], pixel: 5, palette: { s: '#1f6b2e', g: '#62d85a', d: '#3ea83f', h: '#b8ff8a', w: '#ffffff', k: '#1a1a22', p: '#ff8fb1', y: '#efffb0' } },
  butterfly: { pattern: BUTTERFLY, frames: [BUTTERFLY, BUTTERFLY_CLOSED], pixel: 4, palette: { o: '#f28410', p: '#f5bb3b', h: '#fff0c9', k: '#614552', s: '#614552' } },
  rainbow: { pattern: rainbowWithClouds(), pixel: 4, palette: { h: '#fffdf4', w: '#f1f4fc', s: '#648bc3', c: '#a5c5e8', r: '#f64c71', o: '#f59846', y: '#f6cf58', g: '#5bc281', b: '#388eef', v: '#9b5fd7' } },
};
