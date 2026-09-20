/**
 * The About & documentation content — a placeholder for now.
 *
 * Authored as typed data against the dopedocs schema, which renders it both as
 * the in-app panel (behind the brand mark) and as crawlable pages at
 * `/docs/<id>`. The engine lives in the `dopedocs` package; this file is the
 * whole of the content, and it is deliberately thin until the documentation
 * is written. Every claim a reader could act on lives once in `FACTS`.
 */

import { defineDocs, defineFacts } from 'dopedocs';

export const PRODUCT = 'Relaxed QWERTY';

export const FACTS = defineFacts({
  price: { value: 'free', reviewed: '2026-09-19' },
  storage: { value: 'this browser, or your account when signed in', reviewed: '2026-09-19' },
  account: { value: 'free and optional; it syncs progress across devices', reviewed: '2026-09-19' },
  method: { value: 'Relaxed QWERTY 1.0', reviewed: '2026-09-19' },
});

export const docs = defineDocs({
  entity: {
    name: PRODUCT,
    url: 'https://keygrove-phi.vercel.app',
    legalName: 'Strange Systems',
    notToBeConfusedWith: ['a keyboard layout', 'a keyboard remapper', 'Dvorak or Colemak'],
    sameAs: ['https://github.com/junovhs/keygrove'],
  },
  identity: {
    name: PRODUCT,
    version: '0.5.0',
    channel: 'Early access',
    maker: { name: 'Strange Systems', href: '#who-makes-this' },
  },
  title: `How ${PRODUCT} works`,
  lead: 'Documentation is being written. What is here is accurate; what is missing is coming.',
  facts: FACTS,
  sections: [
    {
      id: 'what-it-is',
      title: 'What this is',
      question: `What is ${PRODUCT}?`,
      answer: `${PRODUCT} is a ${FACTS.price.value} typing trainer that teaches the ${FACTS.method.value} method on an ordinary QWERTY keyboard: accuracy first, speed as a consequence.`,
      keywords: ['typing trainer', 'touch typing', 'relaxed qwerty'],
      blocks: [
        { kind: 'p', text: `${PRODUCT} is {fact:price}. You type short runs through a map of trails; each trail adds a few keys and only opens the next when you are accurate on the ones before.` },
        { kind: 'callout', text: 'Documentation is not ready yet. This panel will grow as the method guide, the progression and the coach are written up.' },
      ],
    },
    {
      id: 'the-method',
      title: 'The method',
      question: 'What is the Relaxed QWERTY typing method?',
      answer: 'Relaxed QWERTY keeps the standard QWERTY map and a stable finger-to-key relationship, but lets the hands move naturally instead of holding the rigid historical home-row posture — the bottom row in particular is reassigned (Z ring, X middle, C index, B right index).',
      keywords: ['relaxed qwerty', 'finger assignment', 'bottom row'],
      blocks: [
        { kind: 'p', text: 'You learn {fact:method}. Traditional touch typing is a selectable alternative in Settings for people who already type that way.' },
      ],
    },
    {
      id: 'your-data',
      title: 'Your data',
      question: `Where does ${PRODUCT} store my progress?`,
      answer: `${PRODUCT} stores your progress in ${FACTS.storage.value}; an account is ${FACTS.account.value}.`,
      keywords: ['privacy', 'progress', 'account'],
      blocks: [
        { kind: 'p', text: 'Your progress lives in {fact:storage}. An account is {fact:account}. Guest progress stays in this browser after closing the tab. A new account carries it forward; signing into an existing account opens that account’s course. You can export a backup any time. Reset in Settings clears everything and asks twice. A guest page makes no request to the account service.' },
      ],
    },
    {
      id: 'who-makes-this',
      title: 'Who makes this',
      question: `Who makes ${PRODUCT}?`,
      answer: `${PRODUCT} is made by Strange Systems, the studio behind CropASAP and No Ceremony.`,
      blocks: [
        { kind: 'p', text: 'Strange Systems makes small, keyboard-first tools. One free account works across all of them.' },
      ],
    },
  ],
});
