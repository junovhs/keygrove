import { LESSONS, FINGERS, fingerForKey, fingerText, type Finger } from './curriculum/lessons';
import { load, save, clean, fresh, type State } from './state/persist';
import { $, escapeHtml, toast, pick } from './ui/dom';
import { loadHands, paintHand } from './ui/hands';

interface Run {
  text: string; pos: number; status: 'idle' | 'playing' | 'complete';
  hits: number; attempts: number; errors: number; start: number;
  combo: number; maxCombo: number; wrong: boolean; xp: number; nextLesson: number | null;
}

let state: State = load();
let run: Run = newRun('');

const lessonIndex = () => Math.max(0, LESSONS.findIndex((l) => l.id === state.selected));
const lesson = () => LESSONS[lessonIndex()]!;
const focus = (): Finger | null => FINGERS.find((f) => f.id === state.focus) ?? null;
const unlocked = (i: number) => i === 0 || state.completed.includes(LESSONS[i - 1]!.id);
const arena = () => $('arena');
const settingsModal = () => $('settingsModal');

function safeSelected(): void {
  if (unlocked(lessonIndex())) return;
  let i = 0; while (i + 1 < LESSONS.length && unlocked(i + 1)) i++;
  state.selected = LESSONS[i]!.id;
}
function newRun(text: string): Run {
  return { text, pos: 0, status: 'idle', hits: 0, attempts: 0, errors: 0, start: 0, combo: 0, maxCombo: 0, wrong: false, xp: 0, nextLesson: null };
}
function makeText(): string { const f = focus(); return f ? fingerText(f) : pick(lesson().texts); }
function resetRun(): void {
  run = newRun(makeText());
  arena().classList.remove('result-mode', 'focus-mode'); render();
}
function route(): void {
  $('route').innerHTML = LESSONS.map((l, i) => '<i class="' + (i === lessonIndex() ? 'current' : state.completed.includes(l.id) ? 'done' : '') + '"></i>').join('');
  $('lessonNo').textContent = 'Lesson ' + (lessonIndex() + 1) + ' of ' + LESSONS.length;
}
function top(): void {
  $('xp').textContent = String(Math.round(state.stats.xp));
  $('streak').textContent = String(state.stats.streak);
  $('bestWpm').textContent = String(Math.round(state.stats.bestWpm));
}
const currentChar = () => run.text[run.pos] ?? '';
function prompt(): void {
  const p = $('prompt'); p.innerHTML = '';
  [...run.text].forEach((c, i) => {
    const s = document.createElement('span');
    s.textContent = c === ' ' ? 'SPACE' : c;
    s.className = 'ch' + (c === ' ' ? ' space' : '') + (i < run.pos ? ' done' : '') + (i === run.pos ? ' current' : '') + (i === run.pos && run.wrong ? ' wrong' : '');
    p.appendChild(s);
  });
}
function metrics(): { w: number; a: number; p: number } {
  const mins = run.start ? Math.max(0.01, (performance.now() - run.start) / 60000) : 0;
  const w = mins ? Math.round((run.hits / 5) / mins) : 0;
  const a = run.attempts ? Math.round(run.hits / run.attempts * 100) : 100;
  const p = Math.round(run.pos / run.text.length * 100);
  $('wpm').textContent = String(w); $('acc').textContent = a + '%'; $('pct').textContent = p + '%'; $('combo').textContent = String(run.combo);
  const fill = document.getElementById('progressFill'); if (fill) fill.style.width = p + '%';
  return { w, a, p };
}
function focusGrid(): void {
  const grid = $('focusGrid');
  grid.innerHTML = FINGERS.map((f) => '<button class="focus-key ' + (state.focus === f.id ? 'active' : '') + '" data-focus="' + f.id + '"><b>' + escapeHtml(f.anchor.toUpperCase()) + '</b>' + escapeHtml(f.name) + '</button>').join('');
  grid.querySelectorAll<HTMLElement>('[data-focus]').forEach((b) => (b.onclick = () => chooseFocus(b.dataset.focus!)));
}
function labels(): void {
  const f = focus(), l = lesson();
  $('modeLabel').textContent = f ? 'Targeted practice' : 'Typing lesson';
  $('lessonTitle').textContent = f ? 'Practice: ' + f.full : l.title;
  $('lessonCopy').textContent = f ? 'A short remedial drill for ' + f.full.toLowerCase() + '. Return to ' + f.anchor.toUpperCase() + ' after each reach.' : l.copy;
  $('summaryLabel').textContent = f ? 'Trouble spot' : 'Lesson goal';
  $('focusName').textContent = f ? f.full : 'Accuracy + rhythm';
  $('focusInstruction').textContent = f ? 'Isolate this finger briefly, then return to the regular lesson path.' : 'Build clean, repeatable motion before chasing speed.';
  $('message').innerHTML = run.status === 'playing'
    ? '<strong>Typing is live.</strong> Every letter key is typing only.'
    : '<strong>Just type</strong> to begin. Enter also starts. Tab opens optional trouble-spot practice.';
  $('unlockText').textContent = f ? 'Space returns to regular lessons.' : 'Pass at 80% and the next lesson becomes the next run.';
}
function nextVisual(): void {
  document.querySelectorAll('[data-finger-label]').forEach((x) => x.classList.remove('active'));
  const c = currentChar(), f = fingerForKey(c);
  if (c === ' ') {
    paintHand('left', 'thumb'); paintHand('right', 'thumb');
    $('handInstruction').innerHTML = '<strong>Spacebar</strong> — press with either thumb.';
    $('nextCue').innerHTML = '<strong>PRESS SPACEBAR</strong> · it will not hurt accuracy until you do';
  } else if (f) {
    paintHand('left', f.id); paintHand('right', f.id);
    document.querySelectorAll('[data-finger-label="' + f.id + '"]').forEach((x) => x.classList.add('active'));
    $('handInstruction').innerHTML = '<strong>' + escapeHtml(c.toUpperCase()) + '</strong> — ' + escapeHtml(f.full) + '. Keep the rest of your hand relaxed.';
    $('nextCue').innerHTML = 'NEXT · <strong>' + escapeHtml(c.toUpperCase()) + '</strong> · ' + escapeHtml(f.full);
  } else {
    paintHand('left', null); paintHand('right', null);
    $('handInstruction').innerHTML = '<strong>Home position</strong> — use the guide only when you need a placement reminder.';
    $('nextCue').textContent = '';
  }
}
function keymap(): void {
  const c = currentChar().toLowerCase();
  const homes = new Set('asdfjkl;');
  const rows = ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'];
  $('keymap').innerHTML = rows.map((r) => '<div class="keyrow">' + [...r].map((k) => '<span class="keycap ' + (homes.has(k) ? 'home ' : '') + (c === k ? 'hot' : '') + '">' + escapeHtml(k.toUpperCase()) + '</span>').join('') + '</div>').join('')
    + '<div class="keyrow"><span class="keycap spacebar ' + (c === ' ' ? 'hot' : '') + '">SPACE</span></div>';
}
function render(): void { top(); route(); labels(); prompt(); metrics(); focusGrid(); keymap(); nextVisual(); }
function begin(): void {
  if (run.status === 'playing') return;
  run.status = 'playing'; run.pos = run.hits = run.attempts = run.errors = run.combo = run.maxCombo = 0; run.wrong = false; run.start = performance.now(); render();
}
function continueAfterResult(firstKey?: string): void {
  if (run.nextLesson !== null) { state.selected = LESSONS[run.nextLesson]!.id; save(state); }
  resetRun(); begin(); if (firstKey !== undefined) typeKey(firstKey);
}
function typeKey(k: string): void {
  if (run.status !== 'playing' || k.length !== 1) return;
  const want = currentChar();
  if (want === ' ' && k !== ' ') {
    run.wrong = true; prompt(); nextVisual(); $('nextCue').innerHTML = '<strong>SPACEBAR</strong> · no accuracy penalty yet'; return;
  }
  run.attempts++; const ok = k === want;
  if (ok) {
    run.hits++; run.pos++; run.combo++; run.maxCombo = Math.max(run.maxCombo, run.combo); run.wrong = false;
    if (run.pos === run.text.length) return finish();
  } else { run.errors++; run.combo = 0; run.wrong = true; }
  prompt(); metrics(); keymap(); nextVisual();
}
function abort(): void { if (run.status !== 'playing') return; toast('Run stopped.'); resetRun(); }
function fingerStat(id: string) { return state.fingerStats[id] ?? (state.fingerStats[id] = { runs: 0, hits: 0, attempts: 0, bestWpm: 0, bestAcc: 0 }); }
function finish(): void {
  run.status = 'complete';
  const m = metrics(), gain = Math.max(5, Math.round(run.hits * (m.a / 100)) + Math.floor(run.maxCombo / 8) * 2); run.xp = gain;
  const st = state.stats;
  st.runs++; st.chars += run.hits; st.attempts += run.attempts; st.xp += gain; st.bestWpm = Math.max(st.bestWpm, m.w); st.bestAcc = Math.max(st.bestAcc, m.a); st.bestCombo = Math.max(st.bestCombo, run.maxCombo); st.streak = m.a >= 90 ? st.streak + 1 : 0;
  const f = focus();
  if (f) { const fs = fingerStat(f.id); fs.runs++; fs.hits += run.hits; fs.attempts += run.attempts; fs.bestWpm = Math.max(fs.bestWpm, m.w); fs.bestAcc = Math.max(fs.bestAcc, m.a); }
  else if (m.a >= 80) {
    if (!state.completed.includes(state.selected)) state.completed.push(state.selected);
    const next = lessonIndex() + 1; if (next < LESSONS.length && unlocked(next)) run.nextLesson = next;
  }
  save(state);
  const nextName = run.nextLesson !== null ? LESSONS[run.nextLesson]!.title : null;
  $('resultTitle').textContent = m.a === 100 ? 'Perfect line.' : m.a >= 95 ? 'Clean run.' : m.a >= 85 ? 'Good rhythm.' : 'Try it slower.';
  $('resultCopy').textContent = f ? 'Targeted practice complete. Enter repeats it, Space returns to regular lessons.' : m.a >= 80 ? (nextName ? 'Next up: ' + nextName + '. Enter or just start typing.' : 'Trail complete. Enter or just start typing again.') : 'Accuracy stayed below 80%. Enter or just start typing to retry.';
  $('resultWpm').textContent = String(m.w); $('resultAcc').textContent = m.a + '%'; $('resultXp').textContent = '+' + gain; $('resultCombo').textContent = String(run.maxCombo);
  arena().classList.add('result-mode'); top(); route(); keymap(); nextVisual();
}
function openFocus(): void {
  if (run.status === 'playing') { toast('Finish or reset before opening trouble-spot practice.'); return; }
  arena().classList.remove('result-mode'); arena().classList.add('focus-mode'); focusGrid();
}
function closeFocus(): void { arena().classList.remove('focus-mode'); render(); }
function chooseFocus(id: string): void {
  state.focus = id; save(state); resetRun(); const f = focus(); toast(f ? 'Targeted practice: ' + f.full : 'Back to regular lessons');
}
function handleFocusKey(e: KeyboardEvent): boolean {
  if (e.key === 'Escape') { e.preventDefault(); closeFocus(); return true; }
  if (e.key === ' ') { e.preventDefault(); chooseFocus('all'); return true; }
  const f = FINGERS.find((x) => x.anchor === e.key.toLowerCase()); if (f) { e.preventDefault(); chooseFocus(f.id); return true; }
  return false;
}
function handleIdleOrResult(e: KeyboardEvent): void {
  if (e.key === 'Tab') { e.preventDefault(); openFocus(); return; }
  if (e.key === 'Enter') { e.preventDefault(); if (run.status === 'complete') continueAfterResult(); else begin(); return; }
  if (e.key === 'Escape') { e.preventDefault(); if (run.status === 'complete') resetRun(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length === 1) {
    e.preventDefault();
    if (run.status === 'complete') continueAfterResult(e.key);
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
$('guideBtn').onclick = () => { const on = $('handsZone').classList.toggle('guide-strong'); $('guideBtn').textContent = on ? 'Use normal guide' : 'Show stronger guide'; };
$('lessonsNav').onclick = () => { if (run.status === 'playing') { toast('Finish or reset the current run first.'); return; } state.focus = 'all'; save(state); resetRun(); toast('Regular lessons'); };
$('statsNav').onclick = () => toast('Runs ' + state.stats.runs + ' · Best ' + Math.round(state.stats.bestWpm) + ' WPM');
$('settingsTopBtn').onclick = () => settingsModal().classList.add('open');
$('settingsBtn').onclick = () => settingsModal().classList.add('open');
$('closeSettings').onclick = () => settingsModal().classList.remove('open');
settingsModal().onclick = (e) => { if (e.target === settingsModal()) settingsModal().classList.remove('open'); };
$('exportBtn').onclick = () => {
  save(state);
  const u = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })), a = document.createElement('a');
  a.href = u; a.download = 'keygrove-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
};
$('importBtn').onclick = () => $('importFile').click();
$<HTMLInputElement>('importFile').onchange = async (e) => {
  const input = e.target as HTMLInputElement;
  try {
    const f = input.files?.[0]; if (!f) return;
    state = clean(JSON.parse(await f.text())); safeSelected(); save(state); resetRun(); settingsModal().classList.remove('open'); toast('Progress restored.');
  } catch { toast('That backup could not be read.'); }
  input.value = '';
};
$('resetBtn').onclick = () => { if (confirm('Reset all Keygrove progress?')) { state = fresh(); save(state); resetRun(); settingsModal().classList.remove('open'); toast('Fresh grove.'); } };
setInterval(() => { if (run.status === 'playing') metrics(); }, 450);

safeSelected(); resetRun(); save(state); void loadHands(nextVisual);
Object.defineProperty(window, 'keygrove', {
  value: Object.freeze({
    snapshot: () => JSON.parse(JSON.stringify({ state, run })),
    lessons: () => LESSONS.map((x) => ({ ...x })),
    fingers: () => FINGERS.map((x) => ({ ...x })),
  }),
});
