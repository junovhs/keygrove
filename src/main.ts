import { fingerPractice, completeFingerPractice, type FingerPractice } from './engine/finger-practice';
import { fingerLevels, fingerCourseId, FINGER_PAIRS, pairCompleted, FINGER_PASS_ACC, type FingerPair } from './curriculum/finger-course';
import { MAIN_TRAILS, trailById, allowedChars, gateFor, groveOf, resolveCopy, trailsInGrove, type StageName, type Trail } from './curriculum';
import { fingers, fingerById, fingerForKey, remedialText, type Finger } from './curriculum/fingers';
import { METHODS, RELAXED_QWERTY, TRADITIONAL, activeMethod, baseKey, isShifted, setMethod } from './curriculum/method';
import { KeyModel, MASTERED } from './engine/keymodel';
import { TransitionModel } from './engine/transitions';
import { decide, sessionReview, type Decision } from './engine/coach';
import { classifyRun, rollTally } from './engine/errors';
import { applyRun, currentStage, currentTrail, focusKeys, isCleared, pathIndex, pathLength, progressOf, type Outcome } from './engine/progress';
import { Run } from './engine/run';
import { courseComplete, keepsakeFor, ownedKeepsakes } from './engine/keepsakes';
import { objectArt, collectionHtml, WordScene } from './ui/scene';
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
import { loadHands, onFingerHover, paintHand } from './ui/hands';
import { CanvasPrompt } from './render/prompt';
import { selfTest as textflowSelfTest } from './render/textflow';

/** What the current run is for: the trail itself, a finger drill, or a coach drill (confusion / reach / review). */
type Mode = { kind: 'trail' } | { kind: 'remedial'; pair: FingerPair; level: number } | { kind: 'coach'; decision: Decision };

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
let beforeMastery: Record<string, number> = {};
const wordScene = new WordScene($('wordScene'));
const actionable = (d: Decision) => !['rushing', 'fatigue', 'steady', 'reach'].includes(d.kind);
const courseFrontier = () => MAIN_TRAILS.find(t => !isCleared(state, t.id)) ?? MAIN_TRAILS.at(-1)!;

const now = () => performance.now();
const arena = () => $('arena');
const settingsModal = () => $('settingsModal');
const trail = (): Trail => currentTrail(state);
const stageName = () => currentStage(state, keys);
const fingerLevel = () => mode.kind === 'remedial' ? fingerLevels(fingerById(mode.pair.sides[0])!)[mode.level]! : null;
const practiceAllowed = () => mode.kind === 'remedial' ? new Set(run.text) : allowedChars(runTrail);
const focusPair = (): FingerPair | null => (mode.kind === 'remedial' ? mode.pair : null);

function save(): void { const j = keys.toJSON(); state.keys = j.keys; state.confusions = j.confusions; state.transitions = trans.toJSON(); store(); sync.wrote(); }
/** Account adoption resets the active passage so strokes from two accounts never mix. */
function adopt(next: SaveV6): void {
  state = next; keys = KeyModel.fromJSON(state.keys, state.confusions); trans = TransitionModel.fromJSON(state.transitions); gate = null; replayReturn = null; setMethod(state.settings.method); store(); syncSettingsUi();
  mode = { kind: 'trail' }; resetRun(); if (courseComplete(state)) showCompletion();
}

const unlockedLetters = () => [...allowedChars(trail())].filter((k) => k.length === 1 && k !== ' ' && k === k.toLowerCase());
const dueNow = () => new Set(keys.dueKeys([...allowedChars(trail())].filter((k) => k.length === 1 && k !== ' ' && k === k.toLowerCase()), Date.now()));
function makeText(): string {
  const allowed = allowedChars(trail());
  if (mode.kind === 'remedial') { practice = fingerPractice(mode.pair, mode.level, state.fingerCourses); return practice.text; }
  if (mode.kind === 'coach') {
    const d = mode.decision;
    if (d.kind === 'remedial') { const f = fingerForKey(d.keys[0] ?? 'f'); return f && 'keys' in f ? remedialText(f, allowed, 30) : generate(trail(), 'drill'); }
    return generateDrill(d.kind === 'confusion' ? 'confusion' : d.kind === 'reach' ? 'reach' : d.kind === 'transition' ? 'transition' : 'review', d.keys, trail());
  }
  return generate(trail(), stageName(), { heat: keys.heatMap(Date.now(), dueNow()), pairHeat: trans.heatMap(unlockedLetters()), weakPairs: trans.weakest(unlockedLetters()).filter((w) => w.mastery < 0.6).slice(0, 8).map((w) => w.pair) });
}
function resetRun(): void {
  completionHome = false;
  $('result').querySelector<HTMLElement>('.score')!.hidden = false;
  runTrail = trail(); runStage = stageName();
  beforeMastery = Object.fromEntries([...allowedChars(runTrail)].map(k => [k.toLowerCase(), keys.mastery(k)]));
  practice = null; fingerPassed = false;
  run = new Run(makeText()); outcome = null; decisions = [];
  wordScene.reset(keepsakeFor(runTrail.grove));
  if (mode.kind !== 'trail' && courseComplete(state)) $('wordScene').querySelector('.scene-caption')!.textContent = 'Familiar movements. A little room to play.';
  $('nextAction').textContent = mode.kind === 'trail' ? 'Begin passage' : 'Begin practice';
  $('skipPractice').hidden = mode.kind === 'trail';
  $('skipPractice').textContent = 'Back to my course';
  document.body.classList.remove('showing-result');
  arena().classList.remove('result-mode', 'focus-mode'); render(); $('lessonTitle').focus();
}
/** Switch into a coach drill (required or accepted offer). */
function startCoach(d: Decision): void { mode = { kind: 'coach', decision: d }; resetRun(); toast(d.title); }

// ---- rendering -------------------------------------------------------------
function header(): void {
  const t = runTrail, g = groveOf(t);
  if (mode.kind === 'remedial') {
    const selected = mode;
    $('route').innerHTML = fingerLevels(fingerById(selected.pair.sides[0])!).map((_, i) => '<i class="' + (i === selected.level ? 'current' : i < pairCompleted(state.fingerCourses, selected.pair) ? 'done' : '') + '"></i>').join('');
    $('lessonNo').textContent = `Level ${mode.level + 1} of 10`;
    $('modeLabel').textContent = mode.pair.name + ' course';
    return;
  }
  $('route').innerHTML = trailsInGrove(g.id).map(x => '<i class="' + (x.id === t.id ? 'current' : isCleared(state, x.id) ? 'done' : '') + '"></i>').join('');
  $('lessonNo').textContent = `Lesson ${pathIndex(t)} of ${pathLength(t)}`;
  $('modeLabel').textContent = mode.kind === 'trail' ? `${g.name} · Chapter ${g.n}` : 'A little practice';
}
function labels(): void {
  const t = runTrail, g = groveOf(t), f = focusPair();
  const stageCopy = { drill: 'Meet the new keys. Take your time.', mix: 'Now weave them into familiar movements.', words: t.checkpoint ? 'A fresh passage using everything so far.' : 'Put those movements to work.' };
  $('lessonTitle').textContent = f ? f.name + ' · ' + fingerLevel()!.name : mode.kind === 'coach' ? mode.decision.title : t.name;
  $('lessonCopy').textContent = f ? fingerLevel()!.instruction : mode.kind === 'coach' ? mode.decision.reason : resolveCopy(t.blurb ?? g.blurb);
  $('summaryLabel').textContent = replayReturn ? 'A familiar place' : 'This passage';
  $('focusName').textContent = mode.kind === 'trail' ? replayReturn ? 'Replay · your course is waiting' : stageCopy[runStage] : 'Short practice · then your course';
  $('gateLabel').textContent = mode.kind !== 'trail' ? 'No test here' : t.checkpoint ? 'Chapter passage' : 'Accuracy before speed';
  $('focusInstruction').textContent = mode.kind === 'trail' ? `${t.checkpoint ? 97 : gateFor(t).passAcc}% accuracy · at your pace` : 'No passing score · just a little familiarity';
  if (f) {
    $('focusName').textContent = 'Practice adapts to the movements that need attention';
    $('gateLabel').textContent = 'Accuracy before speed';
    $('focusInstruction').textContent = `${FINGER_PASS_ACC}% for each finger · at your pace`;
  }
  $('message').textContent = run.status === 'playing' ? 'Take your time. You can pause between words.' : 'Just type to begin. Use a physical QWERTY keyboard.';
  $('unlockText').textContent = 'Your progress stays. Come back whenever you like.';
}
const useDom = new URLSearchParams(location.search).get('dom') === '1';
const canvasPrompt: CanvasPrompt | null = useDom ? null : new CanvasPrompt($('prompt'), { theme: 'light', compact: true, orb: false });
function prompt(): void {
  wordScene.update(run.text, run.pos);
  if (canvasPrompt) { canvasPrompt.set({ text: run.text, pos: run.pos, wrong: run.wrong, reading: runStage === 'words' && run.text.length > 50 }); return; }
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
  $('wpm').textContent = String(m.wpm); $('acc').textContent = m.acc + '%'; $('pct').textContent = m.pct + '%'; $('combo').textContent = String(run.combo);
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
function nextVisual(): void {
  document.querySelectorAll('[data-finger-label]').forEach((x) => x.classList.remove('active'));
  const c = run.current, f = fingerForKey(c);
  const shifted = isShifted(c);
  if (c === ' ') {
    paintHand('left', 'thumb'); paintHand('right', 'thumb');
    $('handInstruction').innerHTML = 'Press with either thumb.';
  } else if (f) {
    paintHand('left', f.id); paintHand('right', f.id);
    document.querySelectorAll('[data-finger-label="' + f.id + '"]').forEach((x) => x.classList.add('active'));
    const shiftNote = shifted && 'hand' in f ? ` · hold ${f.hand === 'left' ? 'right' : 'left'} shift` : '';
    const anchor = 'anchor' in f && f.anchor !== c.toLowerCase() ? ` · landmark ${f.anchor.toUpperCase()}` : '';
    $('handInstruction').innerHTML = '<strong>' + escapeHtml(f.full) + '</strong>' + escapeHtml(anchor + shiftNote);
  } else {
    paintHand('left', null); paintHand('right', null);
    $('handInstruction').innerHTML = run.status === 'complete' ? 'Run complete.' : 'Let your hands rest comfortably.';
  }
  $('nextCue').textContent = '';
}
function keymap(): void {
  const c = baseKey(run.current), shifted = isShifted(run.current);
  const allowed = practiceAllowed(), bases = new Set([...allowed].map(baseKey));
  const homes = new Set('fj');
  const rows = [...([...bases].some(k => /[0-9\-=]/.test(k)) ? ['`1234567890-='] : []), 'qwertyuiop' + (bases.has('[') || bases.has('\\') ? '[]\\' : ''), "asdfghjkl;" + (bases.has("'") ? "'" : ''), 'zxcvbnm,./'];
  $('keymap').innerHTML = rows.map((r, i) => '<div class="keyrow" style="--row-offset:' + (i * 5) + 'px">' + [...r].map(k => '<span class="keycap ' + (homes.has(k) ? 'home ' : '') + (bases.has(k) ? '' : 'locked ') + (c === k ? 'hot' : '') + '" data-key="' + escapeHtml(k) + '">' + escapeHtml(c === k && shifted ? run.current : k.toUpperCase()) + '</span>').join('') + '</div>').join('')
    + '<div class="keyrow"><span class="keycap shiftcap ' + (shifted && fingerForKey(run.current)?.id.startsWith('r') ? 'hot' : '') + '">⇧</span><span class="keycap spacebar ' + (c === ' ' ? 'hot' : '') + '" data-key=" ">SPACE</span><span class="keycap shiftcap ' + (shifted && fingerForKey(run.current)?.id.startsWith('l') ? 'hot' : '') + '">⇧</span></div>';
  $('keymap').querySelectorAll<HTMLElement>('[data-key]').forEach(el => { el.onpointerenter = () => peekKey(el.dataset.key!); el.onpointerleave = () => peekKey(null); });
}
/** Hovering a keycap paints its finger; hovering a finger lights its keys. Null restores the live state. */
function peekKey(k: string | null): void {
  if (k === null) { nextVisual(); return; }
  const f = fingerForKey(k);
  document.querySelectorAll('[data-finger-label]').forEach((x) => x.classList.remove('active'));
  if (!f) return;
  paintHand('left', f.id); paintHand('right', f.id);
  document.querySelectorAll('[data-finger-label="' + f.id + '"]').forEach((x) => x.classList.add('active'));
}
function peekFinger(id: string | null): void {
  $('keymap').querySelectorAll('.keycap.peek').forEach((x) => x.classList.remove('peek'));
  if (id === null) { nextVisual(); return; }
  const f = fingerById(id);
  const allowed = practiceAllowed();
  paintHand('left', id); paintHand('right', id);
  const keys = id === 'thumb' ? [' '] : f ? [...f.keys].filter((k) => allowed.has(k)) : [];
  $('keymap').querySelectorAll<HTMLElement>('[data-key]').forEach(el => { if (keys.includes(el.dataset.key!)) el.classList.add('peek'); });
}
onFingerHover(peekFinger);
function render(): void { header(); labels(); prompt(); metrics(); focusGrid(); keymap(); nextVisual(); }

// ---- run lifecycle -----------------------------------------------------------
function begin(): void { if (run.status === 'playing') return; if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); run.begin(now()); $('nextAction').textContent = 'Typing…'; render(); }
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
  if (firstKey !== undefined) { begin(); typeKey(firstKey); }
}
function typeKey(k: string): void {
  const r = run.type(k, now());
  if (r === 'ignored') return;
  const last = run.strokes.at(-1)!;
  const timingPrev = run.strokes.at(-2);
  const timed = timingPrev?.correct && timingPrev.index === last.index - 1 && timingPrev.key !== ' ' && last.key !== ' ' && last.latencyMs < 2000;
  keys.record(last.key, last.correct, timed ? last.latencyMs : null, Date.now(), last.correct ? undefined : k); // first key of a run has no rhythm evidence
  // The pair is the two wanted letters; its evidence is this press. Only after a correct previous press: a retry is not a transition.
  const prev = run.strokes.at(-2);
  if (prev && prev.correct && prev.index === last.index - 1) trans.record(prev.key, last.key, last.correct, last.latencyMs);
  // A small mark at a word boundary, not a shower of letters on every press.
  if (!last.correct || last.key === ' ') canvasPrompt?.onKey(last.correct ? 'ok' : 'miss', last.correct ? run.pos - 1 : run.pos);
  if (r === 'done') return finish();
  prompt(); metrics(); keymap(); nextVisual();
}
function abort(): void { if (run.status !== 'playing') return; toast('Run stopped.'); resetRun(); }

function thirds(): { errors: number; lat: number }[] {
  const st = run.strokes; const n = Math.max(1, Math.floor(st.length / 3));
  return [0, 1, 2].map((i) => { const part = st.slice(i * n, i === 2 ? st.length : (i + 1) * n); const ok = part.filter((x) => x.correct); return { errors: part.length - ok.length, lat: ok.length ? ok.reduce((a, x) => a + x.latencyMs, 0) / ok.length : 0 }; });
}
function finish(): void {
  const m = metrics(), t = runTrail, wasReplay = replayReturn !== null;
  let title = 'Practice complete.', copy = 'A little more familiarity to take into your next passage.';
  decisions = []; gate = null; keys.endRun();
  const focus = focusKeys(t, keys);
  if (mode.kind === 'trail') {
    state.trail = t.id;
    outcome = applyRun(state, keys, { hits: run.hits, attempts: run.attempts, maxCombo: run.maxCombo, wpm: m.wpm, acc: m.acc, rhythm: run.rhythm(), now: Date.now(), stage: runStage });
    const p = progressOf(state, t.id);
    const unlocked = [...allowedChars(t)].filter(k => k === k.toLowerCase());
    const errors = classifyRun(run.text, run.strokes, activeMethod());
    state.errors = rollTally(state.errors, errors);
    const missedKeys = [...new Set(run.strokes.filter(s => !s.correct).map(s => s.key.toLowerCase()))];
    decisions = decide(keys, { thirds: thirds(), wpm: m.wpm, acc: m.acc, rhythm: run.rhythm(), runsOnTrail: p.runs, focusKeys: focus, unlocked, passed: outcome.passed, fails: p.fails, recentAcc: p.recent, errors, missedKeys, weakPairs: trans.weakest(unlocked) });
    // One bounded repair between course attempts. Timing alone never sends a player off course.
    if (!outcome.firstClear && !wasReplay && missedKeys.length && run.errors >= 3) gate = decisions.find(actionable) ?? { kind: 'precision', required: false, keys: missedKeys.slice(0, 3), title: 'A little room to settle', reason: `A short practice with ${missedKeys.slice(0, 3).map(k => k === ' ' ? 'Space' : k.toUpperCase()).join(' · ')}, then we will try the passage again.` };
    if (wasReplay) { title = 'A familiar place, revisited.'; copy = 'Your next lesson is waiting right where you left it.'; state.trail = replayReturn!; }
    else if (outcome.firstClear && t.id === 'flow-checkpoint') { title = 'Look what your hands can do.'; copy = 'You completed all 36 lessons: letters, capitals, punctuation, numbers and a longer mixed passage. Keep using this in everyday writing. Fluency grows with use.'; }
    else if (outcome.firstClear && t.checkpoint) { title = `${groveOf(t).name}, complete.`; copy = keepsakeFor(t.grove).line + (outcome.nextTrail ? ` Next, ${groveOf(outcome.nextTrail).name}: ${resolveCopy(outcome.nextTrail.blurb ?? groveOf(outcome.nextTrail).blurb)}` : ' A small extra, made yours.'); }
    else if (outcome.firstClear) { title = 'Lesson complete.'; copy = `${t.name} is complete. ${outcome.nextTrail ? `Next: ${outcome.nextTrail.name}.` : 'The whole path is open.'}`; }
    else if (!outcome.passed) { title = 'Try this passage again.'; copy = `${gate ? 'A short practice will help with the missed keys, then we’ll try again.' : 'Take your time; there is no timer to beat.'}`; }
    else { title = 'Lesson complete.'; copy = outcome.nextTrail ? `Next: ${outcome.nextTrail.name}.` : 'The whole path is open.'; }
    copy = `${m.acc}% accuracy · ${t.checkpoint ? 97 : gateFor(t).passAcc}% needed. ${copy}`;
  }
  if (mode.kind === 'remedial' && practice) {
    const replay = pairCompleted(state.fingerCourses, mode.pair) > mode.level;
    fingerPassed = completeFingerPractice(state.fingerCourses, mode.pair, mode.level, practice, run).passed;
    title = replay ? 'Level revisited.' : fingerPassed ? mode.level === 9 ? `${mode.pair.name} course complete.` : 'Finger level complete.' : 'A little more practice here.';
    copy = fingerPassed
      ? mode.level === 9 ? 'All ten levels are yours to revisit whenever you like.' : 'Your progress is saved. Continue to the next level at your own pace.'
      : 'Some movements need another pass. Your next practice will focus on them; the progress you earned is saved.';
  }
  const newly = [...allowedChars(t)].filter(k => k === k.toLowerCase()).filter(k => keys.mastery(k) >= MASTERED && (beforeMastery[k] ?? 0) < MASTERED);
  $('resultMastery').textContent = newly.length ? `Settled this time: ${newly.map(k => k === ' ' ? 'Space' : k.toUpperCase()).join(' · ')}` : `${run.hits} characters typed · ${run.errors === 0 ? 'no missed keys' : `${run.errors} missed ${run.errors === 1 ? 'key' : 'keys'}`}`;
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
  $('nextAction').textContent = gate ? 'Settle the tricky part' : wasReplay ? 'Back to my course' : mode.kind !== 'trail' ? 'Back to the passage' : courseComplete(state) && !outcome?.nextTrail ? 'Keep my hands familiar' : outcome?.passed ? `Next: ${trail().name}` : `Retry: ${t.name}`;
  $('skipPractice').hidden = !gate;
  $('skipPractice').textContent = 'Try the passage instead';
  if (mode.kind === 'remedial') {
    $('nextAction').textContent = !fingerPassed ? 'Continue practice' : mode.level === 9 ? 'Replay final level' : `Next: ${fingerLevels(fingerById(mode.pair.sides[0])!)[mode.level + 1]!.name}`;
    $('skipPractice').hidden = false; $('skipPractice').textContent = 'Back to my course';
  }
  save(); arena().classList.add('result-mode'); document.body.classList.add('showing-result');
  $('resultTitle').focus();
  header();
}

// ---- grove map ---------------------------------------------------------------------
let mapKeys: ((e: KeyboardEvent) => void) | null = null;
function openMap(showObjects = false): void {
  if (run.status === 'playing') { toast('Finish or reset the current run first.'); return; }
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
function selectLesson(t: Trail): void { replayReturn = isCleared(state, t.id) ? courseFrontier().id : null; state.trail = t.id; mode = { kind: 'trail' }; gate = null; closeMap(); resetRun(); }
function closeMap(): void { arena().classList.remove('map-mode'); document.body.classList.remove('showing-book'); mapKeys = null; if (completionHome || run.status === 'complete') { arena().classList.add('result-mode'); document.body.classList.add('showing-result'); } else render(); $(completionHome || run.status === 'complete' ? 'resultTitle' : 'lessonTitle').focus(); }

// ---- focus / remedial ----------------------------------------------------------
function openFocus(): void {
  if (run.status === 'playing') { toast('Finish or reset before opening trouble-spot practice.'); return; }
  if (mode.kind === 'remedial') browseFinger = mode.pair.id;
  browseLevel = Math.min(9, pairCompleted(state.fingerCourses, FINGER_PAIRS.find(p => p.id === browseFinger)!));
  arena().classList.remove('result-mode'); document.body.classList.remove('showing-result'); arena().classList.add('focus-mode'); focusGrid(); $('focusTitle').focus();
}
function closeFocus(): void { arena().classList.remove('focus-mode'); if (completionHome || run.status === 'complete') { arena().classList.add('result-mode'); document.body.classList.add('showing-result'); } else render(); }
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
  if (!state.settings.reviewOn || !state.settings.onboarded) return;
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
  // A result is a resting place. Stray typing never dismisses a chapter reveal.
  if (!completionHome && run.status === 'idle' && e.key.length === 1) { e.preventDefault(); begin(); typeKey(e.key); }
}
function trapDialog(e: KeyboardEvent, dialog: HTMLElement): void {
  if (e.key !== 'Tab') return;
  const bs = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([hidden]), a[href]')].filter(x => x.offsetParent !== null);
  const first = bs[0], last = bs.at(-1);
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
}
document.addEventListener('keydown', (e) => {
  if (onboardModal().classList.contains('open')) { trapDialog(e, onboardModal()); if (e.key === 'Escape') { e.preventDefault(); finishOnboarding(state.settings.method); } return; }
  if (settingsModal().classList.contains('open')) { trapDialog(e, settingsModal()); if (e.key === 'Escape') { settingsModal().classList.remove('open'); $('settingsTopBtn').focus(); e.preventDefault(); } return; }
  if (arena().classList.contains('map-mode')) { mapKeys?.(e); return; }
  if (e.target instanceof HTMLElement && e.target.closest('button,a,input,select,textarea,summary,[contenteditable]')) return;
  if (arena().classList.contains('focus-mode')) { handleFocusKey(e); return; }
  if (run.status === 'playing') {
    if (e.key === 'Escape') { e.preventDefault(); abort(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.key.length === 1) { e.preventDefault(); typeKey(e.key); }
    return;
  }
  handleIdleOrResult(e);
});
$('prompt').onclick = () => { if (run.status === 'idle') begin(); };
$('focusBtn').onclick = () => openFocus();
$('resetRunBtn').onclick = () => { if (run.status === 'playing') abort(); else resetRun(); };
$('guideBtn').onclick = () => { state.settings.guideStrong = $('handsZone').classList.toggle('guide-strong'); save(); $('guideBtn').textContent = state.settings.guideStrong ? 'Use normal guide' : 'Show stronger guide'; };
$('lessonsNav').onclick = () => { if (arena().classList.contains('map-mode')) closeMap(); else openMap(); };
$('statsNav').onclick = () => openMap(true);
$('closeBook').onclick = closeMap;
$('skipPractice').onclick = () => { gate = null; mode = { kind: 'trail' }; replayReturn = null; if (courseComplete(state) && state.trail === 'flow-checkpoint') showCompletion(); else resetRun(); };
$('startBtn').onclick = () => { if (arena().classList.contains('map-mode')) { closeMap(); return; } if (completionHome || run.status === 'complete') continueAfterResult(); else begin(); };
function showSettings(): void { settingsModal().classList.add('open'); $('closeSettings').focus(); }
$('settingsTopBtn').onclick = showSettings;
$('settingsBtn').onclick = showSettings;
$('closeSettings').onclick = () => settingsModal().classList.remove('open');
settingsModal().onclick = (e) => { if (e.target === settingsModal()) settingsModal().classList.remove('open'); };
// ---- A concrete introduction, with a real technique choice -----------------
const onboardModal = () => $('onboardModal');
function openOnboarding(): void {
  $('onboardAsk').hidden = false; $('onboardTouch').hidden = true;
  settingsModal().classList.remove('open'); onboardModal().classList.add('open');
  onboardModal().querySelector<HTMLButtonElement>('button')?.focus();
}
function finishOnboarding(methodId: string): void {
  if (state.settings.method !== methodId) {
    // Only the four reassigned keys need fresh evidence. Earned chapters stay earned.
    const j = keys.toJSON();
    for (const k of 'zxcb') delete j.keys[k];
    for (const pair of Object.keys(state.transitions)) if ([...pair].some(k => 'zxcb'.includes(k))) delete state.transitions[pair];
    keys = KeyModel.fromJSON(j.keys, j.confusions); trans = TransitionModel.fromJSON(state.transitions);
  }
  state.settings.method = methodId; state.settings.onboarded = true; setMethod(methodId); save(); syncSettingsUi();
  onboardModal().classList.remove('open'); mode = { kind: 'trail' }; resetRun();
  $('lessonTitle').focus();
}
for (const b of onboardModal().querySelectorAll<HTMLButtonElement>('[data-onboard]')) b.onclick = () => {
  if (b.dataset.onboard === 'touch') { $('onboardAsk').hidden = true; $('onboardTouch').hidden = false; $('onboardTouch').querySelector<HTMLButtonElement>('button')?.focus(); }
  else finishOnboarding(b.dataset.onboard === 'keep' ? TRADITIONAL.id : RELAXED_QWERTY.id);
};
$('methodBtn').onclick = openOnboarding;
$('onboardBtn').onclick = openOnboarding;

$('codeBtn').onclick = () => { state.settings.codeGrove = !state.settings.codeGrove; save(); $('codeBtn').textContent = 'Code grove: ' + (state.settings.codeGrove ? 'on' : 'off'); toast(state.settings.codeGrove ? 'Code grove will appear after the Bark checkpoint.' : 'Code grove hidden.'); };
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
  state = sanitize(raw); keys = KeyModel.fromJSON(state.keys, state.confusions); trans = TransitionModel.fromJSON(state.transitions); mode = { kind: 'trail' }; gate = null; replayReturn = null; setMethod(state.settings.method); save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); if (courseComplete(state) && state.trail === 'flow-checkpoint') showCompletion(); toast('Progress restored.');
}
$('resetBtn').onclick = () => {
  if (!confirm('Reset all your progress? Every lesson, keepsake and practice record will be gone' + (signedIn ? ' from your account too.' : '.'))) return;
  if (!confirm('Are you really, really sure? There is no undo.')) return;
  { state = fresh(); keys = new KeyModel(); trans = new TransitionModel(); mode = { kind: 'trail' }; gate = null; replayReturn = null; setMethod(state.settings.method); save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); toast('Fresh grove.'); } };
function syncSettingsUi(): void {
  $('handsZone').classList.toggle('guide-strong', state.settings.guideStrong);
  $('guideBtn').textContent = state.settings.guideStrong ? 'Use normal guide' : 'Show stronger guide';
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
document.addEventListener('keydown', (e) => { if (docsPanel?.isOpen && e.key !== 'Escape') e.stopImmediatePropagation(); }, { capture: true });

syncSettingsUi(); resetRun(); if (courseComplete(state) && state.trail === 'flow-checkpoint') showCompletion(); else sessionCheck(); save(); showGuestHint(); void loadHands(nextVisual);
if (!state.settings.onboarded) openOnboarding();
Object.defineProperty(window, 'keygrove', {
  value: Object.freeze({
    snapshot: () => JSON.parse(JSON.stringify({ state, run: { text: run.text, pos: run.pos, status: run.status, hits: run.hits, attempts: run.attempts }, mode, outcome, decisions, gate, offer: (gate ?? decisions[0]) ? { kind: (gate ?? decisions[0])!.kind } : null })),
    import: (raw: unknown) => applyImport(raw),
    openMap,
    selftest: textflowSelfTest,
    prompt: () => canvasPrompt,
    method: () => activeMethod().id,
    account: () => account.session()?.user.email ?? null,
    signedIn: () => signedIn,
  }),
});
