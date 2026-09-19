import { GROVES, TRAILS, gateFor, trailsInGrove, type Trail } from '../curriculum';
import { focusKeys, groveOpen, isCleared, minMastery, trailUnlocked } from '../engine/progress';
import type { KeyModel } from '../engine/keymodel';
import type { SaveV6 } from '../state/save';
import { escapeHtml } from './dom';

export interface MapHandlers { onSelect(trail: Trail): void; onClose(): void }

const stars = (n: number) => { let s = ''; for (let i = 1; i <= 3; i++) s += `<span class="${i <= n ? '' : 'e'}">★</span>`; return s; };

/** Render the grove map into `root`. Returns a keyboard handler for arrows/Enter/Esc. */
export function renderMap(root: HTMLElement, state: SaveV6, model: KeyModel, h: MapHandlers): (e: KeyboardEvent) => void {
  const now = Date.now();
  const visible = GROVES.filter((g) => !g.optional || state.settings.codeGrove);
  root.innerHTML = visible.map((g) => {
    const open = groveOpen(state, g.id);
    const ts = trailsInGrove(g.id);
    const gate = gateFor(ts[0]!);
    const cleared = ts.filter((t) => isCleared(state, t.id)).length;
    const total = ts.reduce((n, t) => n + (state.trails[t.id]?.stars ?? 0), 0);
    return `<section class="grove ${open ? '' : 'grove-locked'} ${g.optional ? 'grove-optional' : ''}">
      <header class="grove-head"><span class="grove-no">Grove ${g.n}${g.optional ? ' · optional' : ''}</span><h3>${escapeHtml(g.name)}</h3>
        <span class="grove-gate">acc ≥ ${gate.passAcc}% · ★★ steady rhythm · swift ${g.ladder ? g.ladder.join('/') : gate.swiftWpm}+ wpm</span>
        <span class="grove-sum">${cleared}/${ts.length} cleared · ${total}/${ts.length * 3} ★</span></header>
      ${ts.map((t) => {
        const p = state.trails[t.id];
        const unlocked = trailUnlocked(state, t);
        const cur = state.trail === t.id;
        const done = isCleared(state, t.id);
        const st = p?.stars ?? 0;
        const mastery = unlocked && p && p.runs > 0 ? Math.round(minMastery(focusKeys(t, model, now), model, now) * 100) : null;
        return `<button type="button" class="map-trail ${cur ? 'current' : ''} ${done ? 'done' : ''} ${unlocked ? '' : 'locked'} ${t.checkpoint ? 'cp' : ''}" data-trail="${t.id}" ${unlocked ? '' : 'disabled'} aria-current="${cur ? 'step' : 'false'}">
          <span class="map-n">${t.n}</span>
          <span class="map-body"><span class="map-name">${escapeHtml(t.name)}</span>
            <span class="map-keys">${t.shift ? '+ Shift' : t.newKeys ? '+ ' + escapeHtml([...t.newKeys].join(' ').toUpperCase()) : t.checkpoint ? 'mixed run' : 'no new keys'}${t.space ? ' + Space' : ''}</span>
            ${unlocked ? `<span class="map-stars">${st ? stars(st) : '<span class="e">★★★</span>'}</span>` : ''}
          </span>
          ${mastery !== null ? `<span class="map-mastery ${done ? 'done' : ''}" title="mastery of this trail's keys · ${p?.runs ?? 0} runs">${mastery}%</span>` : ''}
        </button>`;
      }).join('')}
    </section>`;
  }).join('');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.map-trail')];
  buttons.forEach((b) => (b.onclick = () => { const t = TRAILS.find((x) => x.id === b.dataset.trail); if (t) h.onSelect(t); }));
  const focusable = buttons.filter((b) => !b.disabled);
  let idx = Math.max(0, focusable.findIndex((b) => b.classList.contains('current')));
  focusable[idx]?.focus();
  return (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); h.onClose(); return; }
    if (!focusable.length) return;
    const cols = visible.length;
    const col = (b: HTMLButtonElement) => visible.findIndex((g) => g.id === TRAILS.find((t) => t.id === b.dataset.trail)!.grove);
    const move = (d: number) => { idx = (idx + d + focusable.length) % focusable.length; focusable[idx]!.focus(); };
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const c = col(focusable[idx]!), want = (c + (e.key === 'ArrowRight' ? 1 : -1) + cols) % cols;
      const j = focusable.findIndex((b) => col(b) === want); if (j >= 0) { idx = j; focusable[idx]!.focus(); }
    }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusable[idx]!.click(); }
  };
}
