import { allowedChars, gateFor, groveOf, resolveCopy, trailsInGrove, type Trail } from './curriculum';
import { FINGERS, fingerById, fingerForKey, remedialText, type Finger } from './curriculum/fingers';
import { METHODS, activeMethod, setMethod } from './curriculum/method';
import { KeyModel, MASTERED } from './engine/keymodel';
import { decide, readout, sessionReview, type Decision } from './engine/coach';
import { applyRun, currentStage, currentTrail, focusKeys, isCleared, pathIndex, pathLength, progressOf, type Outcome } from './engine/progress';
import { Run } from './engine/run';
import { rankFor } from './engine/scoring';
import { generate, generateDrill } from './engine/textgen';
import { fresh, load, sanitize, save as persist, type SaveV6 } from './state/save';
import { $, escapeHtml, toast } from './ui/dom';
import { createAccount } from './ui/account';
import { createProgressSync, type SyncStatus } from './state/progress-sync';
import { renderMap } from './ui/map';
import { loadHands, onFingerHover, paintHand } from './ui/hands';
import { CanvasPrompt } from './render/prompt';
import { selfTest as textflowSelfTest } from './render/textflow';

/** What the current run is for: the trail itself, a finger drill, or a coach drill (confusion / reach / review). */
type Mode = { kind: 'trail' } | { kind: 'remedial'; finger: Finger } | { kind: 'coach'; decision: Decision };

let state: SaveV6 = load();
setMethod(state.settings.method);
let keys = KeyModel.fromJSON(state.keys, state.confusions);
let mode: Mode = { kind: 'trail' };
let run = new Run('');
let outcome: Outcome | null = null;
/** Coach decisions for the run just finished: [0] may be required (blocks Continue). */
let decisions: Decision[] = [];
/** A required decision the player still has to act on before the next trail run. */
let gate: Decision | null = null;

const now = () => performance.now();
const arena = () => $('arena');
const settingsModal = () => $('settingsModal');
const trail = (): Trail => currentTrail(state);
const stageName = () => currentStage(state, keys);
const focusFinger = (): Finger | null => (mode.kind === 'remedial' ? mode.finger : null);

function save(): void { const j = keys.toJSON(); state.keys = j.keys; state.confusions = j.confusions; persist(state); sync.wrote(); }
/** The account's copy arrived: adopt it as if it had been imported, without disturbing a run in progress. */
function adopt(next: SaveV6): void {
  state = next; keys = KeyModel.fromJSON(state.keys, state.confusions); gate = null; setMethod(state.settings.method); persist(state); syncSettingsUi();
  if (run.status === 'playing') render(); else { mode = { kind: 'trail' }; resetRun(); }
}

const dueNow = () => new Set(keys.dueKeys([...allowedChars(trail())].filter((k) => k.length === 1 && k !== ' ' && k === k.toLowerCase()), Date.now()));
function makeText(): string {
  const allowed = allowedChars(trail());
  if (mode.kind === 'remedial') return remedialText(mode.finger, allowed);
  if (mode.kind === 'coach') {
    const d = mode.decision;
    if (d.kind === 'remedial') { const f = fingerForKey(d.keys[0] ?? 'f'); return f && 'keys' in f ? remedialText(f, allowed, 30) : generate(trail(), 'drill'); }
    return generateDrill(d.kind === 'confusion' ? 'confusion' : d.kind === 'reach' ? 'reach' : 'review', d.keys, trail());
  }
  return generate(trail(), stageName(), { heat: keys.heatMap(Date.now(), dueNow()) });
}
function resetRun(): void {
  run = new Run(makeText()); outcome = null; decisions = [];
  arena().classList.remove('result-mode', 'focus-mode'); render();
}
/** Switch into a coach drill (required or accepted offer). */
function startCoach(d: Decision): void { mode = { kind: 'coach', decision: d }; resetRun(); toast(d.title); }

// ---- rendering -------------------------------------------------------------
function header(): void {
  const t = trail(), g = groveOf(t), p = progressOf(state, t.id);
  const inGrove = trailsInGrove(g.id);
  $('route').innerHTML = inGrove.map((x) => '<i class="' + (x.id === t.id ? 'current' : isCleared(state, x.id) ? 'done' : '') + '"></i>').join('');
  const stage = p.cleared ? 'cleared' : `${stageName()} · run ${p.runs + 1}`;
  $('lessonNo').textContent = `Trail ${pathIndex(t)} of ${pathLength(t)} · ${stage}`;
  $('modeLabel').textContent = mode.kind === 'trail' ? `Grove ${g.n} · ${g.name}` : mode.kind === 'remedial' ? 'Remedial drill' : `Coach · ${mode.decision.kind}`;
  const rank = rankFor(state.stats.xp);
  $('xp').textContent = String(Math.round(state.stats.xp)); $('streak').textContent = String(state.stats.days); $('bestWpm').textContent = String(Math.round(state.stats.bestWpm));
  void rank;
}
function labels(): void {
  const t = trail(), g = groveOf(t), p = progressOf(state, t.id);
  const gate = gateFor(t);
  const f = focusFinger();
  const stageCopy = { drill: 'Drill — the new keys only, in rhythm.', mix: 'Mix — new keys blended into what you know.', words: t.checkpoint ? 'Checkpoint run — everything so far.' : 'Words — real words from everything unlocked.' } as const;
  if (f) {
    $('lessonTitle').textContent = 'Practice: ' + f.full;
    $('lessonCopy').textContent = 'A short drill on the ' + f.full.toLowerCase() + ' keys you have unlocked. Use ' + f.anchor.toUpperCase() + ' to stay oriented; let the hand move a little.';
  } else if (mode.kind === 'coach') {
    $('lessonTitle').textContent = mode.decision.title;
    $('lessonCopy').textContent = mode.decision.reason + (mode.decision.required ? ' Required before the next trail run.' : '');
  } else {
    $('lessonTitle').textContent = t.name;
    $('lessonCopy').textContent = resolveCopy(t.blurb ?? g.blurb) + ' ' + (p.cleared ? 'Cleared — replay for more stars.' : stageCopy[stageName()]);
  }
  const focus = focusKeys(t, keys);
  const mastered = readout(keys, focus).filter((r) => r.mastered).length;
  $('summaryLabel').textContent = f ? 'Trouble spot' : mode.kind === 'coach' ? 'Coach' : 'Mastery';
  $('focusName').textContent = f ? f.full : mode.kind === 'coach' ? mode.decision.required ? 'Required' : 'Optional' : t.checkpoint && p.cleared ? 'Clear it with ★★ to open the next grove.' : p.cleared ? 'Cleared. Replay for more stars.' : `${mastered}/${focus.length} keys mastered · ${p.runs} run${p.runs === 1 ? '' : 's'}`;
  $('gateLabel').textContent = `Pass at ${gate.passAcc}% · any speed`;
  $('focusInstruction').textContent = `★★ 97% + steady rhythm\n★★★ 100% + very steady\nswift bonus from ${gate.swiftWpm} wpm`;
  $('message').innerHTML = run.status === 'playing' ? '<strong>Typing is live.</strong> Every letter key is typing only.' : '<strong>Just type</strong> to begin. Enter also starts. Tab opens trouble-spot practice. M opens the grove map.';
  $('unlockText').textContent = f || mode.kind === 'coach' ? 'Space returns to your trail.' : `Grove ${g.n} of 7 · ${new Set(allowedChars(t)).size - 1} keys unlocked`;
}
const useDom = new URLSearchParams(location.search).get('dom') === '1';
const canvasPrompt: CanvasPrompt | null = useDom ? null : new CanvasPrompt($('prompt'), { theme: 'light', compact: true, orb: false });
function prompt(): void {
  if (canvasPrompt) { canvasPrompt.set({ text: run.text, pos: run.pos, wrong: run.wrong }); return; }
  const p = $('prompt'); p.innerHTML = '';
  [...run.text].forEach((c, i) => {
    const s = document.createElement('span');
    s.textContent = c === ' ' ? 'SPACE' : c;
    s.className = 'ch' + (c === ' ' ? ' space' : '') + (i < run.pos ? ' done' : '') + (i === run.pos ? ' current' : '') + (i === run.pos && run.wrong ? ' wrong' : '');
    p.appendChild(s);
  });
}
function metrics(): { wpm: number; acc: number; pct: number } {
  const m = run.metrics(now());
  $('wpm').textContent = String(m.wpm); $('acc').textContent = m.acc + '%'; $('pct').textContent = m.pct + '%'; $('combo').textContent = String(run.combo);
  const fill = document.getElementById('progressFill'); if (fill) fill.style.width = m.pct + '%';
  return m;
}
function focusGrid(): void {
  const grid = $('focusGrid');
  const allowed = allowedChars(trail());
  const weak = keys.weakest([...allowed].filter((k) => k.length === 1 && k !== ' ')).filter((w) => w.mastery < 0.5)[0];
  const hotFinger = weak ? fingerForKey(weak.key)?.id : null;
  grid.innerHTML = FINGERS.map((f) => {
    const n = [...f.keys].filter((k) => allowed.has(k)).length;
    return '<button class="focus-key ' + (focusFinger()?.id === f.id ? 'active' : '') + '" data-focus="' + f.id + '" ' + (n ? '' : 'disabled') + '><b>' + escapeHtml(f.anchor.toUpperCase()) + '</b>' + escapeHtml(f.name) + (hotFinger === f.id ? ' · struggling' : '') + '</button>';
  }).join('');
  grid.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach((b) => (b.onclick = () => chooseFocus(b.dataset.focus!)));
}
function nextVisual(): void {
  document.querySelectorAll('[data-finger-label]').forEach((x) => x.classList.remove('active'));
  const c = run.current, f = fingerForKey(c);
  const shifted = c !== '' && (c !== c.toLowerCase() || '!@#$%^&*()_+:"<>?{}'.includes(c));
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
    $('handInstruction').innerHTML = run.status === 'complete' ? 'Run complete.' : 'Home position.';
  }
  $('nextCue').textContent = '';
}
function keymap(): void {
  const c = run.current.toLowerCase();
  const allowed = allowedChars(trail());
  const homes = new Set('asdfjkl;');
  const rows = [...([...allowed].some((k) => /[0-9]/.test(k)) ? ['1234567890'] : []), 'qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'];
  $('keymap').innerHTML = rows.map((r) => '<div class="keyrow">' + [...r].map((k) => '<span class="keycap ' + (homes.has(k) ? 'home ' : '') + (allowed.has(k) ? '' : 'locked ') + (c === k ? 'hot' : '') + '" data-key="' + escapeHtml(k) + '">' + escapeHtml(k.toUpperCase()) + '</span>').join('') + '</div>').join('')
    + '<div class="keyrow"><span class="keycap spacebar ' + (c === ' ' ? 'hot' : '') + '" data-key=" ">SPACE</span></div>';
  $('keymap').querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
    el.onpointerenter = () => peekKey(el.dataset.key!);
    el.onpointerleave = () => peekKey(null);
  });
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
  const allowed = allowedChars(trail());
  paintHand('left', id); paintHand('right', id);
  const keys = id === 'thumb' ? [' '] : f ? [...f.keys].filter((k) => allowed.has(k)) : [];
  for (const k of keys) $('keymap').querySelector('[data-key="' + (k === ' ' ? ' ' : k) + '"]')?.classList.add('peek');
}
onFingerHover(peekFinger);
function render(): void { header(); labels(); prompt(); metrics(); focusGrid(); keymap(); nextVisual(); }

// ---- run lifecycle -----------------------------------------------------------
function begin(): void { if (run.status === 'playing') return; run.begin(now()); render(); }
function continueAfterResult(firstKey?: string): void {
  if (mode.kind === 'coach' && mode.decision.required && gate === mode.decision) gate = null; // drill done → gate lifted
  if (gate) { startCoach(gate); begin(); if (firstKey !== undefined) typeKey(firstKey); return; }
  if (mode.kind !== 'trail') mode = { kind: 'trail' };
  resetRun(); begin(); if (firstKey !== undefined) typeKey(firstKey);
}
function typeKey(k: string): void {
  const r = run.type(k, now());
  if (r === 'ignored') return;
  if (r === 'space-wait') { prompt(); nextVisual(); $('handInstruction').innerHTML = '<strong>Spacebar</strong> · either thumb · no penalty yet'; return; }
  const last = run.strokes.at(-1)!;
  keys.record(last.key, last.correct, run.strokes.length === 1 ? null : last.latencyMs, Date.now(), last.correct ? undefined : k); // first key of a run has no rhythm evidence
  canvasPrompt?.onKey(last.correct ? 'ok' : 'miss', last.correct ? run.pos - 1 : run.pos, run.combo >= 10);
  if (r === 'done') return finish();
  prompt(); metrics(); keymap(); nextVisual();
}
function abort(): void { if (run.status !== 'playing') return; toast('Run stopped.'); resetRun(); }

function starsHtml(n: number): string { let s = ''; for (let i = 1; i <= 3; i++) s += `<span class="${i <= n ? '' : 'e'}">★</span>`; return s; }

function thirds(): { errors: number; lat: number }[] {
  const st = run.strokes; const n = Math.max(1, Math.floor(st.length / 3));
  return [0, 1, 2].map((i) => { const part = st.slice(i * n, i === 2 ? st.length : (i + 1) * n); const ok = part.filter((x) => x.correct); return { errors: part.length - ok.length, lat: ok.length ? ok.reduce((a, x) => a + x.latencyMs, 0) / ok.length : 0 }; });
}
function finish(): void {
  const m = metrics();
  const t = trail();
  let title: string, copy: string, stars = 0, xp = 0;
  decisions = [];
  keys.endRun();
  const focus = focusKeys(t, keys);
  const masteryHtml = (note: string) => readout(keys, focus).map((r) => `<span class="${r.mastered ? 'ok' : ''}">${escapeHtml(r.key === ' ' ? 'SPACE' : r.key.toUpperCase())} <b>${Math.round(r.mastery * 100)}%</b></span>`).join('') + `<span class="note">${escapeHtml(note)}</span>`;
  if (mode.kind === 'trail') {
    const p = progressOf(state, t.id);
    const rhythm = run.rhythm();
    outcome = applyRun(state, keys, { hits: run.hits, attempts: run.attempts, maxCombo: run.maxCombo, wpm: m.wpm, acc: m.acc, rhythm, now: Date.now() });
    stars = outcome.stars; xp = outcome.xp;
    const gateNums = gateFor(t);
    const unlocked = [...allowedChars(t)].filter((k) => k.length === 1 && k === k.toLowerCase());
    decisions = decide(keys, { thirds: thirds(), wpm: m.wpm, acc: m.acc, rhythm, runsOnTrail: p.runs, focusKeys: focus, unlocked, passed: outcome.passed, fails: p.fails, recentAcc: p.recent });
    gate = decisions.find((d) => d.required) ?? null;
    if (!outcome.passed) {
      title = 'Not yet.'; copy = `Accuracy ${m.acc}% — this trail needs ${gateNums.passAcc}%. Speed never mattered here.`;
    } else {
      title = stars === 3 ? 'Perfect line.' : stars === 2 ? 'Clean and steady.' : m.acc >= 97 ? 'Clean, but uneven.' : 'Passed.';
      const rhythmNote = stars < 2 && m.acc >= 97 ? ` Rhythm ${Math.round(rhythm * 100)}% — ★★ wants an even cadence (60%+), fast or slow.` : '';
      if (outcome.advance === 'grove') copy = `Checkpoint mastered with ★★ — Grove ${groveOf(outcome.nextTrail!).n}, ${groveOf(outcome.nextTrail!).name}, is open. Next: ${outcome.nextTrail!.name}.`;
      else if (outcome.needsTwoStars) copy = `Checkpoint mastered, but ★★ (97% with a steady rhythm) opens the next grove. Run it again — slow is fine.${rhythmNote}`;
      else if (outcome.firstClear) copy = outcome.nextTrail ? `Mastered. Next: ${outcome.nextTrail.name}.` : 'Mastered. That was the last trail on the path.';
      else if (p.cleared) copy = 'Replayed.' + rhythmNote;
      else copy = `Run ${p.runs} done. Still to master: ${outcome.blockers.join(' · ')}.` + rhythmNote;
      void gateNums;
    }
    $('resultMastery').innerHTML = masteryHtml(p.cleared ? 'mastered' : `mastered at ${Math.round(MASTERED * 100)}% each · ${outcome.blockers.length ? 'blocking: ' + outcome.blockers.join(', ') : 'ready'}`);
  } else {
    title = m.acc >= 95 ? 'Clean drill.' : 'Drill done.';
    copy = mode.kind === 'coach' && mode.decision === gate ? 'Enter goes back to your trail.' : 'Enter repeats it, Space goes back to your trail.';
    if (mode.kind === 'coach') for (const k of mode.decision.keys) if (k !== ' ') keys.record(k, true, null, Date.now()); // touch: mark reviewed
    $('resultMastery').innerHTML = masteryHtml('trail keys');
  }
  save();
  $('resultStars').innerHTML = mode.kind === 'trail' ? starsHtml(stars) : '';
  $('resultTitle').textContent = title; $('resultCopy').textContent = copy;
  renderOffer();
  $('resultWpm').textContent = String(m.wpm); $('resultAcc').textContent = m.acc + '%'; $('resultXp').textContent = '+' + xp + (outcome && outcome.swift > 0.05 ? ' · swift +' + Math.round(outcome.swift * 100) + '%' : ''); $('resultCombo').textContent = String(run.maxCombo);
  arena().classList.add('result-mode'); header(); keymap(); nextVisual();
}
function renderOffer(): void {
  const el = $('resultOffer');
  const d = gate ?? decisions[0] ?? null;
  if (!d || mode.kind !== 'trail') { el.hidden = true; el.classList.remove('required'); return; }
  el.hidden = false; el.classList.toggle('required', d.required);
  const note = d.kind === 'rushing' || d.kind === 'fatigue' || d.kind === 'steady';
  const key = 'Enter';
  const skip = d.required ? '' : note ? '' : ' · Enter to skip';
  el.innerHTML = `<strong>${d.required ? 'Coach · required' : 'Coach'}</strong> <b>${escapeHtml(d.title)}.</b> ${escapeHtml(d.reason)} ${note ? '' : `<b>${key}</b> starts it${skip}.`}${decisions.length > 1 ? ` (+${decisions.length - 1} more note${decisions.length > 2 ? 's' : ''})` : ''}`;
}

// ---- grove map ---------------------------------------------------------------------
let mapKeys: ((e: KeyboardEvent) => void) | null = null;
function openMap(): void {
  if (run.status === 'playing') { toast('Finish or reset the current run first.'); return; }
  arena().classList.remove('result-mode', 'focus-mode'); arena().classList.add('map-mode');
  mapKeys = renderMap($('groveMap'), state, keys, {
    onSelect: (t) => { state.trail = t.id; mode = { kind: 'trail' }; save(); closeMap(); resetRun(); toast(`Grove ${groveOf(t).n} · ${t.name}`); },
    onClose: closeMap,
  });
}
function closeMap(): void { arena().classList.remove('map-mode'); mapKeys = null; render(); }

// ---- focus / remedial ----------------------------------------------------------
function openFocus(): void {
  if (run.status === 'playing') { toast('Finish or reset before opening trouble-spot practice.'); return; }
  arena().classList.remove('result-mode'); arena().classList.add('focus-mode'); focusGrid();
}
function closeFocus(): void { arena().classList.remove('focus-mode'); render(); }
function chooseFocus(id: string): void {
  const f = fingerById(id);
  mode = f ? { kind: 'remedial', finger: f } : { kind: 'trail' };
  resetRun(); toast(f ? 'Remedial drill: ' + f.full : 'Back to the trail');
}
function acceptOffer(): boolean {
  const d = gate ?? decisions[0];
  if (!d) return false;
  if (d.kind === 'rushing' || d.kind === 'fatigue' || d.kind === 'steady') return false;
  startCoach(d); return true;
}
function sessionCheck(): void {
  if (!state.settings.reviewOn) return;
  const unlocked = [...allowedChars(trail())].filter((k) => k.length === 1 && k === k.toLowerCase());
  const d = sessionReview(keys, unlocked, Date.now());
  if (!d) return;
  if (d.required) { gate = d; startCoach(d); return; }
  pendingReview = d;
  $('message').innerHTML = `<strong>${escapeHtml(d.title)}:</strong> ${escapeHtml(d.reason)} Press <strong>W</strong> to review first.`;
}
let pendingReview: Decision | null = null;
function statsToast(): void {
  const r = rankFor(state.stats.xp);
  toast(`${r.name} · ${Math.round(state.stats.xp)} XP${r.next ? ' / ' + r.next : ''} · ${state.stats.runs} runs · best ${Math.round(state.stats.bestWpm)} WPM · ${state.stats.days}-day streak`);
}

// ---- input -----------------------------------------------------------------------
function handleFocusKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') { e.preventDefault(); closeFocus(); return; }
  if (e.key === ' ') { e.preventDefault(); chooseFocus('none'); return; }
  const f = FINGERS.find((x) => x.anchor === e.key.toLowerCase()); if (f) { e.preventDefault(); chooseFocus(f.id); }
}
function handleIdleOrResult(e: KeyboardEvent): void {
  const done = run.status === 'complete';
  if (e.key === 'Tab') { e.preventDefault(); if (!(done && !gate && acceptOffer())) openFocus(); return; }
  if (e.key === 'Enter') { e.preventDefault(); if (done) { if (mode.kind === 'trail' && gate) { startCoach(gate); return; } continueAfterResult(); } else begin(); return; }
  if (e.key === 'Escape') { e.preventDefault(); if (done) resetRun(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ' && mode.kind !== 'trail') { e.preventDefault(); if (mode.kind === 'coach' && mode.decision === gate && run.status !== 'complete') { toast('Finish this drill first — the coach asked for it.'); return; } mode = { kind: 'trail' }; resetRun(); toast('Back to the trail'); return; }
  if (done && mode.kind === 'trail' && gate && e.key.length === 1) { e.preventDefault(); startCoach(gate); begin(); typeKey(e.key); return; }
  if (!done && run.status === 'idle' && e.key.toLowerCase() === 'w' && pendingReview) { e.preventDefault(); const d = pendingReview; pendingReview = null; startCoach(d); return; }
  if (!done && run.status === 'idle' && e.key.toLowerCase() === 'm') { e.preventDefault(); openMap(); return; }
  if (e.key.length === 1) {
    e.preventDefault();
    if (done) continueAfterResult(e.key);
    else { begin(); typeKey(e.key); }
  }
}
document.addEventListener('keydown', (e) => {
  if (settingsModal().classList.contains('open')) { if (e.key === 'Escape') { settingsModal().classList.remove('open'); e.preventDefault(); } return; }
  if (arena().classList.contains('map-mode')) { mapKeys?.(e); return; }
  if (arena().classList.contains('focus-mode')) { handleFocusKey(e); return; }
  if (run.status === 'playing') {
    if (e.key === 'Escape') { e.preventDefault(); abort(); return; }
    if (e.key === 'Tab') { e.preventDefault(); toast('Finish or reset before opening trouble-spot practice.'); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1) { e.preventDefault(); typeKey(e.key); }
    return;
  }
  handleIdleOrResult(e);
});
$('prompt').onclick = () => { if (run.status === 'idle') begin(); };
$('startBtn').onclick = () => { if (run.status === 'complete') continueAfterResult(); else begin(); };
$('focusBtn').onclick = () => openFocus();
$('resetRunBtn').onclick = () => { if (run.status === 'playing') abort(); else resetRun(); };
$('guideBtn').onclick = () => { state.settings.guideStrong = $('handsZone').classList.toggle('guide-strong'); save(); $('guideBtn').textContent = state.settings.guideStrong ? 'Use normal guide' : 'Show stronger guide'; };
$('lessonsNav').onclick = () => { if (arena().classList.contains('map-mode')) closeMap(); else openMap(); };
$('statsNav').onclick = statsToast;
$('settingsTopBtn').onclick = () => settingsModal().classList.add('open');
$('settingsBtn').onclick = () => settingsModal().classList.add('open');
$('closeSettings').onclick = () => settingsModal().classList.remove('open');
settingsModal().onclick = (e) => { if (e.target === settingsModal()) settingsModal().classList.remove('open'); };
$('methodBtn').onclick = () => {
  const i = METHODS.findIndex((m) => m.id === state.settings.method);
  const next = METHODS[(i + 1) % METHODS.length]!;
  state.settings.method = next.id; setMethod(next.id); save(); syncSettingsUi(); if (run.status !== 'playing') render(); toast(next.name + ' · ' + next.blurb);
};
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
  state = sanitize(raw); keys = KeyModel.fromJSON(state.keys, state.confusions); mode = { kind: 'trail' }; gate = null; setMethod(state.settings.method); save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); toast('Progress restored.');
}
$('resetBtn').onclick = () => { if (confirm('Reset all Keygrove progress?')) { state = fresh(); keys = new KeyModel(); mode = { kind: 'trail' }; gate = null; setMethod(state.settings.method); save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); toast('Fresh grove.'); } };
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
  read: () => { const j = keys.toJSON(); state.keys = j.keys; state.confusions = j.confusions; return state; },
  write: adopt,
});
const account = createAccount({ announce: toast, onSession: (session, client) => sync.session(session, client) });
const syncNote = (s: SyncStatus): string => {
  switch (s.kind) {
    case 'off': return 'Your progress stays in this browser; the same login works in every Strange Systems app.';
    case 'syncing': return 'Syncing your progress…';
    case 'synced': return `Progress synced · ${s.runs} run${s.runs === 1 ? '' : 's'} on this account. Sign in anywhere to continue.`;
    case 'unavailable': return s.reason === 'not-installed' ? 'Sync is not set up on the server yet; your progress stays in this browser.'
      : s.reason === 'offline' ? 'Offline — your progress will sync when you are back.'
      : 'Sync is not reachable right now; your progress stays in this browser.';
  }
};
sync.onStatus((s) => account.setNote(syncNote(s)));

syncSettingsUi(); resetRun(); sessionCheck(); save(); void loadHands(nextVisual);
Object.defineProperty(window, 'keygrove', {
  value: Object.freeze({
    snapshot: () => JSON.parse(JSON.stringify({ state, run: { text: run.text, pos: run.pos, status: run.status, hits: run.hits, attempts: run.attempts }, mode, outcome, decisions, gate, offer: (gate ?? decisions[0]) ? { kind: (gate ?? decisions[0])!.kind } : null })),
    import: (raw: unknown) => applyImport(raw),
    openMap,
    selftest: textflowSelfTest,
    prompt: () => canvasPrompt,
    method: () => activeMethod().id,
    account: () => account.session()?.user.email ?? null,
  }),
});
