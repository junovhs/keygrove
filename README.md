# KeyGrove

*Working name; the final product name is undecided. The repository and package are `keygrove`.*

A short-lesson typing course: Duolingo's structure with classical-guitar practice. Each lesson finds its new keys, isolates one research-chosen movement, carries it into real words, then uses those words in a phrase. Traditional touch typing is the default method; Relaxed QWERTY 1.0 is an opt-in alternative.

36 lessons across seven chapters cover letters, capitals, punctuation, numbers and longer mixed text. Four optional code lessons follow Bark. One Continue action leads through the course. Seven illustrated keepsakes mark the main chapters, and Code has an eighth. Speed and absence never gate progress.

## Development

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

TypeScript 7 native compiler, Vite, vanilla DOM/SVG UI, and a canvas typing prompt laid out with Pretext. `?dom=1` enables the diagnostic DOM prompt. `?dev=1` keeps a session trace of every run (`keygrove.dev.report()` in the console), including how much of each exercise the lesson warmed up. The About panel and static `/docs/` pages share `src/docs-content.ts` through dopedocs.

Guest learning persists locally in a separate save. The optional account uses Supabase; see [account setup](docs/accounts.md). Never put privileged credentials in the browser build.

## Product contracts

- [North star](docs/north-star.md): what the product is and is not.
- [Course progression](docs/progression.md): chapters, lesson anatomy, evidence, balance and compatibility.
- [Relaxed QWERTY method](docs/typing-method-spec.md): the opt-in method's finger assignments.
- [Movement research](research/typing-movements/): corpus analysis behind the movement vocabulary. `make download analyze export` regenerates `src/curriculum/movements.ts`.
- Ishoo ADRs DEC-10 to DEC-16 govern the method, curriculum, evidence and product surface. Work is tracked in Ishoo (plans *Movement vocabulary* and *Lesson coherence*).

The app observes characters and timing, not finger choice or posture. Completing the course shows performance on its passages; it does not promise a particular real-world typing speed.

## Verification

Tests cover every trail and stage across deterministic seeds, allowed-key and checkpoint coverage, the 43 core-bigram coverage check, hand and finger balance, each lesson's drill → words → phrase contract, both methods through all 40 lessons, timing and accuracy, guest/account isolation, save migration and permanent keepsakes. Browser checks drive the real app with key events in headless Chrome.
