import { KEEPSAKES, owns, type Keepsake } from '../engine/keepsakes';
import type { SaveV6 } from '../state/save';
import { escapeHtml as esc } from './dom';
import { charmImg } from './charm-fx';
import './scene.css';

/** A charm's art for a card or tile; `quiet` art is small and sits still. */
export function objectArt(k: Keepsake, quiet = false): string {
  return charmImg(k, quiet ? 'quiet' : 'hero');
}
/** One slot in the collection: an owned charm can be summoned (and a chapter's passage replayed); a missing one shows its hint. */
export function objectCard(k: Keepsake, earned: boolean, replay = earned): string {
  if (!earned) return `<article class="object-card unearned${k.holo ? ' rare' : ''}"><span class="charm-frame">${charmImg(k, '', true)}</span><h3>?</h3><p>${esc(k.invitation)}</p></article>`;
  return `<article class="object-card${k.holo ? ' rare' : ''}"><button type="button" class="charm-frame" data-summon="${k.id}" aria-label="Summon ${esc(k.name)}">${charmImg(k)}</button><h3>${esc(k.name)}</h3><p>${esc(k.line)}</p>`
    + (k.checkpoint && replay ? `<button type="button" class="object-replay" data-replay="${k.checkpoint}">Replay its passage <span aria-hidden="true">↗</span></button>` : '')
    + '</article>';
}
/** All twenty charms, chapters first: owned ones to summon, the rest as silhouettes with the way to earn them. */
export function collectionHtml(s: SaveV6, unlockAll = false): string {
  const group = (title: string, ks: readonly Keepsake[]) => `<section class="charm-group"><h3 class="eyebrow">${title} · ${ks.filter(k => unlockAll || owns(s, k)).length} of ${ks.length}</h3><div class="collection">${ks.map(k => objectCard(k, unlockAll || owns(s, k), owns(s, k))).join('')}</div></section>`;
  return group('Chapter charms', KEEPSAKES.filter(k => k.checkpoint)) + group('Finger charms', KEEPSAKES.filter(k => k.pair));
}
