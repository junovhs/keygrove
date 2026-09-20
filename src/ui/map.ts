import { lessonExercises } from '../curriculum/lesson-flow';
import { GROVES, TRAILS, resolveCopy, trailsInGrove, type Trail } from '../curriculum';
import { groveOpen, isCleared, trailUnlocked } from '../engine/progress';
import type { KeyModel } from '../engine/keymodel';
import type { SaveV6 } from '../state/save';
import { escapeHtml as esc } from './dom';
import { keepsakeFor } from '../engine/keepsakes';
import { objectArt } from './scene';
export interface MapHandlers { onSelect(trail: Trail): void; onClose(): void }

/** The fieldbook reveals one chapter at a time; earlier passages remain available to revisit. */
export function renderMap(root: HTMLElement, state: SaveV6, _model: KeyModel, h: MapHandlers): (e: KeyboardEvent) => void {
  const visible = GROVES.filter(g => !g.optional || state.settings.codeGrove);
  const current = TRAILS.find(t => t.id === state.trail)!;
  root.innerHTML = visible.map(g => {
    const ts = trailsInGrove(g.id), open = groveOpen(state, g.id);
    const cleared = ts.filter(t => isCleared(state, t.id)).length;
    const earned = isCleared(state, keepsakeFor(g.id).checkpoint);
    return `<details class="chapter ${open ? '' : 'chapter-locked'}" ${current.grove === g.id ? 'open' : ''}>
      <summary><span class="chapter-number">${earned ? objectArt(keepsakeFor(g.id), true) : String(g.n).padStart(2, '0')}</span><span><span class="eyebrow">${g.optional ? 'Optional chapter' : 'Chapter ' + g.n}</span><strong>${esc(g.name)}</strong><small>${esc(resolveCopy(g.blurb))}</small></span><span class="chapter-status">${earned ? 'Complete ✓' : open ? `${cleared} / ${ts.length}` : 'Up ahead'}</span></summary>
      <div class="chapter-lessons">${ts.map(t => {
        const done = isCleared(state, t.id), unlocked = trailUnlocked(state, t), cur = t.id === state.trail;
        return `<button type="button" class="map-trail ${cur ? 'current' : ''} ${done ? 'done' : ''}" data-trail="${t.id}" ${unlocked ? '' : 'disabled'} ${cur ? 'aria-current="step"' : ''}><span class="map-n">${done ? '✓' : t.n}</span><span class="map-body"><span class="map-name">${esc(t.name)}</span><span class="map-keys">${t.checkpoint ? 'A chapter passage · a keepsake to remember it' : t.shift ? 'Opposite-hand Shift' : t.newKeys ? esc([...t.newKeys].join(' ').toUpperCase()) : 'Put familiar keys to work'}${!done ? ` · ${state.lessonSteps[t.id] ?? 0}/${lessonExercises(t).length} exercises` : ''}</span></span><span class="lesson-state">${done ? 'Revisit ↗' : cur ? 'Continue →' : unlocked ? 'Begin →' : ''}</span></button>`;
      }).join('')}</div></details>`;
  }).join('');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-trail]')];
  buttons.forEach(b => b.onclick = () => { const t = TRAILS.find(x => x.id === b.dataset.trail); if (t) h.onSelect(t); });
  buttons.find(b => b.getAttribute('aria-current') === 'step')?.focus({ preventScroll: true });
  return e => {
    if (e.key === 'Escape') { e.preventDefault(); h.onClose(); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const choices = [...root.querySelectorAll<HTMLElement>('summary,button:not([disabled])')].filter(b => b.offsetParent !== null);
    const i = choices.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault(); choices[(i + (e.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length]?.focus();
  };
}
