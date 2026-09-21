import { type Keepsake, ownedKeepsakes } from '../engine/keepsakes';
import type { SaveV6 } from '../state/save';
import { escapeHtml as esc } from './dom';
import './scene.css';

const shapes: Record<string, string> = {
  fir: '<path d="M59 84V47" stroke="#805940" stroke-width="7"/><path d="M60 17 38 49h12L29 72h62L70 49h12Z" fill="currentColor"/><path d="m60 22 0 47H37" fill="none" stroke="#fff" opacity=".25" stroke-width="3"/>',
  cup: '<path d="M79 39h8c19 0 19 26 0 26h-9" fill="none" stroke="currentColor" stroke-width="9"/><path d="M30 34h53v36q0 16-26 16T30 70Z" fill="currentColor"/><ellipse cx="56" cy="35" rx="26" ry="7" fill="#294571"/><ellipse cx="56" cy="34" rx="20" ry="4" fill="#8c583d"/><path d="M38 47v18" stroke="#fff" opacity=".4" stroke-width="4" stroke-linecap="round"/><path d="M50 25q-8-6 0-14m15 14q-8-6 0-14" fill="none" stroke="#bbb0a1" stroke-width="2"/>',
  kite: '<path d="M61 13 88 38 61 70 32 38Z" fill="currentColor"/><path d="M61 13v57L32 38Z" fill="#eabf55"/><path d="m32 38 56 0M61 13v57" stroke="#905e40" stroke-width="2"/><path d="M61 70q-23 7-9 18t25 5" fill="none" stroke="#8b8173" stroke-width="2"/><path d="m49 79-10-5 2 11Zm17 12 12-7-1 12Z" fill="currentColor"/>',
  beetle: '<path d="m43 43-15-8m13 22-17 2m20 10-14 13m47-39 15-8M79 57l17 2M76 69l14 13" stroke="#526556" stroke-width="3" stroke-linecap="round"/><ellipse cx="60" cy="35" rx="13" ry="13" fill="#293e37"/><ellipse cx="60" cy="59" rx="25" ry="31" fill="currentColor"/><path d="M60 29v60" stroke="#234b48" stroke-width="3"/><path d="M46 43q-7 11-5 21" stroke="#8cd2a7" stroke-width="5" fill="none" stroke-linecap="round"/><path d="m53 26-6-10m20 10 6-10" stroke="#293e37" stroke-width="2"/>',
  letter: '<path d="m23 34 69-6 5 51-70 6Z" fill="#e4c49a"/><path d="m23 34 38 26 31-32M27 85l28-31m42 25L67 54" fill="none" stroke="#b89469" stroke-width="2"/><circle cx="62" cy="57" r="12" fill="currentColor"/><path d="m57 57 4 4 6-9" fill="none" stroke="#fac3bd" stroke-width="2"/>',
  watch: '<path d="M53 18v-7h14v7m-7-7V5" stroke="currentColor" stroke-width="5" fill="none"/><circle cx="60" cy="55" r="35" fill="currentColor"/><circle cx="60" cy="55" r="28" fill="#f8edda"/><path d="M60 32v23l15 8" stroke="#493f38" stroke-width="3" stroke-linecap="round"/><path d="M60 30v4m25 21h-4M60 80v-4M35 55h4" stroke="#b47a28" stroke-width="2"/><circle cx="60" cy="55" r="3" fill="currentColor"/>',
  music: '<path d="m24 51 41-15 33 15-42 18Z" fill="#ab96d0"/><path d="M24 51v29l32 16V69Z" fill="currentColor"/><path d="m56 69 42-18v28L56 96Z" fill="#57467c"/><path d="m24 51 6-29 41-14-6 28Z" fill="currentColor"/><path d="m35 25 28-10-3 15-28 10Z" fill="#d6c7df"/><path d="m72 66 9-4v13l-9 4Z" fill="#dcb968"/><path d="M77 40V25l11-3v12" stroke="#b58c43" stroke-width="3" fill="none"/><ellipse cx="74" cy="41" rx="5" ry="3" fill="#b58c43"/><ellipse cx="85" cy="35" rx="5" ry="3" fill="#b58c43"/>',
  fox: '<path d="m28 25 30 15 34-19-7 43-28 23-25-22Z" fill="currentColor"/><path d="m28 25 29 40 35-44-7 43-28 23-25-22Z" fill="#f0b06d"/><path d="m32 65 25 22 28-23-28 8Z" fill="#f7e8cf"/><path d="m52 73 5 7 5-7Z" fill="#483d39"/><path d="m40 56 7 5m25-5-7 5" stroke="#483d39" stroke-width="3"/>',
};
export function objectArt(k: Keepsake, quiet = false): string {
  return `<svg class="keepsake-art${quiet ? ' quiet' : ''}" viewBox="0 0 120 110" role="img" aria-label="${esc(k.name)}" style="color:${k.color}"><ellipse cx="60" cy="99" rx="35" ry="4" fill="#433e30" opacity=".09"/><g class="object-body">${shapes[k.id] ?? shapes.fir}</g></svg>`;
}
export function objectCard(k: Keepsake, earned = true): string {
  return `<article class="object-card${earned ? '' : ' unearned'}">${objectArt(k, !earned)}<span class="eyebrow">${earned ? 'Yours to keep' : 'At the chapter’s end'}</span><h3>${esc(k.name)}</h3><p>${esc(earned ? k.line : k.invitation)}</p>${earned ? `<button type="button" class="object-replay" data-replay="${k.checkpoint}">Play its passage again <span aria-hidden="true">↗</span></button>` : ''}</article>`;
}
export function collectionHtml(s: SaveV6): string {
  const owned = ownedKeepsakes(s);
  return owned.length ? `<div class="collection">${owned.map(k => objectCard(k)).join('')}</div>` : '<p class="collection-empty">Your first keepsake is waiting at the end of Roots. Each one remembers something your hands learned.</p>';
}
