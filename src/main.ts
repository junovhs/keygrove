import { lessonExercises, type LessonExercise, type SlotPick } from './curriculum/lesson-flow';
import { nextPractice } from './engine/next-practice';
import { briefingFor, type BriefIcon, type Briefing } from './curriculum/briefings';
import { fingerPractice, completeFingerPractice, type FingerPractice } from './engine/finger-practice';
import { fingerLevels, fingerCourseId, FINGER_PAIRS, pairCompleted, FINGER_PASS_ACC, type FingerPair } from './curriculum/finger-course';
import { MAIN_TRAILS, trailById, allowedChars, gateFor, groveOf, resolveCopy, trailsInGrove, type StageName, type Trail } from './curriculum';
import { fingers, fingerById, fingerForKey, remedialText, type Finger } from './curriculum/fingers';
import { METHODS, RELAXED_QWERTY, TRADITIONAL, activeMethod, baseKey, fingerOf, isShifted, reassignedKeys, setMethod } from './curriculum/method';
import { KeyModel, MASTERED } from './engine/keymodel';
import { TransitionModel } from './engine/transitions';
import { decide, sessionReview, type Decision } from './engine/coach';
import { classifyRun, rollTally } from './engine/errors';
import { applyRun, currentStage, currentTrail, exerciseIndex, focusKeys, isCleared, pathIndex, pathLength, progressOf, type Outcome } from './engine/progress';
import { Run } from './engine/run';
import { recordPerformance } from './engine/learning';
import { courseComplete, keepsakeFor, ownedKeepsakes } from './engine/keepsakes';
import { objectArt, collectionHtml } from './ui/scene';
import './ui/journey.css';
import { generate, generateDrill } from './engine/textgen';
import { clear as clearStored, fresh, load, loadGuest, saveGuest, sanitize, save as persist, type SaveV6 } from './state/save';
import { $, escapeHtml, toast } from './ui/dom';
import { createAccount } from './ui/account';
import { createProgressSync, type SyncStatus } from './state/progress-sync';
import { hasStoredSession, shippedConfig } from './state/supabase';
import { mountPanel, type PanelHandle } from 'dopedocs/panel';
import { docs } from './docs-content';
import './docs.css';
import { renderMap } from './ui/map';
import { sound, wireAudioToggle, type CueName } from './ui/sound';
import { loadHands, onFingerHover, paintHand } from './ui/hands';
import { CanvasPrompt } from './render/prompt';
import { selfTest as textflowSelfTest } from './render/textflow';

/** What the current run is for: the trail itself, a finger drill, or a coach drill (confusion / reach / review). */
type Mode = { kind: 'trail' } | { kind: 'remedial'; pair: FingerPair; level: number } | { kind: 'coach'; decision: Decision } | { kind: 'explore'; key: string };

// Guests have a separate durable save. Account state never leaks into a
// signed-out session; first signup carries the current guest course forward.
const accountService = shippedConfig();
let signedIn = accountService !== null && hasStoredSession(accountService);
let state: SaveV6 = signedIn ? load() : loadGuest();
if (!signedIn) clearStored();
setMethod(state.settings.method);
/** Keep the current course durable, including during an optional replay. */
function store(): void { const copy = replayReturn ? { ...state, trail: replayReturn } : state; if (signedIn) persist(copy); else saveGuest(copy); }
let keys = KeyModel.fromJSON(state.keys, state.confusions);
let trans = TransitionModel.fromJSON(state.transitions);
let mode: Mode = { kind: 'trail' };
let run = new Run('');
let outcome: Outcome | null = null;
let practice: FingerPractice | null = null;
let fingerPassed = false;
/** Coach decisions for the run just finished: [0] may be required (blocks Continue). */
let decisions: Decision[] = [];
/** A required decision the player still has to act on before the next trail run. */
let gate: Decision | null = null;
let replayReturn: string | null = null;
let completionHome = false;
let runTrail = currentTrail(state);
let runStage: StageName = 'drill';
/** Slot 2's target for the lesson in progress, chosen once so it holds across the lesson's exercises (spec D5). */
let slotPick: { trail: string; pick: SlotPick | null } | null = null;
const pickFor = (t: Trail): SlotPick | undefined => {
  if (!slotPick || slotPick.trail !== t.id) slotPick = { trail: t.id, pick: nextPractice(trans, new Set([...allowedChars(t)].filter((k) => k.length === 1 && k === k.toLowerCase())), Date.now()) };
  return slotPick.pick ?? undefined;
};
let runExercise: LessonExercise = lessonExercises(runTrail, pickFor(runTrail))[0]!;
let runExerciseIndex = 0;
let beforeMastery: Record<string, number> = {};
/** The briefing being read before this run, if any; `seenBriefs` keeps each exercise to one briefing per session. */
let brief: { briefing: Briefing; step: number; pressed: Set<string> } | null = null;
const seenBriefs = new Set<string>();
let helpVisible = true;
const guided = () => mode.kind === 'explore' || (mode.kind === 'trail' && runExercise.assessment === 'guided');
const actionable = (d: Decision) => !['rushing', 'fatigue', 'steady', 'reach'].includes(d.kind);
const courseFrontier = () => MAIN_TRAILS.find(t => !isCleared(state, t.id)) ?? MAIN_TRAILS.at(-1)!;

const now = () => performance.now();
const arena = () => $('arena');
const settingsModal = () => $('settingsModal');
const trail = (): Trail => currentTrail(state);
const stageName = () => currentStage(state, keys);
const fingerLevel = () => mode.kind === 'remedial' ? fingerLevels(fingerById(mode.pair.sides[0])!)[mode.level]! : null;
const practiceAllowed = () => mode.kind === 'remedial' || guided() ? new Set(run.text) : allowedChars(runTrail);
const focusPair = (): FingerPair | null => (mode.kind === 'remedial' ? mode.pair : null);

function save(): void { const j = keys.toJSON(); state.keys = j.keys; state.confusions = j.confusions; state.transitions = trans.toJSON(); store(); sync.wrote(); }
/** Account adoption resets the active passage so strokes from two accounts never mix. */
function adopt(next: SaveV6): void {
  state = next; keys = KeyModel.fromJSON(state.keys, state.confusions); trans = TransitionModel.fromJSON(state.transitions); slotPick = null; gate = null; replayReturn = null; setMethod(state.settings.method); store(); syncSettingsUi();
  mode = { kind: 'trail' }; resetRun(); if (courseComplete(state)) showCompletion();
}

const unlockedLetters = () => [...allowedChars(trail())].filter((k) => k.length === 1 && k !== ' ' && k === k.toLowerCase());
const dueNow = () => new Set(keys.dueKeys([...allowedChars(trail())].filter((k) => k.length === 1 && k !== ' ' && k === k.toLowerCase()), Date.now()));
function makeText(): string {
  const allowed = allowedChars(trail());
  if (mode.kind === 'explore') return mode.key === ' ' ? '   ' : mode.key.repeat(2) + ' ' + mode.key.repeat(2);
  if (mode.kind === 'remedial') { practice = fingerPractice(mode.pair, mode.level, state.fingerCourses, { known: new Set(MAIN_TRAILS.filter(t => isCleared(state, t.id)).flatMap(t => [...t.newKeys])) }); return practice.text; }
  if (mode.kind === 'coach') {
    const d = mode.decision;
    if (d.kind === 'remedial') { const f = fingerForKey(d.keys[0] ?? 'f'); return f && 'keys' in f ? remedialText(f, allowed, 30) : generate(trail(), 'drill'); }
    return generateDrill(d.kind === 'confusion' ? 'confusion' : d.kind === 'reach' ? 'reach' : d.kind === 'transition' ? 'transition' : 'review', d.keys, trail());
  }
  return generate(trail(), stageName(), { exercise: runExercise, heat: keys.heatMap(Date.now(), dueNow()), pairHeat: trans.heatMap(unlockedLetters()), weakPairs: trans.weakest(unlockedLetters()).filter((w) => w.mastery < 0.6).slice(0, 8).map((w) => w.pair) });
}
function resetRun(): void {
  completionHome = false;
  $('result').querySelector<HTMLElement>('.score')!.hidden = false;
  runTrail = trail(); runStage = stageName();
  runExerciseIndex = exerciseIndex(state); runExercise = lessonExercises(runTrail, pickFor(runTrail))[runExerciseIndex]!;
  beforeMastery = Object.fromEntries([...allowedChars(runTrail)].map(k => [k.toLowerCase(), keys.mastery(k)]));
  practice = null; fingerPassed = false;
  helpVisible = mode.kind !== 'trail' || runExercise.guidance !== 'on-demand';
  run = new Run(makeText()); outcome = null; decisions = [];
  $('nextAction').textContent = 'Continue';
  $('skipPractice').hidden = mode.kind === 'trail';
  $('skipPractice').textContent = 'Back to my course';
  document.body.classList.remove('showing-result');
  arena().classList.remove('result-mode', 'focus-mode'); endBrief(); render(); $('lessonTitle').focus();
  if (mode.kind === 'trail') openBrief();
}
/** Switch into a coach drill (required or accepted offer). */
function startCoach(d: Decision): void { mode = { kind: 'coach', decision: d }; resetRun(); toast(d.title); }

// ---- rendering -------------------------------------------------------------
function header(): void {
  const t = runTrail, g = groveOf(t);
  if (mode.kind === 'explore') {
    $('route').innerHTML = ''; $('lessonNo').textContent = 'Your whole keyboard'; $('modeLabel').textContent = 'Guided exploration'; return;
  }
  if (mode.kind === 'remedial') {
    const selected = mode;
    $('route').innerHTML = fingerLevels(fingerById(selected.pair.sides[0])!).map((_, i) => '<i class="' + (i === selected.level ? 'current' : i < pairCompleted(state.fingerCourses, selected.pair) ? 'done' : '') + '"></i>').join('');
    $('lessonNo').textContent = `Level ${mode.level + 1} of 10`;
    $('modeLabel').textContent = mode.pair.name + ' course';
    return;
  }
  $('route').innerHTML = trailsInGrove(g.id).map(x => '<i class="' + (x.id === t.id ? 'current' : isCleared(state, x.id) ? 'done' : '') + '"></i>').join('');
  $('lessonNo').textContent = `Lesson ${pathIndex(t)} of ${pathLength(t)} · Exercise ${runExerciseIndex + 1}/${lessonExercises(t).length}`;
  $('modeLabel').textContent = mode.kind === 'trail' ? `${g.name} · Chapter ${g.n}` : 'A little practice';
}
function labels(): void {
  const t = runTrail, g = groveOf(t), f = focusPair();
  $('lessonTitle').textContent = f ? f.name + ' · ' + fingerLevel()!.name : mode.kind === 'coach' ? mode.decision.title : t.name;
  $('lessonCopy').textContent = f ? fingerLevel()!.instruction + (practice?.helperKeys.length ? ` New helper keys: ${practice.helperKeys.join(' ').toUpperCase()}. Try their short introduction first; the hand guide shows which fingers to use.` : '') : mode.kind === 'coach' ? mode.decision.reason : resolveCopy(runExercise.instruction);
  $('summaryLabel').textContent = replayReturn ? 'A familiar place' : 'This passage';
  $('focusName').textContent = mode.kind === 'trail' ? replayReturn ? 'Replay · your course is waiting' : `${runExerciseIndex + 1}/${lessonExercises(t).length} · ${runExercise.name}` : 'Short practice · then your course';
  $('gateLabel').textContent = mode.kind !== 'trail' ? 'No test here' : t.checkpoint ? 'Chapter passage' : 'Accuracy before speed';
  $('focusInstruction').textContent = mode.kind === 'trail' ? `${t.checkpoint ? 97 : gateFor(t).passAcc}% accuracy · at your pace` : 'No passing score · just a little familiarity';
  if (f) {
    $('focusName').textContent = 'Practice adapts to the movements that need attention';
    $('gateLabel').textContent = 'Accuracy before speed';
    $('focusInstruction').textContent = `${FINGER_PASS_ACC}% for each finger · at your pace`;
  }
  if (guided()) {
    $('gateLabel').textContent = 'Guided · no score';
    $('focusInstruction').textContent = 'Try each movement slowly. Pauses and corrections are welcome.';
  }
  if (mode.kind === 'explore') {
    $('lessonTitle').textContent = 'Meet ' + (mode.key === ' ' ? 'Space' : mode.key.toUpperCase());
    $('lessonCopy').textContent = 'Choose any key below. The guide shows its finger. Press lightly; let your hand adjust comfortably.';
    $('focusName').textContent = 'A small movement, at your pace';
  }
  $('exploreKeyboard').textContent = mode.kind === 'explore' ? 'Back to my lesson' : 'Explore the keyboard';
  $<HTMLButtonElement>('exploreKeyboard').disabled = run.status === 'playing' && mode.kind !== 'explore';
  $('guideToggle').hidden = guided() || !!brief;
  $('guideToggle').textContent = helpVisible ? 'Hide finger hints' : 'Show finger hints';
  $('guideToggle').setAttribute('aria-pressed', String(helpVisible));
  $('skipGuided').hidden = mode.kind !== 'trail' || !guided() || !!brief;
  $('beginCue').classList.toggle('gone', run.status !== 'idle' || !!brief);
  $('beginCue').textContent = mode.kind === 'trail' ? 'Begin typing when you\'re ready · any key' : 'Begin typing when you\'re ready · a short practice';
}
const useDom = new URLSearchParams(location.search).get('dom') === '1';
const canvasPrompt: CanvasPrompt | null = useDom ? null : new CanvasPrompt($('prompt'), { theme: 'light', compact: true, orb: false });
function prompt(): void {
  if (canvasPrompt) { canvasPrompt.set({ text: run.text, pos: run.pos, wrong: run.wrong, reading: (mode.kind === 'remedial' ? mode.level >= 3 : runStage === 'words') && run.text.length > 50 }); return; }
  const p = $('prompt'); p.innerHTML = '';
  [...run.text].forEach((c, i) => {
    const s = document.createElement('span');
    s.textContent = c === ' ' ? 'SPACE' : c;
    s.className = 'ch' + (c === ' ' ? ' space' : '') + (i < run.pos ? ' done' : '') + (i === run.pos ? ' current' : '') + (i === run.pos && run.wrong ? ' wrong' : '');
    p.appendChild(s);
  });
  p.querySelector('.current')?.scrollIntoView({ block: 'nearest' });
}
function metrics(): { wpm: number; acc: number; pct: number } {
  const m = run.metrics(now());
  $('wpm').textContent = String(m.wpm); $('acc').textContent = guided() ? 'No score' : m.acc + '%'; $('pct').textContent = m.pct + '%';
  const combo = $('combo');
  if (combo.textContent !== String(run.combo)) { combo.textContent = String(run.combo); if (run.combo > 0 && run.combo % 10 === 0) { combo.classList.remove('tick'); void combo.offsetWidth; combo.classList.add('tick'); } }
  const fill = document.getElementById('progressFill'); if (fill) fill.style.width = m.pct + '%';
  return m;
}
let browseFinger: FingerPair['id'] = 'index';
let browseLevel = 0;
function startFingerLevel(): void {
  const f = FINGER_PAIRS.find(p => p.id === browseFinger);
  if (!f) return;
  if (replayReturn) { state.trail = replayReturn; replayReturn = null; }
  mode = { kind: 'remedial', pair: f, level: browseLevel };
  resetRun();
}
function focusGrid(): void {
  const grid = $('focusGrid');
  const f = FINGER_PAIRS.find(p => p.id === browseFinger)!;
  const completed = pairCompleted(state.fingerCourses, f);
  const inProgress = (level: number) => f.sides.some(id => (state.fingerCourses[fingerCourseId(id)] ?? 0) > level);
  const levels = fingerLevels(fingerById(f.sides[0])!), selected = levels[browseLevel]!;
  grid.innerHTML = '<div class="finger-picker" aria-label="Choose fingers to practice">' + FINGER_PAIRS.map(x => {
    const count = pairCompleted(state.fingerCourses, x);
    return `<button class="focus-key ${x.id === f.id ? 'active' : ''}" data-focus="${x.id}" aria-pressed="${x.id === f.id}"><strong>${escapeHtml(x.name)}</strong><span>${count}/10 complete</span></button>`;
  }).join('') + '</div>'
    + `<div class="finger-course-layout"><section class="finger-overview" aria-labelledby="fingerCourseTitle"><span class="eyebrow">${completed === 10 ? 'Course complete' : 'Your finger course'}</span><h3 id="fingerCourseTitle">${escapeHtml(f.name)}</h3><div class="finger-progress"><span style="width:${completed * 10}%"></span></div><div class="finger-progress-label">${completed} of 10 levels complete</div><div class="finger-selected"><span class="eyebrow">Selected · Level ${browseLevel + 1}</span><h4>${escapeHtml(selected.name)}</h4><p>${escapeHtml(selected.instruction)}</p></div><button class="finger-start" id="startFingerLevel">${browseLevel < completed ? 'Replay' : completed || inProgress(browseLevel) ? 'Continue' : 'Start'} level ${browseLevel + 1} <span aria-hidden="true">→</span></button><small class="finger-target">95% for each finger · No speed target</small></section>`
    + '<section class="finger-level-section" aria-labelledby="fingerLevelsTitle"><div class="finger-level-heading"><h3 id="fingerLevelsTitle">Your 10 levels</h3><span>Choose a level to practice</span></div><div class="finger-levels">'
    + levels.map((l,i) => `<button class="finger-level ${i === browseLevel ? 'selected' : ''} ${i < completed ? 'completed' : ''}" data-level="${i}" aria-pressed="${i === browseLevel}" ${i > completed ? 'disabled' : ''}><span class="finger-level-number">${String(i+1).padStart(2,'0')}</span><span class="finger-level-body"><strong>${escapeHtml(l.name)}</strong><small>${i < completed ? '✓ Complete · Replay available' : i === completed ? inProgress(i) ? 'In progress · Practice adapts to you' : 'Ready to start' : 'Locked · Complete level ' + i}</small></span>${i === browseLevel ? '<span class="finger-selected-mark">Selected</span>' : ''}</button>`).join('')
    + '</div></section></div>';
  grid.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(b => b.onclick = () => { browseLevel = Number(b.dataset.level); focusGrid(); grid.querySelector<HTMLButtonElement>(`[data-level="${browseLevel}"]`)?.focus(); });
  grid.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(b => b.onclick = () => chooseFocus(b.dataset.focus!));
  $('startFingerLevel').onclick = startFingerLevel;
}
/** Badges above the hands: the active finger shows the key it is being asked for; the rest show their home keys. */
function badges(active: Partial<Record<string, string>>): void {
  document.querySelectorAll<HTMLElement>('[data-finger-label]').forEach((x) => {
    const id = x.dataset.fingerLabel!, key = active[id];
    x.classList.toggle('active', key !== undefined);
    x.textContent = (key ?? fingerById(id)?.anchor ?? x.textContent ?? '').toUpperCase();
  });
}
function nextVisual(): void {
  if (brief) { paintBrief(); return; }
  if (!helpVisible && !guided() && run.status !== 'complete') {
    badges({}); paintHand('left', null); paintHand('right', null);
    $('handInstruction').textContent = 'Prepare the next movement. Finger hints are here whenever you want them.'; $('nextCue').textContent = ''; return;
  }
  const c = run.current, f = fingerForKey(c);
  badges(f && 'anchor' in f && c !== ' ' ? { [f.id]: baseKey(c) } : {});
  const shifted = isShifted(c);
  if (c === ' ') {
    paintHand('left', 'thumb'); paintHand('right', 'thumb');
    $('handInstruction').innerHTML = 'Press with either thumb.';
  } else if (f) {
    paintHand('left', f.id); paintHand('right', f.id);
    const shiftNote = shifted && 'hand' in f ? ` · hold ${f.hand === 'left' ? 'right' : 'left'} shift` : '';
    const anchor = 'anchor' in f && f.anchor !== c.toLowerCase() ? ` · landmark ${f.anchor.toUpperCase()}` : '';
    $('handInstruction').innerHTML = '<strong>' + escapeHtml(f.full) + '</strong>' + escapeHtml(anchor + shiftNote);
  } else {
    paintHand('left', null); paintHand('right', null);
    $('handInstruction').innerHTML = run.status === 'complete' ? 'Run complete.' : 'Let your hands rest comfortably.';
  }
  $('nextCue').textContent = '';
}
/** Key pitch (cap + gap) measured from the number row, so the stagger tracks every responsive cap size. */
function measurePitch(): void {
  const [a, b] = $('keymap').querySelectorAll<HTMLElement>('.keyrow:first-child .keycap');
  const u = a && b ? b.getBoundingClientRect().left - a.getBoundingClientRect().left : 0;
  if (u > 0) $('keymap').style.setProperty('--u', `${u}px`);
}
window.addEventListener('resize', measurePitch);
function keymap(): void {
  const c = baseKey(run.current), shifted = isShifted(run.current);
  const focused = new Set([...practiceAllowed()].map(baseKey));
  const homes = new Set('fj');
  const rows = ['`1234567890-=', 'qwertyuiop[]\\', "asdfghjkl;'", 'zxcvbnm,./'];
  const cap = (k: string): string => {
    const hot = (helpVisible || guided()) && c === k;
    const classes = `keycap ${homes.has(k) ? 'home ' : ''}${focused.has(k) ? 'familiar ' : ''}${hot ? 'hot' : ''}${k === ' ' ? ' spacebar' : ''}`;
    const label = k === ' ' ? 'SPACE' : hot && shifted ? run.current : k.toUpperCase();
    return mode.kind === 'explore'
      ? `<button type="button" class="${classes}" data-key="${escapeHtml(k)}" aria-label="Explore ${escapeHtml(k === ' ' ? 'Space' : k.toUpperCase())}">${escapeHtml(label)}</button>`
      : `<span class="${classes}" data-key="${escapeHtml(k)}">${escapeHtml(label)}</span>`;
  };
  // Real ANSI stagger, in key pitch from the backtick's left edge: Tab 1.5u, Caps 1.75u, Shift 2.25u.
  const stagger = [0, 1.5, 1.75, 2.25];
  $('keymap').innerHTML = rows.map((r, i) => `<div class="keyrow" style="--row-offset:calc(var(--u, 0px) * ${stagger[i]})">${[...r].map(cap).join('')}</div>`).join('')
    + `<div class="keyrow"><span class="keycap shiftcap ${(helpVisible || guided()) && shifted && fingerForKey(run.current)?.id.startsWith('r') ? 'hot' : ''}">⇧</span>${cap(' ')}<span class="keycap shiftcap ${(helpVisible || guided()) && shifted && fingerForKey(run.current)?.id.startsWith('l') ? 'hot' : ''}">⇧</span></div>`;
  measurePitch();
  $('keymap').querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
    el.onpointerenter = () => peekKey(el.dataset.key!); el.onpointerleave = () => peekKey(null);
    if (mode.kind === 'explore') el.onclick = () => { mode = { kind: 'explore', key: el.dataset.key! }; resetRun(); };
  });
}
/** Hovering a keycap paints its finger; hovering a finger lights its keys. Null restores the live state. */
function peekKey(k: string | null): void {
  if (k === null) { nextVisual(); return; }
  const f = fingerForKey(k);
  badges({});
  if (!f) return;
  paintHand('left', f.id); paintHand('right', f.id);
  if ('anchor' in f && k !== ' ') badges({ [f.id]: k });
}
function peekFinger(id: string | null): void {
  $('keymap').querySelectorAll('.keycap.peek').forEach((x) => x.classList.remove('peek'));
  if (id === null) { nextVisual(); return; }
  const f = fingerById(id);
  paintHand('left', id); paintHand('right', id);
  const keys = id === 'thumb' ? [' '] : f ? [...f.keys] : [];
  $('keymap').querySelectorAll<HTMLElement>('[data-key]').forEach(el => { if (keys.includes(el.dataset.key!)) el.classList.add('peek'); });
}
onFingerHover(peekFinger);
function render(): void { header(); labels(); prompt(); metrics(); focusGrid(); keymap(); nextVisual(); if (brief) renderBrief(); }

// ---- briefing: a few steps before a lesson, read one at a time ------------------
const BRIEF_ICONS: Record<BriefIcon, string> = {
  hand: '<svg viewBox="0 0 24 24"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11m0-4a1.5 1.5 0 0 1 3 0v4m0-2a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L3 14.5a1.6 1.6 0 0 1 2.6-1.8L9 15.5"/></svg>',
  bumps: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M9 15.5h6"/><path d="M12 9.5v.01"/></svg>',
  anchor: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 13a7 7 0 0 0 14 0M3 13h4M17 13h4"/></svg>',
  feather: '<svg viewBox="0 0 24 24"><path d="M20 4c-6 0-11 3-13 9l-3 7 7-3c6-2 9-7 9-13Z"/><path d="M4 20 15 9"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
  space: '<svg viewBox="0 0 24 24"><path d="M4 10v4h16v-4"/><path d="M8 17h8"/></svg>',
  rhythm: '<svg viewBox="0 0 24 24"><path d="M3 12h3l2-6 3 12 3-9 2 3h5"/></svg>',
  stretch: '<svg viewBox="0 0 24 24"><path d="M12 20V6M8 10l4-4 4 4"/><path d="M6 20h12"/></svg>',
};
/** Open the lesson's briefing before its first exercise, once per lesson per session. */
function openBrief(): void {
  const briefing = briefingFor(runTrail);
  if (!briefing || seenBriefs.has(runTrail.id) || run.status !== 'idle') return;
  brief = { briefing, step: 0, pressed: new Set() };
  arena().classList.add('brief-mode');
  render();
  $('lessonTitle').focus();
}
/** Close the briefing. `read` marks it seen, so only a briefing the learner finished (or skipped) stays away on retries. */
function endBrief(read = false): void {
  if (!brief) return;
  if (read) seenBriefs.add(runTrail.id);
  if (briefTimer) { clearTimeout(briefTimer); briefTimer = null; }
  brief = null;
  arena().classList.remove('brief-mode');
  $('briefCard').hidden = true;
  $('keymap').querySelectorAll('.keycap.hot').forEach((x) => x.classList.remove('hot'));
}
let briefTimer: ReturnType<typeof setTimeout> | null = null;
const briefTip = () => brief?.briefing.tips[brief.step] ?? null;
/** A press step is waiting for keys the learner has not pressed yet. */
const briefWaiting = (): boolean => { const t = briefTip(); return !!t?.press && [...t.press].some((k) => !brief!.pressed.has(k)); };
function briefNext(): void {
  if (!brief || briefWaiting()) return;
  sound.play('step');
  if (brief.step + 1 < brief.briefing.tips.length) { brief.step++; brief.pressed = new Set(); renderBrief(); paintBrief(); return; }
  endBrief(true); render(); $('lessonTitle').focus();
}
/** A key pressed during a press step: fill its tile; when all are filled, show the check, wait a beat, move on. */
function briefPress(k: string): void {
  const t = briefTip();
  if (!brief || !t?.press || briefTimer) return;
  const key = k.toLowerCase();
  const tile = $('briefKeys').querySelector<HTMLElement>(`[data-brief-key="${key}"]`);
  if (!t.press.includes(key) || brief.pressed.has(key)) { const any = $('briefKeys').querySelector<HTMLElement>('.brief-key:not(.filled)'); any?.classList.remove('miss'); void any?.offsetWidth; any?.classList.add('miss'); sound.play('miss'); return; }
  brief.pressed.add(key);
  tile?.classList.add('filled');
  sound.play('fill', 1, 1 + brief.pressed.size * 0.08);
  paintHand('left', null); paintHand('right', null); paintBrief();
  if (!briefWaiting()) {
    $('briefKeys').insertAdjacentHTML('beforeend', '<span class="brief-check" role="img" aria-label="Done"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7"/></svg></span>');
    sound.play('complete');
    briefTimer = setTimeout(() => { briefTimer = null; briefNext(); }, 900);
  }
}
/** Light the step's keys and paint its fingers on the shared hand illustrations. */
function paintBrief(): void {
  if (!brief) return;
  const t = briefTip()!;
  const ks = [...(t.keys ?? runTrail.newKeys ?? 'fj')];
  // During a press step, only the keys still to press stay lit.
  const lit = t.press ? ks.filter((k) => !brief!.pressed.has(k)) : ks;
  $('keymap').querySelectorAll<HTMLElement>('[data-key]').forEach((el) => el.classList.toggle('hot', lit.includes(el.dataset.key!)));
  const perSide = (side: 'left' | 'right') => lit.map((k) => fingerOf(k)).find((f) => f === 'thumb' || f?.startsWith(side[0]!)) ?? null;
  paintHand('left', perSide('left')); paintHand('right', perSide('right'));
  // Each lit finger's badge shows the key it is being asked for (E above the middle finger, not its home D).
  const active: Partial<Record<string, string>> = {};
  for (const k of lit) { const f = fingerOf(k); if (f && f !== 'thumb' && !active[f]) active[f] = k; }
  badges(active);
  $('handInstruction').textContent = '';
}
function renderBrief(): void {
  if (!brief) return;
  const { briefing, step } = brief, t = briefTip()!, exs = lessonExercises(runTrail), last = step + 1 === briefing.tips.length;
  $('lessonTitle').textContent = 'Before you begin';
  $('lessonCopy').textContent = `${briefing.title} — ${briefing.lead}`;
  $('summaryLabel').textContent = 'This exercise'; $('focusName').textContent = `${runExerciseIndex + 1}/${exs.length} · ${runExercise.name}`;
  const nextEx = exs[runExerciseIndex + 1];
  $('gateLabel').textContent = 'Next up'; $('focusInstruction').textContent = nextEx ? `${runExerciseIndex + 2}/${exs.length} · ${nextEx.name}` : 'Lesson complete';
  $('briefCount').textContent = `${step + 1}/${briefing.tips.length}`;
  $('briefDots').innerHTML = briefing.tips.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('');
  $('briefIcon').innerHTML = BRIEF_ICONS[t.icon];
  $('briefTitle').textContent = t.title; $('briefText').textContent = resolveCopy(t.body);
  const keysEl = $('briefKeys'), next = $<HTMLButtonElement>('briefNext');
  if (t.press) {
    keysEl.hidden = false; next.hidden = true;
    keysEl.innerHTML = [...t.press].map((k) => `<span class="brief-key" data-brief-key="${escapeHtml(k)}">${escapeHtml(k === ' ' ? 'Space' : k.toUpperCase())}<small>${escapeHtml(resolveCopy(`{${k}}`))}</small></span>`).join('');
  } else {
    keysEl.hidden = true; keysEl.innerHTML = ''; next.hidden = false;
    $('briefNextLabel').textContent = last ? 'Start typing' : 'Next';
    $('briefNextHint').innerHTML = '<small>any key</small>';
  }
  const card = $('briefCard'); card.hidden = false; card.classList.remove('brief-fade'); void card.offsetWidth; card.classList.add('brief-fade');
}
$('briefNext').onclick = briefNext;

// ---- run lifecycle -----------------------------------------------------------
function begin(): void { if (run.status === 'playing') return; if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); run.begin(now()); sound.play('begin'); render(); }
function startMaintenance(): void {
  replayReturn = null;
  const focus = keys.weakest(unlockedLetters()).slice(0, 6).map(k => k.key);
  startCoach({ kind: 'review', required: false, keys: focus, title: 'Keep it familiar', reason: 'A short passage with a few useful movements. Your course is complete; this is yours to use whenever it helps.' });
}
/** Completion is a lasting place to return to, not just a transient result. */
function showCompletion(): void {
  completionHome = true; run = new Run(''); outcome = null; decisions = []; gate = null;
  const k = keepsakeFor('flow');
  $('resultEyebrow').textContent = 'All seven chapters · yours to keep';
  $('resultTitle').textContent = 'Your course, complete.';
  $('resultCopy').textContent = 'From F and J to full passages. Your keepsakes and every lesson are here to revisit. Take these movements into your own writing, or settle in for a little practice.';
  $('resultMastery').textContent = `36 lessons complete · ${ownedKeepsakes(state).length} keepsakes`;
  $('resultOffer').hidden = true;
  $('result').querySelector<HTMLElement>('.score')!.hidden = true;
  $('resultObject').hidden = false;
  $('resultObject').innerHTML = `${objectArt(k)}<span class="eyebrow">Yours to keep</span><h3>${escapeHtml(k.name)}</h3><p>${escapeHtml(k.line)}</p>`;
  $('result').classList.add('with-object');
  arena().classList.remove('map-mode', 'focus-mode'); arena().classList.add('result-mode');
  document.body.classList.add('showing-result');
  $('nextAction').textContent = 'Keep my hands familiar'; $('skipPractice').hidden = true;
  $('resultTitle').focus();
}
function continueAfterResult(firstKey?: string): void {
  if (mode.kind === 'explore') { resetRun(); return; }
  if (mode.kind === 'remedial') {
    if (fingerPassed) mode.level = Math.min(9, mode.level + 1);
    resetRun(); return;
  }
  if (completionHome) { startMaintenance(); return; }
  if (courseComplete(state) && state.trail === 'flow-checkpoint' && !gate) {
    if (mode.kind !== 'trail' || replayReturn) { mode = { kind: 'trail' }; replayReturn = null; showCompletion(); } else startMaintenance();
    return;
  }
  if (mode.kind !== 'trail') { gate = null; mode = { kind: 'trail' }; }
  else if (gate) { const d = gate; gate = null; startCoach(d); return; }
  replayReturn = null;
  resetRun();
  if (firstKey !== undefined && !brief && firstKey === run.current) { begin(); typeKey(firstKey); }
}
function typeKey(k: string): void {
  const r = run.type(k, now());
  if (r === 'ignored') return;
  const last = run.strokes.at(-1)!;
  recordPerformance(run, keys, trans, Date.now(), guided() ? run.text.length : 0);
  if (last.correct || !guided()) canvasPrompt?.onKey(last.correct ? 'ok' : 'miss', last.correct ? run.pos - 1 : run.pos, last.key === ' ');
  // The keystroke tick rises a hair with the combo, so a clean run audibly warms up; a miss is a low shrug.
  if (!last.correct && !guided()) sound.play('miss');
  else if (last.correct && last.key === ' ') sound.play('word', 1, 1 + Math.min(run.combo, 40) * 0.004);
  else if (last.correct) sound.play('key');
  if (r === 'done') { canvasPrompt?.onComplete(); return finish(); }
  prompt(); metrics(); keymap(); nextVisual();
}
function abort(): void { if (run.status !== 'playing') return; sound.play('error'); toast('Run stopped.'); resetRun(); }

function thirds(): { errors: number; lat: number }[] {
  const st = run.strokes; const n = Math.max(1, Math.floor(st.length / 3));
  return [0, 1, 2].map((i) => { const part = st.slice(i * n, i === 2 ? st.length : (i + 1) * n); const ok = part.filter((x) => x.correct); return { errors: part.length - ok.length, lat: ok.length ? ok.reduce((a, x) => a + x.latencyMs, 0) / ok.length : 0 }; });
}
function finish(): void {
  const m = metrics(), t = runTrail, wasReplay = replayReturn !== null;
  let title = 'Practice complete.', copy = 'A little more familiarity to take into your next passage.';
  decisions = []; gate = null; if (!guided()) keys.endRun();
  const focus = focusKeys(t, keys);
  if (mode.kind === 'trail') {
    state.trail = t.id;
    outcome = applyRun(state, keys, { hits: run.hits, attempts: run.attempts, maxCombo: run.maxCombo, wpm: m.wpm, acc: m.acc, rhythm: run.rhythm(), now: Date.now(), stage: runStage });
    if (!guided()) {
      const p = progressOf(state, t.id);
      const unlocked = [...allowedChars(t)].filter(k => k === k.toLowerCase());
      const errors = classifyRun(run.text, run.strokes, activeMethod());
      state.errors = rollTally(state.errors, errors);
      const missedKeys = [...new Set(run.strokes.filter(s => !s.correct).map(s => s.key.toLowerCase()))];
      decisions = decide(keys, { thirds: thirds(), wpm: m.wpm, acc: m.acc, rhythm: run.rhythm(), runsOnTrail: p.runs, focusKeys: focus, unlocked, passed: outcome.passed, fails: p.fails, recentAcc: p.recent, errors, missedKeys, weakPairs: trans.weakest(unlocked) });
      // One bounded repair between course attempts. Timing alone never sends a player off course.
      if (!outcome.passed && !wasReplay && missedKeys.length && run.errors >= 3) gate = decisions.find(actionable) ?? { kind: 'precision', required: false, keys: missedKeys.slice(0, 3), title: 'A little room to settle', reason: `A short practice with ${missedKeys.slice(0, 3).map(k => k === ' ' ? 'Space' : k.toUpperCase()).join(' · ')}, then we will try the passage again.` };
    }
    if (wasReplay) { title = 'A familiar place, revisited.'; copy = 'Your next lesson is waiting right where you left it.'; state.trail = replayReturn!; }
    else if (outcome.firstClear && t.id === 'flow-checkpoint') { title = 'Look what your hands can do.'; copy = 'You completed all 36 lessons: letters, capitals, punctuation, numbers and a longer mixed passage. Keep using this in everyday writing. Fluency grows with use.'; }
    else if (outcome.firstClear && t.checkpoint) { title = `${groveOf(t).name}, complete.`; copy = keepsakeFor(t.grove).line + (outcome.nextTrail ? ` Next, ${groveOf(outcome.nextTrail).name}: ${resolveCopy(outcome.nextTrail.blurb ?? groveOf(outcome.nextTrail).blurb)}` : ' A small extra, made yours.'); }
    else if (outcome.firstClear) { title = 'Lesson complete.'; copy = `${t.name} is complete. ${outcome.nextTrail ? `Next: ${outcome.nextTrail.name}.` : 'The whole path is open.'}`; }
    else if (!outcome.passed) { title = 'Try this passage again.'; copy = `${gate ? 'A short practice will help with the missed keys, then we’ll try again.' : 'Take your time; there is no timer to beat.'}`; }
    else { title = 'Exercise complete.'; copy = `${outcome.exercise.index + 1} of ${outcome.exercise.total} complete. Next: ${outcome.exercise.nextName}.`; }
    copy = `${m.acc}% accuracy · ${t.checkpoint ? 97 : gateFor(t).passAcc}% needed. ${copy}`;
  }
  if (guided()) {
    title = 'A little more familiar.';
    copy = mode.kind === 'explore' ? 'Choose another key, repeat this movement, or return to your lesson. There is no score here.'
      : `Guided practice complete. Next: ${outcome?.exercise.nextName ?? 'your next lesson'}. Take this movement at whatever pace feels comfortable.`;
  }
  if (mode.kind === 'remedial' && practice) {
    const replay = pairCompleted(state.fingerCourses, mode.pair) > mode.level;
    fingerPassed = completeFingerPractice(state.fingerCourses, mode.pair, mode.level, practice, run).passed;
    title = replay ? 'Level revisited.' : fingerPassed ? mode.level === 9 ? `${mode.pair.name} course complete.` : 'Finger level complete.' : 'A little more practice here.';
    copy = fingerPassed
      ? mode.level === 9 ? 'All ten levels are yours to revisit whenever you like.' : 'Your progress is saved. Continue to the next level at your own pace.'
      : 'Some movements need another pass. Your next practice will focus on them; the progress you earned is saved.';
  }
  const newly = guided() ? [] : [...allowedChars(t)].filter(k => k === k.toLowerCase()).filter(k => keys.mastery(k) >= MASTERED && (beforeMastery[k] ?? 0) < MASTERED);
  $('resultMastery').textContent = newly.length ? `Settled this time: ${newly.map(k => k === ' ' ? 'Space' : k.toUpperCase()).join(' · ')}` : `${run.hits} characters typed · ${run.errors === 0 ? 'no missed keys' : `${run.errors} missed ${run.errors === 1 ? 'key' : 'keys'}`}`;
  if (guided()) $('resultMastery').textContent = 'Slow is welcome. Let your hands stay easy.';
  $('result').querySelector<HTMLElement>('.score')!.hidden = guided();
  const earned = outcome?.firstClear && t.checkpoint;
  const k = keepsakeFor(t.grove);
  $('resultObject').innerHTML = earned ? `${objectArt(k)}<span class="eyebrow">Yours to keep</span><h3>${escapeHtml(k.name)}</h3><p>${escapeHtml(k.line)}</p>` : '';
  $('resultObject').hidden = !earned;
  $('result').classList.toggle('with-object', !!earned);
  $('resultTitle').textContent = title; $('resultCopy').textContent = copy;
  $('resultWpm').textContent = String(m.wpm); $('resultAcc').textContent = m.acc + '%';
  $('resultOffer').hidden = !gate;
  $('resultOffer').textContent = gate ? `Up next: ${gate.title}. A short practice, then back here.` : '';
  $('resultEyebrow').textContent = t.id === 'flow-checkpoint' && outcome?.firstClear ? 'Course complete · Relaxed hands, capable fingers' : mode.kind === 'trail' ? `Passage complete · ${t.name}` : 'Practice complete';
  $('nextAction').textContent = gate ? 'Settle the tricky part' : wasReplay ? 'Back to my course' : mode.kind !== 'trail' ? 'Back to the passage' : courseComplete(state) && !outcome?.nextTrail ? 'Keep my hands familiar' : outcome?.passed ? `Next: ${outcome.exercise.nextName ?? trail().name}` : `Retry: ${t.name}`;
  $('skipPractice').hidden = !gate;
  $('skipPractice').textContent = 'Try the passage instead';
  if (mode.kind === 'remedial') {
    $('nextAction').textContent = !fingerPassed ? 'Continue practice' : mode.level === 9 ? 'Replay final level' : `Next: ${fingerLevels(fingerById(mode.pair.sides[0])!)[mode.level + 1]!.name}`;
    $('skipPractice').hidden = false; $('skipPractice').textContent = 'Back to my course';
  }
  if (mode.kind === 'explore') { $('nextAction').textContent = 'Try this key again'; $('skipPractice').hidden = false; $('skipPractice').textContent = 'Back to my lesson'; }
  // The result's chime, a beat after the passage's own burst: the keepsake sparkle outranks a lesson clear outranks a pass.
  const chime: CueName = mode.kind === 'remedial' ? (fingerPassed ? 'complete' : 'settle') : earned ? 'sparkle' : outcome?.firstClear ? 'clear' : outcome?.passed ? 'complete' : 'settle';
  setTimeout(() => sound.play(chime), 260);
  save(); arena().classList.add('result-mode'); document.body.classList.add('showing-result');
  $('resultTitle').focus();
  header();
}

// ---- grove map ---------------------------------------------------------------------
let mapKeys: ((e: KeyboardEvent) => void) | null = null;
function openMap(showObjects = false): void {
  if (run.status === 'playing') resetRun();
  sound.play('open');
  arena().classList.remove('result-mode', 'focus-mode'); arena().classList.add('map-mode');
  document.body.classList.remove('showing-result'); document.body.classList.add('showing-book');
  mapKeys = renderMap($('groveMap'), state, keys, {
    onSelect: selectLesson,
    onClose: closeMap,
  });
  $('keepsakeCollection').innerHTML = collectionHtml(state);
  $('keepsakeCollection').querySelectorAll<HTMLButtonElement>('[data-replay]').forEach(b => b.onclick = () => selectLesson(trailById(b.dataset.replay!)));
  $('bookProgress').textContent = `${MAIN_TRAILS.filter(t => isCleared(state, t.id)).length} of 36 lessons complete · ${ownedKeepsakes(state).length} ${ownedKeepsakes(state).length === 1 ? 'keepsake' : 'keepsakes'}`;
  if (showObjects) { $('collectionTitle').tabIndex = -1; $('collectionTitle').focus(); $('collectionTitle').scrollIntoView({ block: 'start' }); }
}
function selectLesson(t: Trail): void { sound.play('select'); replayReturn = isCleared(state, t.id) ? courseFrontier().id : null; state.trail = t.id; mode = { kind: 'trail' }; gate = null; closeMap(); resetRun(); }
function closeMap(): void { sound.play('close'); arena().classList.remove('map-mode'); document.body.classList.remove('showing-book'); mapKeys = null; if (completionHome || run.status === 'complete') { arena().classList.add('result-mode'); document.body.classList.add('showing-result'); } else render(); $(completionHome || run.status === 'complete' ? 'resultTitle' : 'lessonTitle').focus(); }

// ---- focus / remedial ----------------------------------------------------------
function openFocus(): void {
  if (run.status === 'playing') { toast('Finish or reset before opening trouble-spot practice.'); return; }
  if (mode.kind === 'remedial') browseFinger = mode.pair.id;
  browseLevel = Math.min(9, pairCompleted(state.fingerCourses, FINGER_PAIRS.find(p => p.id === browseFinger)!));
  sound.play('open');
  arena().classList.remove('result-mode'); document.body.classList.remove('showing-result'); arena().classList.add('focus-mode'); focusGrid(); $('focusTitle').focus();
}
function closeFocus(): void { sound.play('close'); arena().classList.remove('focus-mode'); if (completionHome || run.status === 'complete') { arena().classList.add('result-mode'); document.body.classList.add('showing-result'); } else render(); }
function chooseFocus(id: string): void {
  const f = FINGER_PAIRS.find(p => p.id === id);
  if (!f) { closeFocus(); return; }
  browseFinger = f.id;
  browseLevel = Math.min(9, pairCompleted(state.fingerCourses, f));
  focusGrid();
  $('focusGrid').querySelector<HTMLButtonElement>(`[data-focus="${f.id}"]`)?.focus();
}
$('closeFingerCourses').onclick = closeFocus;
function sessionCheck(): void {
  if (!state.settings.reviewOn) return;
  const d = sessionReview(keys, unlockedLetters(), Date.now());
  if (d) startCoach(d);
}
// ---- input -----------------------------------------------------------------------
function handleFocusKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') { e.preventDefault(); closeFocus(); return; }
  if (e.key === ' ') { e.preventDefault(); chooseFocus('none'); return; }
  const f = fingers().find((x) => x.anchor === e.key.toLowerCase()); if (f) { e.preventDefault(); chooseFocus(FINGER_PAIRS.find(p => p.sides.includes(f.id as Exclude<Finger['id'], 'thumb'>))!.id); }
}
function handleIdleOrResult(e: KeyboardEvent): void {
  if (e.key === 'Enter') { e.preventDefault(); if (completionHome || run.status === 'complete') continueAfterResult(); else begin(); return; }
  if (e.key === 'Escape') { e.preventDefault(); if (run.status === 'complete') continueAfterResult(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1 || completionHome) return;
  e.preventDefault();
  // Any key moves on from a result and starts the next passage with that letter; the course-complete home alone waits for Enter.
  if (run.status === 'complete') { continueAfterResult(e.key === ' ' ? undefined : e.key); return; }
  if (run.status === 'idle') { begin(); typeKey(e.key); }
}
function trapDialog(e: KeyboardEvent, dialog: HTMLElement): void {
  if (e.key !== 'Tab') return;
  const bs = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([hidden]), a[href]')].filter(x => x.offsetParent !== null);
  const first = bs[0], last = bs.at(-1);
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
}
document.addEventListener('keydown', (e) => {
  if (settingsModal().classList.contains('open')) { trapDialog(e, settingsModal()); if (e.key === 'Escape') { sound.play('close'); settingsModal().classList.remove('open'); $('settingsTopBtn').focus(); e.preventDefault(); } return; }
  if (arena().classList.contains('map-mode')) { mapKeys?.(e); return; }
  if (e.target instanceof HTMLElement && e.target.closest('button,a,input,select,textarea,summary,[contenteditable]')) return;
  if (arena().classList.contains('focus-mode')) { handleFocusKey(e); return; }
  if (brief) {
    // Only the explicit steps advance: a briefing is meant to be read, so stray typing never skips it.
    // A press step listens for its own keys instead.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (briefTip()?.press && e.key.length === 1) { e.preventDefault(); briefPress(e.key); }
    else if (e.key === 'Escape') { e.preventDefault(); endBrief(true); render(); }
    // Any key advances a text step, so hands never have to leave the home row to reach Enter or the mouse.
    else if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key.length === 1) { e.preventDefault(); briefNext(); }
    return;
  }
  if (run.status === 'playing') {
    if (e.key === 'Escape') { e.preventDefault(); abort(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.key.length === 1) { e.preventDefault(); typeKey(e.key); }
    return;
  }
  handleIdleOrResult(e);
});
$('prompt').onclick = () => { if (run.status === 'idle' && !brief) begin(); };
$('focusNav').onclick = () => { if (arena().classList.contains('focus-mode')) closeFocus(); else openFocus(); };
$('guideToggle').onclick = () => { helpVisible = !helpVisible; labels(); keymap(); nextVisual(); $('lessonTitle').focus(); };
$('exploreKeyboard').onclick = () => {
  if (mode.kind === 'explore') mode = { kind: 'trail' };
  else { if (replayReturn) { state.trail = replayReturn; replayReturn = null; } mode = { kind: 'explore', key: 'f' }; }
  resetRun();
};
$('skipGuided').onclick = () => {
  if (mode.kind !== 'trail' || !guided()) return;
  applyRun(state, keys, { hits: 0, attempts: 0, maxCombo: 0, wpm: 0, acc: 0, rhythm: 0, now: Date.now() });
  save(); resetRun();
};
$('resetRunBtn').onclick = () => { if (run.status === 'playing') abort(); else resetRun(); };
$('lessonsNav').onclick = () => { if (arena().classList.contains('map-mode')) closeMap(); else openMap(); };
$('statsNav').onclick = () => openMap(true);
$('closeBook').onclick = closeMap;
$('skipPractice').onclick = () => { gate = null; mode = { kind: 'trail' }; replayReturn = null; if (courseComplete(state) && state.trail === 'flow-checkpoint') showCompletion(); else resetRun(); };
$('startBtn').onclick = () => { if (arena().classList.contains('map-mode')) { closeMap(); return; } if (brief) { briefNext(); return; } if (completionHome || run.status === 'complete') continueAfterResult(); else begin(); };
function showSettings(): void { sound.play('open'); settingsModal().classList.add('open'); $('closeSettings').focus(); }
$('settingsTopBtn').onclick = showSettings;
$('closeSettings').onclick = () => { sound.play('close'); settingsModal().classList.remove('open'); };
settingsModal().onclick = (e) => { if (e.target === settingsModal()) settingsModal().classList.remove('open'); };
// ---- Method: Traditional by default (DEC-12); Settings toggles to Relaxed QWERTY and back --------
function switchMethod(methodId: string): void {
  if (state.settings.method !== methodId) {
    // Only the reassigned keys need fresh evidence. Earned chapters stay earned.
    const moved = reassignedKeys(activeMethod(), METHODS.find((m) => m.id === methodId) ?? activeMethod());
    const j = keys.toJSON();
    for (const k of moved) delete j.keys[k];
    for (const pair of Object.keys(state.transitions)) if ([...pair].some(k => moved.includes(k))) delete state.transitions[pair];
    keys = KeyModel.fromJSON(j.keys, j.confusions); trans = TransitionModel.fromJSON(state.transitions); slotPick = null;
  }
  state.settings.method = methodId; state.settings.onboarded = true; setMethod(methodId); save(); syncSettingsUi();
  mode = { kind: 'trail' }; resetRun(); toast(`Method: ${activeMethod().name}`);
}
$('methodBtn').onclick = () => switchMethod(activeMethod().id === RELAXED_QWERTY.id ? TRADITIONAL.id : RELAXED_QWERTY.id);

$('codeBtn').onclick = () => { state.settings.codeGrove = !state.settings.codeGrove; sound.play(state.settings.codeGrove ? 'toggle-on' : 'toggle-off'); save(); $('codeBtn').textContent = 'Code grove: ' + (state.settings.codeGrove ? 'on' : 'off'); toast(state.settings.codeGrove ? 'Code grove will appear after the Bark checkpoint.' : 'Code grove hidden.'); };
$('exportBtn').onclick = () => {
  save();
  const u = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })), a = document.createElement('a');
  a.href = u; a.download = 'keygrove-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
};
$('importBtn').onclick = () => $('importFile').click();
$<HTMLInputElement>('importFile').onchange = async (e) => {
  const input = e.target as HTMLInputElement;
  try {
    const f = input.files?.[0]; if (!f) return;
    applyImport(JSON.parse(await f.text()));
  } catch { toast('That backup could not be read.'); }
  input.value = '';
};
function applyImport(raw: unknown): void {
  state = sanitize(raw); keys = KeyModel.fromJSON(state.keys, state.confusions); trans = TransitionModel.fromJSON(state.transitions); slotPick = null; mode = { kind: 'trail' }; gate = null; replayReturn = null; setMethod(state.settings.method); save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); if (courseComplete(state) && state.trail === 'flow-checkpoint') showCompletion(); toast('Progress restored.');
}
$('resetBtn').onclick = () => {
  if (!confirm('Reset all your progress? Every lesson, keepsake and practice record will be gone' + (signedIn ? ' from your account too.' : '.'))) return;
  if (!confirm('Are you really, really sure? There is no undo.')) return;
  { state = fresh(); keys = new KeyModel(); trans = new TransitionModel(); mode = { kind: 'trail' }; gate = null; replayReturn = null; setMethod(state.settings.method); save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); toast('Fresh grove.'); } };
function syncSettingsUi(): void {
  $('codeBtn').textContent = 'Code grove: ' + (state.settings.codeGrove ? 'on' : 'off');
  $('methodBtn').textContent = 'Method: ' + activeMethod().name;
  setMethod(state.settings.method);
}
setInterval(() => { if (run.status === 'playing') metrics(); }, 450);

// The account is optional: a guest page never loads its service. While its
// panel is open it swallows every keydown in the capture phase, so the run
// and the shortcuts above never see a password being typed.
const sync = createProgressSync({
  read: () => { const j = keys.toJSON(); state.keys = j.keys; state.confusions = j.confusions; state.transitions = trans.toJSON(); return replayReturn ? { ...state, trail: replayReturn } : state; },
  write: adopt,
});
const guestHint = $('guestHint');
const showGuestHint = (): void => { guestHint.hidden = signedIn; };
const account = createAccount({
  announce: toast,
  onSession: (session, client) => {
    signedIn = session !== null;
    if (!signedIn) clearStored();
    showGuestHint();
    sync.session(session, client);
    if (signedIn) store();
  },
});
const syncNote = (s: SyncStatus): string => {
  switch (s.kind) {
    case 'off': return 'Saved on this browser. A new account keeps this course progress and syncs it across devices. Signing into an existing account opens its own progress.';
    case 'syncing': return 'Syncing your progress…';
    case 'synced': return `Progress synced · ${s.runs} run${s.runs === 1 ? '' : 's'} on this account. Sign in anywhere to continue.`;
    case 'unavailable': return s.reason === 'not-installed' ? 'Sync is not set up on the server yet; your progress stays on this device for now.'
      : s.reason === 'offline' ? 'Offline — your progress will sync when you are back.'
      : 'Sync is not reachable right now; your progress stays on this device until it is.';
  }
};
sync.onStatus((s) => account.setNote(syncNote(s)));

// About & docs: dopedocs owns the panel, its scrollspy and its /docs/<id> URLs;
// this only mounts it on first use (most sessions never open it) and points
// the brand mark at it. While it is open the run must not hear keys.
let docsPanel: PanelHandle | null = null;
const docsOpen = $<HTMLButtonElement>('docsOpen');
const ensureDocs = (): PanelHandle => docsPanel ??= mountPanel(document.body, docs, {
  navLabel: 'On this page',
  backLabel: 'Back to typing',
  onToggle(open) { docsOpen.setAttribute('aria-expanded', String(open)); if (!open) docsOpen.focus(); },
});
docsOpen.addEventListener('click', () => ensureDocs().open());
/** The brand mark always leads back to the lesson in progress. A run mid-passage is left alone. */
$('brandHome').onclick = () => {
  if (arena().classList.contains('map-mode')) closeMap();
  if (arena().classList.contains('focus-mode')) closeFocus();
  if (run.status === 'playing') return;
  if (mode.kind !== 'trail' || replayReturn || completionHome || run.status === 'complete') { mode = { kind: 'trail' }; replayReturn = null; gate = null; if (courseComplete(state) && state.trail === 'flow-checkpoint') showCompletion(); else resetRun(); }
  $('lessonTitle').focus();
};
document.addEventListener('keydown', (e) => { if (docsPanel?.isOpen && e.key !== 'Escape') e.stopImmediatePropagation(); }, { capture: true });

syncSettingsUi(); resetRun(); if (courseComplete(state) && state.trail === 'flow-checkpoint') showCompletion(); else sessionCheck(); save(); showGuestHint(); void loadHands(nextVisual);
state.settings.onboarded = true;
// Interface sounds: every button taps, navigation hovers a little brighter, the primary actions warmer, Reset darker.
wireAudioToggle($('soundBtn'));
sound.wire(
  (host) => (host.id === 'soundBtn' || host.closest('.keymap') ? null : 'tap'),
  (host) => host.closest('.nav') ? 'hover-nav' : host.classList.contains('danger') ? 'hover-danger' : (host.classList.contains('primary') || host.id === 'nextAction' || host.id === 'startBtn' || host.classList.contains('finger-start') || host.classList.contains('nav-cta')) ? 'hover-positive' : null,
);
const played: string[] = [];
sound.onPlay = (name) => { played.push(name); if (played.length > 200) played.shift(); };
Object.defineProperty(window, 'keygrove', {
  value: Object.freeze({
    snapshot: () => JSON.parse(JSON.stringify({ state, run: { text: run.text, pos: run.pos, status: run.status, hits: run.hits, attempts: run.attempts }, mode, exercise: runExercise, guided: guided(), helpVisible, outcome, decisions, gate, brief: brief ? { title: brief.briefing.title, step: brief.step, tip: brief.briefing.tips[brief.step]!.title } : null, offer: (gate ?? decisions[0]) ? { kind: (gate ?? decisions[0])!.kind } : null })),
    import: (raw: unknown) => applyImport(raw),
    openMap,
    selftest: textflowSelfTest,
    prompt: () => canvasPrompt,
    method: () => activeMethod().id,
    account: () => account.session()?.user.email ?? null,
    signedIn: () => signedIn,
    sounds: () => played.slice(),
    sound,
  }),
});
