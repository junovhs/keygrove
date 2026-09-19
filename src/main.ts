import { allowedChars, gateFor, groveOf, trailsInGrove, type Trail } from './curriculum';
import { FINGERS, fingerById, fingerForKey, remedialText, type Finger } from './curriculum/fingers';
import { KeyModel } from './engine/keymodel';
import { STAGE_NAMES, applyRun, currentStage, currentTrail, isCleared, pathIndex, pathLength, progressOf, type Outcome } from './engine/progress';
import { Run } from './engine/run';
import { effectiveGate, rankFor } from './engine/scoring';
import { generate } from './engine/textgen';
import { fresh, load, sanitize, save as persist, type SaveV5 } from './state/save';
import { $, escapeHtml, toast } from './ui/dom';
import { loadHands, paintHand } from './ui/hands';

/** What the current run is for: the trail itself, a finger drill, or a warm-up of rusty keys. */
type Mode = { kind: 'trail' } | { kind: 'remedial'; finger: Finger } | { kind: 'warmup'; keys: string[] };

let state: SaveV5 = load();
let keys = KeyModel.fromJSON(state.keys);
let mode: Mode = { kind: 'trail' };
let run = new Run('');
let outcome: Outcome | null = null;
let offer: { kind: 'remedial'; finger: Finger } | { kind: 'slow' } | null = null;

const now = () => performance.now();
const arena = () => $('arena');
const settingsModal = () => $('settingsModal');
const trail = (): Trail => currentTrail(state);
const stageName = () => currentStage(state);
const focusFinger = (): Finger | null => (mode.kind === 'remedial' ? mode.finger : null);

function save(): void { state.keys = keys.toJSON(); persist(state); }

function makeText(): string {
  const allowed = allowedChars(trail());
  if (mode.kind === 'remedial') return remedialText(mode.finger, allowed);
  if (mode.kind === 'warmup') { const f = fingerForKey(mode.keys[0] ?? 'f'); return f && 'keys' in f ? remedialText(f, allowed, 30) : generate(trail(), 'drill'); }
  return generate(trail(), stageName(), { heat: keys.heatMap() });
}
function resetRun(): void {
  run = new Run(makeText()); outcome = null; offer = null;
  arena().classList.remove('result-mode', 'focus-mode'); render();
}

// ---- rendering -------------------------------------------------------------
function header(): void {
  const t = trail(), g = groveOf(t), p = progressOf(state, t.id);
  const inGrove = trailsInGrove(g.id);
  $('route').innerHTML = inGrove.map((x) => '<i class="' + (x.id === t.id ? 'current' : isCleared(state, x.id) ? 'done' : '') + '"></i>').join('');
  const stage = p.stage >= 3 ? 'cleared' : STAGE_NAMES[p.stage]!;
  $('lessonNo').textContent = `Trail ${pathIndex(t)} of ${pathLength(t)} · ${stage}`;
  $('modeLabel').textContent = mode.kind === 'trail' ? `Grove ${g.n} · ${g.name}` : mode.kind === 'remedial' ? 'Remedial drill' : 'Warm-up';
  const rank = rankFor(state.stats.xp);
  $('xp').textContent = String(Math.round(state.stats.xp)); $('streak').textContent = String(state.stats.days); $('bestWpm').textContent = String(Math.round(state.stats.bestWpm));
  void rank;
}
function labels(): void {
  const t = trail(), g = groveOf(t), p = progressOf(state, t.id);
  const gate = effectiveGate(gateFor(t), state.settings.slowMode);
  const f = focusFinger();
  const stageCopy = { drill: 'Drill — the new keys only, in rhythm.', mix: 'Mix — new keys blended into what you know.', words: t.checkpoint ? 'Checkpoint run — everything so far.' : 'Words — real words from everything unlocked.' } as const;
  if (f) {
    $('lessonTitle').textContent = 'Practice: ' + f.full;
    $('lessonCopy').textContent = 'A short drill on the ' + f.full.toLowerCase() + ' keys you have unlocked. Return to ' + f.anchor.toUpperCase() + ' after each reach.';
  } else if (mode.kind === 'warmup') {
    $('lessonTitle').textContent = 'Warm-up';
    $('lessonCopy').textContent = 'A few keys have gone rusty: ' + mode.keys.map((k) => k.toUpperCase()).join(' ') + '. One short pass, then back to your trail.';
  } else {
    $('lessonTitle').textContent = t.name;
    $('lessonCopy').textContent = (t.blurb ?? g.blurb) + ' ' + (p.stage >= 3 ? 'Cleared — replay for more stars.' : stageCopy[stageName()]);
  }
  $('summaryLabel').textContent = f ? 'Trouble spot' : 'Pass gate';
  $('focusName').textContent = f ? f.full : `${gate.passAcc}% accuracy`;
  $('focusInstruction').textContent = f ? 'Isolate this finger briefly, then go back to the trail.' : `Any speed passes. ★★ at ${gate.star2Wpm} WPM / 97%, ★★★ at ${gate.star3Wpm} WPM / 100%.${t.checkpoint ? ' This checkpoint needs ★★ to open the next grove.' : ''}${state.settings.slowMode ? ' Slow mode is on.' : ''}`;
  $('message').innerHTML = run.status === 'playing' ? '<strong>Typing is live.</strong> Every letter key is typing only.' : '<strong>Just type</strong> to begin. Enter also starts. Tab opens trouble-spot practice. M shows your stats.';
  $('unlockText').textContent = f || mode.kind === 'warmup' ? 'Space returns to your trail.' : `Grove ${g.n} of 6 · ${new Set(allowedChars(t)).size - 1} keys unlocked`;
}
function prompt(): void {
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
  const hot = keys.hottest([...allowed].filter((k) => k.length === 1 && k !== ' '));
  const hotFinger = hot ? fingerForKey(hot.key)?.id : null;
  grid.innerHTML = FINGERS.map((f) => {
    const n = [...f.keys].filter((k) => allowed.has(k)).length;
    return '<button class="focus-key ' + (focusFinger()?.id === f.id ? 'active' : '') + '" data-focus="' + f.id + '" ' + (n ? '' : 'disabled') + '><b>' + escapeHtml(f.anchor.toUpperCase()) + '</b>' + escapeHtml(f.name) + (hotFinger === f.id ? ' · struggling' : '') + '</button>';
  }).join('');
  grid.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach((b) => (b.onclick = () => chooseFocus(b.dataset.focus!)));
}
function nextVisual(): void {
  document.querySelectorAll('[data-finger-label]').forEach((x) => x.classList.remove('active'));
  const c = run.current, f = fingerForKey(c);
  const shifted = c !== c.toLowerCase() || '!@#$%^&*()_+:"<>?{}'.includes(c) && c !== '';
  if (c === ' ') {
    paintHand('left', 'thumb'); paintHand('right', 'thumb');
    $('handInstruction').innerHTML = '<strong>Spacebar</strong> — press with either thumb.';
    $('nextCue').innerHTML = '<strong>PRESS SPACEBAR</strong> · it will not hurt accuracy until you do';
  } else if (f) {
    paintHand('left', f.id); paintHand('right', f.id);
    document.querySelectorAll('[data-finger-label="' + f.id + '"]').forEach((x) => x.classList.add('active'));
    const shiftNote = shifted && 'hand' in f ? ` Hold ${f.hand === 'left' ? 'right' : 'left'} Shift with the other hand.` : '';
    $('handInstruction').innerHTML = '<strong>' + escapeHtml(c) + '</strong> — ' + escapeHtml(f.full) + '.' + shiftNote + ' Keep the rest of your hand relaxed.';
    $('nextCue').innerHTML = 'NEXT · <strong>' + escapeHtml(c) + '</strong> · ' + escapeHtml(f.full) + (shiftNote ? ' + SHIFT' : '');
  } else {
    paintHand('left', null); paintHand('right', null);
    $('handInstruction').innerHTML = '<strong>Home position</strong> — use the guide only when you need a placement reminder.';
    $('nextCue').textContent = '';
  }
}
function keymap(): void {
  const c = run.current.toLowerCase();
  const allowed = allowedChars(trail());
  const homes = new Set('asdfjkl;');
  const rows = [...([...allowed].some((k) => /[0-9]/.test(k)) ? ['1234567890'] : []), 'qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'];
  $('keymap').innerHTML = rows.map((r) => '<div class="keyrow">' + [...r].map((k) => '<span class="keycap ' + (homes.has(k) ? 'home ' : '') + (allowed.has(k) ? '' : 'locked ') + (c === k ? 'hot' : '') + '">' + escapeHtml(k.toUpperCase()) + '</span>').join('') + '</div>').join('')
    + '<div class="keyrow"><span class="keycap spacebar ' + (c === ' ' ? 'hot' : '') + '">SPACE</span></div>';
}
function render(): void { header(); labels(); prompt(); metrics(); focusGrid(); keymap(); nextVisual(); }

// ---- run lifecycle -----------------------------------------------------------
function begin(): void { if (run.status === 'playing') return; run.begin(now()); render(); }
function continueAfterResult(firstKey?: string): void {
  if (mode.kind !== 'trail') mode = { kind: 'trail' };
  resetRun(); begin(); if (firstKey !== undefined) typeKey(firstKey);
}
function typeKey(k: string): void {
  const r = run.type(k, now());
  if (r === 'ignored') return;
  if (r === 'space-wait') { prompt(); nextVisual(); $('nextCue').innerHTML = '<strong>SPACEBAR</strong> · no accuracy penalty yet'; return; }
  const last = run.strokes.at(-1)!;
  if (last.key !== ' ') keys.record(last.key, last.correct, last.latencyMs, Date.now());
  if (r === 'done') return finish();
  prompt(); metrics(); keymap(); nextVisual();
}
function abort(): void { if (run.status !== 'playing') return; toast('Run stopped.'); resetRun(); }

function starsHtml(n: number): string { let s = ''; for (let i = 1; i <= 3; i++) s += `<span class="${i <= n ? '' : 'e'}">★</span>`; return s; }

function finish(): void {
  const m = metrics();
  const t = trail();
  let title: string, copy: string, stars = 0, xp = 0;
  offer = null;
  if (mode.kind === 'trail') {
    outcome = applyRun(state, { hits: run.hits, attempts: run.attempts, maxCombo: run.maxCombo, wpm: m.wpm, acc: m.acc, now: Date.now() });
    stars = outcome.stars; xp = outcome.xp;
    const gate = effectiveGate(gateFor(t), state.settings.slowMode);
    if (!outcome.passed) {
      title = 'Not yet.'; copy = `Accuracy ${m.acc}% — this trail needs ${gate.passAcc}%. Speed never mattered here. Enter to try again.`;
      if (outcome.slowOffer) offer = { kind: 'slow' };
    } else {
      title = stars === 3 ? 'Perfect line.' : stars === 2 ? 'Clean run.' : m.acc >= 95 ? 'Good rhythm.' : 'Passed.';
      const starHint = stars === 1 ? ` ★★ needs ${gate.star2Wpm} WPM at 97%.` : stars === 2 ? ` ★★★ needs ${gate.star3Wpm} WPM at 100%.` : '';
      if (outcome.advance === 'grove') copy = `Checkpoint cleared with ★★ — Grove ${groveOf(outcome.nextTrail!).n}, ${groveOf(outcome.nextTrail!).name}, is open. Next: ${outcome.nextTrail!.name}.`;
      else if (outcome.needsTwoStars) copy = `Checkpoint cleared, but ★★ (${gate.star2Wpm} WPM at 97%) opens the next grove. Enter to run it again.`;
      else if (outcome.advance === 'trail') copy = outcome.nextTrail ? `Trail cleared. Next: ${outcome.nextTrail.name}.${starHint}` : 'Trail cleared. That was the last one on the path.';
      else if (outcome.advance === 'stage') copy = `Stage passed. Next: ${stageName()}.${starHint}`;
      else copy = `Replayed.${starHint}`;
    }
    // A struggling finger gets a drill offer after any trail run; the slow-mode offer takes precedence.
    if (!offer) {
      const hot = keys.hottest([...allowedChars(t)].filter((k) => k.length === 1 && k !== ' '));
      const f = hot ? fingerForKey(hot.key) : null;
      if (f && 'keys' in f) offer = { kind: 'remedial', finger: f };
    }
  } else {
    title = m.acc >= 95 ? 'Clean drill.' : 'Drill done.';
    copy = mode.kind === 'remedial' ? 'Enter repeats it, Space goes back to your trail.' : 'Warmed up. Enter or Space goes back to your trail.';
  }
  save();
  $('resultStars').innerHTML = mode.kind === 'trail' ? starsHtml(stars) : '';
  $('resultTitle').textContent = title; $('resultCopy').textContent = copy;
  const offerEl = $('resultOffer');
  if (offer?.kind === 'remedial') { offerEl.hidden = false; offerEl.innerHTML = `<strong>Offer</strong> Your ${escapeHtml(offer.finger.full.toLowerCase())} is struggling. Press <b>Tab</b> for a short ${escapeHtml(offer.finger.full.toLowerCase())} drill, or Enter to carry on.`; }
  else if (offer?.kind === 'slow') { offerEl.hidden = false; offerEl.innerHTML = '<strong>Offer</strong> Three misses in a row. Press <b>S</b> for slow mode — lower speed targets, stronger hand guide, same accuracy bar. Enter to keep going as is.'; }
  else offerEl.hidden = true;
  $('resultWpm').textContent = String(m.wpm); $('resultAcc').textContent = m.acc + '%'; $('resultXp').textContent = '+' + xp; $('resultCombo').textContent = String(run.maxCombo);
  arena().classList.add('result-mode'); header(); keymap(); nextVisual();
}

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
  if (offer?.kind === 'remedial') { chooseFocus(offer.finger.id); return true; }
  if (offer?.kind === 'slow') { setSlow(true); resetRun(); return true; }
  return false;
}
function setSlow(on: boolean): void {
  state.settings.slowMode = on; state.settings.guideStrong = on || state.settings.guideStrong; save();
  $('handsZone').classList.toggle('guide-strong', state.settings.guideStrong);
  $('guideBtn').textContent = state.settings.guideStrong ? 'Use normal guide' : 'Show stronger guide';
  $('slowBtn').textContent = 'Slow mode: ' + (on ? 'on' : 'off');
  toast(on ? 'Slow mode on — speed targets lowered.' : 'Slow mode off.');
}
function warmupCheck(): void {
  if (!state.settings.reviewOn) return;
  const allowed = [...allowedChars(trail())].filter((k) => k.length === 1 && k !== ' ' && k === k.toLowerCase());
  const stale = keys.stale(allowed, Date.now());
  if (!stale.length) return;
  $('message').innerHTML = `<strong>Rusty keys:</strong> ${stale.slice(0, 6).map((k) => escapeHtml(k.toUpperCase())).join(' ')} — press <strong>W</strong> for a short warm-up first.`;
  pendingWarmup = stale;
}
let pendingWarmup: string[] | null = null;
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
  if (e.key === 'Tab') { e.preventDefault(); if (!(done && acceptOffer())) openFocus(); return; }
  if (e.key === 'Enter') { e.preventDefault(); if (done) continueAfterResult(); else begin(); return; }
  if (e.key === 'Escape') { e.preventDefault(); if (done) resetRun(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ' && mode.kind !== 'trail') { e.preventDefault(); mode = { kind: 'trail' }; resetRun(); toast('Back to the trail'); return; }
  if (done && e.key.toLowerCase() === 's' && offer?.kind === 'slow') { e.preventDefault(); acceptOffer(); return; }
  if (!done && run.status === 'idle' && e.key.toLowerCase() === 'w' && pendingWarmup) { e.preventDefault(); mode = { kind: 'warmup', keys: pendingWarmup }; pendingWarmup = null; resetRun(); return; }
  if (!done && run.status === 'idle' && e.key.toLowerCase() === 'm') { e.preventDefault(); statsToast(); return; }
  if (e.key.length === 1) {
    e.preventDefault();
    if (done) continueAfterResult(e.key);
    else { begin(); typeKey(e.key); }
  }
}
document.addEventListener('keydown', (e) => {
  if (settingsModal().classList.contains('open')) { if (e.key === 'Escape') { settingsModal().classList.remove('open'); e.preventDefault(); } return; }
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
$('lessonsNav').onclick = () => { if (run.status === 'playing') { toast('Finish or reset the current run first.'); return; } mode = { kind: 'trail' }; resetRun(); toast(`Grove ${groveOf(trail()).n} · ${trail().name}`); };
$('statsNav').onclick = statsToast;
$('settingsTopBtn').onclick = () => settingsModal().classList.add('open');
$('settingsBtn').onclick = () => settingsModal().classList.add('open');
$('closeSettings').onclick = () => settingsModal().classList.remove('open');
settingsModal().onclick = (e) => { if (e.target === settingsModal()) settingsModal().classList.remove('open'); };
$('slowBtn').onclick = () => { setSlow(!state.settings.slowMode); if (run.status !== 'playing') render(); };
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
  state = sanitize(raw); keys = KeyModel.fromJSON(state.keys); mode = { kind: 'trail' }; save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); toast('Progress restored.');
}
$('resetBtn').onclick = () => { if (confirm('Reset all Keygrove progress?')) { state = fresh(); keys = new KeyModel(); mode = { kind: 'trail' }; save(); syncSettingsUi(); resetRun(); settingsModal().classList.remove('open'); toast('Fresh grove.'); } };
function syncSettingsUi(): void {
  $('handsZone').classList.toggle('guide-strong', state.settings.guideStrong);
  $('guideBtn').textContent = state.settings.guideStrong ? 'Use normal guide' : 'Show stronger guide';
  $('slowBtn').textContent = 'Slow mode: ' + (state.settings.slowMode ? 'on' : 'off');
  $('codeBtn').textContent = 'Code grove: ' + (state.settings.codeGrove ? 'on' : 'off');
}
setInterval(() => { if (run.status === 'playing') metrics(); }, 450);

syncSettingsUi(); resetRun(); warmupCheck(); save(); void loadHands(nextVisual);
Object.defineProperty(window, 'keygrove', {
  value: Object.freeze({
    snapshot: () => JSON.parse(JSON.stringify({ state, run: { text: run.text, pos: run.pos, status: run.status, hits: run.hits, attempts: run.attempts }, mode, outcome, offer: offer && { kind: offer.kind } })),
    import: (raw: unknown) => applyImport(raw),
  }),
});
