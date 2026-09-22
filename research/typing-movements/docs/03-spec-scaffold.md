# KeyJam — Spec Scaffold

This is intentionally a **decision list**, not a giant specification.

Each question should be answerable independently by an agent without redesigning the whole product.

Resolved decisions should replace questions with short answers.

---

# A. Core experience

Answered 2026-09-22 (SPEC-01). Inputs taken as given: DEC-14 (three forms, one Continue, deletion test), DEC-11 (guided vs assessed), and the research checkpoint (`docs/04-movement-vocabulary-checkpoint.md`: 43 core bigrams for coverage, 11 technical targets, a few chunks). Each answer: **Default** · **Reason** · **Today** (what the app already does).

## A1. Entry

**Default:** The default screen *is* the next exercise, ready to type: one line of purpose ("3/5 · Connect the movements"), one sentence of instruction, the text, the hands. No home page, no mode choice. The first keystroke starts the run; the only button is Start/Continue. Lessons and settings stay in the small top nav.

**Reason:** "Open → practice → done" means the open state is already practice. Anything between the learner and the first key is cost.

**Today:** Already true. `main.ts` boots into the current trail's current exercise; the once-per-session briefing (`briefings.ts`) precedes a lesson's first exercise and is skippable with Escape. No change.

## A2. Lesson duration

**Default:** A lesson is 3–5 exercises, each 16–48 characters, totalling about 120–200 characters plus reading — roughly 2–5 minutes at beginner pace, under 2 at fluent pace. Duration is a *budget on text length*, never a timer: nothing counts down, nothing ends early.

**Reason:** Short enough to finish in one sitting without deciding to; long enough for a target to be introduced, connected and used once. A timer would make pace visible, which DEC-14 forbids.

**Today:** Already true by construction (`lesson-flow.ts`: exercise lengths 16–48; 3–5 exercises per trail). No change. Alternative rejected: a fixed 3-minute clock — would cut a slow learner mid-word.

## A3. Lesson completion

**Default:** A lesson is complete when its last exercise ends. Guided exercises end on completion; assessed ones on reaching the chapter's visible accuracy target (DEC-11). Every exercise pass is saved immediately, so a lesson is never "lost". The result screen after the last exercise shows the lesson name, one sentence, characters typed / missed keys, and — for assessed runs — accuracy. Nothing else.

**Reason:** Completion should be a fact the learner can feel ("I typed it, it was accurate"), not a computed judgment.

**Today:** Already true (`progress.ts` saves `lessonSteps` per exercise; result screen is small). No change.

## A4. Continue behavior

**Default:** One button, always labelled by what it leads to ("Next: Carry it into words", "Retry: A small phrase", "Settle the tricky part"). Continue goes to the next exercise, then the next lesson, without a summary between lessons beyond the one result screen. A coach step (brief targeted practice) may sit between two exercises when accuracy warrants; it is presented as the next thing, not as a detour. Escape or Enter on the result screen also continues.

**Reason:** A single obvious next action is the whole navigation model (DEC-14). The label carries the purpose so no menu is needed.

**Today:** Already true (`continueAfterResult`, `nextAction` labels, coach `gate`). No change.

## A5. Leaving

**Default:** Closing the app at any result screen is a clean stop: the next exercise is already the saved position, and reopening shows it with no "you left" message, no streak, no penalty. Leaving mid-run (Escape) discards only that run's text; the exercise is still where it was. There is no end-of-day ritual and no unfinished-lesson warning.

**Reason:** "Easy to stop after any lesson" means the app never asks the learner to account for stopping. A lesson boundary is every exercise boundary.

**Today:** Already true (`lessonSteps` persist per exercise; `abort()` just resets the run). Remove: nothing today nags on exit. No change.

---

# B. Lesson anatomy

The three learner-facing forms of DEC-14 — **transition loop**, **steady beat**, **words / etude** — plus **transfer** (ordinary prose) are *ingredients of one lesson*, not separate lesson types or a taxonomy. A lesson names one target (a key, a technical transition, or a chunk) and runs 3–5 exercises drawn from these ingredients, by default in the order find → loop → words → transfer, with steady beat replacing the loop when the target is already accurate but uneven. Both the order and the beat rule are working defaults, not architecture: they should be cheap to change once real use says otherwise.

## B1. Transition loop

**Default:** One target transition (v1: one of `ed de ce ec tr un lo ol rt mu um`) typed as a short phrase in both directions with a rest between — for `mu`: `mu um mum mu um mum` — 20–28 characters, assessed at the chapter accuracy target, no speed. The instruction names the mechanics ("same finger, bottom to top"), never which finger the learner *did* use (DEC-15).

**Reason:** The transition is the unit (DEC-13); both directions expose the return movement. Short, because the loop only makes the movement deliberate before it hides inside words.

**Today:** Partly. `move('Connect the movements')` exists (length 24) but draws on all unlocked keys, not a named target. Change → CURR-39.

**Sketch (≈45 s):**
- 0 s — Screen shows "2/4 · Connect M and U", one line: "Same finger, bottom to top. Let the finger travel; do not reset to J between."
- 0–3 s — Learner reads the 24-character line `mu um mum mu um mum mu um`. Hands show R-index lit.
- 3–35 s — Types it. Each correct press ticks; a miss shrugs. No clock.
- 35 s — Result: "24 characters · 1 missed key · 96%". Continue → "Next: Carry it into words".

## B2. Steady beat

**Default:** The B1 phrase typed to a soft regular pulse — a quiet tick and a dot that fills on the beat — set from the learner's own recent pace, rounded slow; never a target to beat. Feedback is timing *quality*, once at the end: one word ("Even" / "Uneven") and a small three-bar glyph. Never WPM, never "faster". Existing audio toggle; no metronome setting.

**Reason:** DEC-14: steady beat trains timing quality, not pace. A pulse from the learner's own speed cannot push.

**Today:** Not present. Rhythm is measured (`run.rhythm()`) and cues exist (`ui/sound.ts`); no pulse or evenness display. Change → CURR-40. Rejected: adjustable BPM — a setting for its own sake.

**Sketch (≈50 s):**
- 0 s — "2/4 · Keep it even", one line: "A quiet pulse at your own pace. Land each press near it; nothing is timed."
- 0–4 s — Two free beats sound so the pace is heard before typing. Line: `ed de dee ed de dee ed de`.
- 4–40 s — Learner types; the dot fills on each beat, presses that land near it fill it fully, late or early ones fill it partly. No count, no score visible.
- 40 s — Result: "Even" (or "Mostly even" / "Uneven") with the three-bar glyph. Continue → "Next: Carry it into words".

## B3. Words / etudes

**Default:** 32–48 characters of everyday words containing the target, from the research practice-word set (`outputs/candidates/practice_words.csv`), short carriers first, with two or three ordinary words mixed in so it reads as language — for `mu`: `much must mud music the museum much`. Assessed at the chapter accuracy target. The target is named once in the instruction; words are not highlighted.

**Reason:** DEC-13: every technical target returns to real words in the same lesson. The word set is already filtered for everyday use; the app only picks from it.

**Today:** Partly. `use('Carry it into words')` exists; words come from the trail's word bank and weak-pair heat, not a target's carrier set. Change → CURR-41.

**Sketch (≈60 s):**
- 0 s — "3/4 · Carry it into words", one line: "M then U inside real words. See the whole word before you start it."
- 0–4 s — Line of ~40 characters: `much must mud music the museum much`.
- 4–55 s — Types it; word-end cue on each Space.
- 55 s — Result: "38 characters · no missed keys · 100%". Continue → "Next: A small phrase".

## B4. Transfer

**Default:** Every technical lesson ends with one ordinary-prose exercise (48–60 characters) *not* built around the target: a plain sentence from the existing passage generator. The target usually appears because it is common; nothing forces it. If the target was missed there, the result says so in one line — no separate "transfer" score.

**Reason:** DEC-10 / DEC-13: technique returns to prose in the same lesson, unforced, so ordinary typing is the measure.

**Today:** Already true in shape (`'passage'` exercises close most lessons). Change: the one-line note when the target was missed in prose → CURR-43.

## B5. Variety

**Default:** No menu. Variety comes from two axes only: the *target* the lesson names, and the *form* in slot 2 — loop when the target is new or inaccurate, steady beat when accurate but uneven. Chunk lessons (`ing`, `ion`, `nce`, `ted`) use words and prose only. The learner sees the purpose line change, never a choice. Guided "visits" keep their occasional slot.

**Reason:** DEC-14: the app chooses form and target; the learner sees purpose and Continue. Two axes add no system.

**Today:** Partly. Order is fixed per trail kind in `lesson-flow.ts`; no target-level form choice. The rule itself is SPEC-02 / CURR-44; this answer only fixes that it is invisible and two-axis.

---

# C. Curriculum

Answered 2026-09-22 (SPEC-02). Settled inputs: `docs/04-movement-vocabulary-checkpoint.md` — 43 core bigrams are coverage, not drills; the 11 technical targets are `ed de ce ec tr un lo ol rt mu um`; the obvious chunks are `ing`, `ion/tion`, `nce`, `ted`; everything else is provisional. The shipped 40-lesson course (`src/curriculum/trails.ts`) keeps its ids and order (DEC-12, carried by DEC-17). Every default below is heuristic and provisional until learner data exists.

## C1. First lessons

**Default:** Lessons 1–5 stay exactly as shipped: F J (+ Space) → D K → E I → G H → V M, then the Roots checkpoint. The movement vocabulary adds one thing: lesson 3 ("Your First Words", E I) uses `ed`/`de` as its slot-2 loop, because those are the first technical target whose keys exist and the single most common same-finger movement in English. Nothing else changes in Roots.

**Reason:** The first five lessons already teach find → connect → alternate → words (DEC-10). The one addition names a real movement on day one without adding a lesson.

**Today:** Order and keys already true. Change: lesson 3's loop targets `ed` → CURR-39.

## C2. Key introduction

**Default:** Two keys per lesson, in the shipped order: letters complete by lesson 19 (Undergrowth), with `, .` alongside `x z` and `/` at lesson 20. Every unlocked key stays in play in every later lesson's words and prose. No key is withheld for being "hard"; B, Q, P, Z get lessons where they are, not later.

**Reason:** The pace is already tested; re-ordering saved lesson ids is forbidden (DEC-12, carried by DEC-17), and there is no evidence any key is mis-placed.

**Today:** Already true. No change.

## C3. Transition selection

**Default:** Exactly the 11 technical targets get isolated practice, and only in slot 2 of an ordinary lesson (B1/B2). A target becomes *eligible* at the first lesson where both its keys are unlocked: `ed de` → lesson 3; `mu um` → 7 (R U); `tr rt un` → 10 (N T); `ce ec` → 12 (C Y); `lo ol` → 13 (W O). Each lesson's slot 2 takes one eligible target — the one with the weakest evidence, or the newest-eligible when none has evidence (D5). Lessons that unlock no target (S L, A ;, Q P, B, X, Z, /) still run a slot-2 loop on an eligible target, so all 11 get at least one dedicated slot before Bark. The 43 core bigrams are never drilled; the generator is checked for producing them (C5).

**Reason:** DEC-13: mass + mechanics. The list is closed so that variety comes from *which* target, not from inventing new ones.

**Today:** Slot 2 draws on all unlocked keys and weak pairs. Change → CURR-39 (target-driven loop), CURR-44 (which target).

## C4. Gesture selection

**Default:** No isolated gesture practice in v1. The four chunks enter as *words* (slot 3): `ted` and `ing` from lesson 10 (N T unlocked), `nce` from 12, `ion`/`tion` from 13 — the etude for that lesson draws its words from the chunk's practice-word set instead of a transition's. In Flow, the "Bigrams" trail (`bigrams` kind) becomes the chunks' home: its lines are built from the four chunk word sets rather than weak pairs.

**Reason:** The chunks are already the commonest sequences in the language; a loop on `ing` would over-practise what every sentence practises. Words are enough. Provisional: a chunk loop can be added later if transfer data (D4) shows one never settles.

**Today:** The Flow Bigrams trail exists with weak-pair text. Change → CURR-41 (chunk etudes).

**Amended 2026-09-22 (CURR-50):** Lesson words now always carry the movement slot 2 just drilled; the chunks no longer replace them at lessons 10/12/13. Their home is the Flow Bigrams lesson plus ordinary prose. Reason: in the second dev trace, `tr` was drilled and then `king ring thing` followed, and `lo` was drilled and then `lion union onion` — the words did not use what was just practised.

**C3 amendment (CURR-50):** A new-key lesson with no technical target now gets a headline movement too: the most common English bigram (universal across all three corpora, from `COMMON_TRANSITIONS`) that uses one of its new letters and has ≥ 4 everyday carrier words. Examples: `hi` (G H), `ve` (V M), `is` (S L), `ar` (A ;), `pe` (Q P), `be` (B), `ex` (X), `ze` (Z). Slot 2 loops it, the words carry it, and the phrase opens with it. The technical pick still wins where one touches the new keys (`ed`, `mu`, `tr`, `ce`, `lo` for a first-time learner).

## C5. Sequence

**Default:** One prerequisite only: a target or chunk appears when both (all) of its keys are unlocked. There is no dependency between targets, no mastery gate before the next target, and no prerequisite graph. Checkpoints stay as they are: chapter accuracy only (DEC-11). Coverage check: the words/prose generators over any unlocked-key set must be able to produce every core bigram whose two keys are unlocked — a test, not a runtime system.

**Reason:** Key unlock is the only prerequisite the research supports; anything else would be a mastery bureaucracy on top of guesses.

**Today:** Unlock-by-trail already true. Change: the coverage test → CURR-41 (alongside the etude sourcing).

## C6. Review

**Default:** Review is not a mode. A previously seen technical target returns as slot 2 of an ordinary lesson when it is the learner's weakest eligible target (D3) or has not been seen for 7 days, whichever comes first; at most one review target per lesson, never displacing a lesson whose own new target has no evidence yet. Keys keep the existing spaced schedule (`KeyModel.due`, interval doubling to 30 days) and the coach's "Find your rhythm again" warm-up for overdue keys stays as is.

**Reason:** DEC-10: revisit skills in new contexts. Putting review inside a normal lesson keeps one Continue and zero extra screens.

**Today:** Key review exists (`dueKeys`, coach `review`). Transition recency has no field → the one new field is `TransitionStat.last` (ms of last press) → CURR-42.

## C7. Real-world keyboard skills

**Default:** As shipped. Comma and period with X and Z (lessons 18–19); `/` at 20; Shift at 22 (Bark, opposite-hand Shift); quotes, dashes, colons, parentheses at 24–25; numbers 27–29 and symbols 30 (Rings); brackets and code in the optional Code grove. Backspace is not a lesson key in v1: a miss is marked and the line continues, so no lesson teaches correction. Shortcuts (Ctrl-Z, Ctrl-A…) are out of v1.

**Reason:** Letters and their same-finger movements are the whole point of the first 20 lessons; punctuation arrives when sentences do. Nothing in the research speaks to Shift or punctuation (DEC-16 — separate corpus needed).

**Today:** Already true. No change. Alternative rejected: early Shift for capitalised sentences — Bark is 22 lessons in, which is 1–2 hours of practice, soon enough.

---

# D. Adaptation

All measurements are the existing models (`src/engine/transitions.ts`, `keymodel.ts`, `errors.ts`, `progress.ts`) read as they are. Guided runs never feed them (DEC-11). No new scoring framework; one new field (D2/C6).

## D1. Accuracy

**Default:** Two existing measurements, and only these: per-transition error rate `TransitionStat.err` (EMA, α = 0.15) for choosing targets, and the run's `ErrorTally` from `classifyRun` for the coach's *kind* of help (a dominant `neighbour` class → precision drill; `timing` → steady beat). Per-key `KeyStat.err` keeps driving key review. Accuracy against the chapter target decides passing; nothing else is gated on accuracy.

**Reason:** These already exist and are already trusted for stars and coaching. Adding a new accuracy score would be a second opinion with no new evidence.

**Today:** Already true. No change.

## D2. Hesitation

**Default:** A transition's latency is judged only against the learner's own reference — `TransitionModel.slowness(pair)` = `lat / reference()`, where the reference is the median EMA latency over the learner's pairs. A pair counts as hesitant when `slowness ≥ 1.5` with `seen ≥ 6`. Thinking pauses are separated by measuring only the second key of a within-word pair (spaces end a pair) and by the EMA: a single long pause moves `lat` by 15%, a habitual one moves it all the way. Latency is never shown to the learner.

**Reason:** A ratio to the learner's own pace cannot punish a slow typist (DEC-14); the EMA already filters one-off thought.

**Today:** Already true (`slowness`, `reference`, `weakest(minSeen = 6)`). Change: add `TransitionStat.last` so recency is known → CURR-42.

## D3. Mastery

**Default:** "Comfortable" = the existing `TransitionModel.mastery(pair) ≥ 0.6`: at least 12 correct presses, `err` low, `slowness` near 1, and evenness. It is used for exactly two things — ranking targets for slot 2 (weakest first) and choosing beat over loop (B5: accurate but uneven = `err ≤ 0.1` and the evenness term low). It never gates progress, never appears on screen, and is never summed into a level.

**Reason:** The model exists and is already what the coach and weak-pair heat use. A separate mastery ledger is the bureaucracy DEC-14 rules out.

**Today:** Already true. No change.

## D4. Transfer

**Default:** After a technical lesson, the slot-4 prose run records the same `TransitionStat` for the target as any run does — there is no separate transfer measurement. Transfer "held" when the target's `err` and `slowness` in the prose run were not worse than in the slot-2 loop; when it was missed in prose, the result says so in one line (B4) and the target simply stays weakest, so D5 brings it back. Provisional: if this proves too coarse, the first refinement is per-run (not EMA) stats for the target, still no new screen.

**Reason:** The prose run *is* the transfer test; a second instrument would measure the same keystrokes twice.

**Today:** Model records prose runs already. Change: the one-line note → CURR-43.

## D5. Next lesson

**Default:** Continue always goes to the next uncleared trail in course order; adaptation only chooses slot 2's target and form. In pseudo-code, over `trans: TransitionModel`, `unlocked` keys, the 11 `TARGETS`, and the new `last` field:

```
eligible = [t for t in TARGETS if both keys of t in unlocked]
fresh    = [t for t in eligible if trans.stat(t) is undefined]          # never practised
stale    = [t for t in eligible if now - trans.stat(t).last > 7 days]
target   = fresh[0] ?? min(stale + eligible, key = trans.mastery)       # newest-eligible, else weakest
form     = 'beat' if trans.stat(target).err <= 0.1 and uneven(target) else 'loop'
```

`uneven` is the evenness term already inside `mastery` (cv > 0.6). If `eligible` is empty (lessons 1–2), slot 2 is the shipped generic loop. That is the whole rule.

**Reason:** Course position from `progress.ts`, weakness from the learner's own reference, recency from one field. Five lines; no optimizer, no levels. Provisional by design — the thresholds 0.6 / 1.5 / 0.1 / 7 days are the first thing to tune when data arrives.

**Today:** Not present. Change → CURR-44 (rule), CURR-42 (`last` field).

---

# E. Fingering and technique

Answered 2026-09-22 (SPEC-03). DEC-15 applies verbatim: the app prescribes and shows the intended finger, may *suggest* a technique check from timing and error patterns, and never states or scores which finger was used. Default · Reason · Today, as before.

## E1. Finger instruction

**Default:** When a key is introduced, the hands show the intended finger lit with the key's letter above it, the keymap highlights the key, and the instruction names the finger once in words ("E uses your left middle finger"). During ordinary typing the hands keep showing the finger for the *next* key; the learner can hover any key to see its finger. Nothing else.

**Reason:** Three redundant channels (hands, keymap, one sentence) at introduction; one quiet channel afterwards.

**Today:** Already true (`ui/hands.ts` badges, keymap hover, `{f}`-style finger copy in briefings). No change.

## E2. Unobservable fingering

**Default:** Every technique message is a suggestion tied to the observable pattern, in this exact shape: *"⟨what was observed⟩ — check that ⟨key⟩ uses your ⟨intended finger⟩."* e.g. "R → T was slow three times — check that R uses your left index finger." Never "you used the wrong finger", never a fingering score. Error classes are named by pattern (neighbour, anticipation, repetition, omission, timing); the shipped `finger` class is shown as "same-finger slip — check the finger for ⟨key⟩", not as a fact.

**Reason:** A keyboard reports keys, not fingers. A suggestion the learner can verify with their own hands is useful; a verdict they cannot verify teaches distrust.

**Today:** Mostly true; the `finger` error class copy ("finger-confusion errors") still reads as a verdict. Change → CURR-45 (already filed).

## E3. Technique reminders

**Default:** Reminders appear in three places only: (1) the once-per-lesson briefing, when a lesson introduces a new reach; (2) the result card, at most one technique line per run, and only when a pattern stood out; (3) the idle hand line ("Let your hands rest comfortably") while not typing. Hard cap: one reminder per run, none during typing. No posture reminders, no timers, no "sit up straight".

**Reason:** Reminders during typing are nagging; a single line at a boundary is a note.

**Today:** Already true (briefing steps, `explain()` on the result card, idle hand text). No change.

---

# F. Feedback

## F1. Correct input

**Default:** Keep exactly what ships: the typed glyph settles, a soft key tick (pitch rising slightly with a clean sequence), a warmer cue on Space, the accuracy figure in the corner. No particles for correctness, no streak counter on screen, no praise text mid-run.

**Reason:** Correct typing should feel like nothing happening, plus a small pleasant sound; anything more competes with reading the next word.

**Today:** Already true (`ui/sound.ts` key/word cues, canvas prompt). The combo metric is hidden. No change.

## F2. Error

**Default:** The wrong glyph is marked in place, a low "shrug" cue plays, the shake is subtle, the cursor moves on. The miss is remembered for the result card; nothing interrupts. Guided runs play no miss sound (DEC-11). No red flash, no penalty, no accuracy drop animated.

**Reason:** Immediate and obvious, but quiet enough that a run with five misses still feels like practice, not failure.

**Today:** Already true (miss cue, wrong-key mark, `guided()` silences it). No change.

## F3. Corrections

**Default:** Continue past errors in every lesson form — loop, beat, words, prose. A miss is marked and the next key is the next key. There is no Backspace in lessons and no correction mode (I1). The one exception is guided "find the key" steps: a wrong key does nothing except nudge the tile, so the learner tries again.

**Reason:** Correcting mid-line trains looking down and stopping; the result card teaches better than a retype. One policy is easier to feel than three.

**Today:** Already true (`Run.type` marks and advances; brief steps nudge). No change.

## F4. Speed

**Default:** WPM is recorded every run (`bestWpm`, `Run` metrics) and shown in exactly one place: the **Flow chapter checkpoint result card**, as "Your pace", after the accuracy line. Everywhere else — live metrics, ordinary result cards, the map, keepsakes — it stays hidden. No target, no ladder, no "faster" copy.

**Reason:** DEC-14: speed is a long-term outcome, never live pressure. By Flow the learner has ~35 lessons of accuracy behind them; one honest number then is information, not a goal.

**Today:** WPM is hidden everywhere (`index.html` `hidden` on `#wpm`, `#resultWpm`). Change: unhide on the Flow checkpoint card only — a one-attribute change folded into the result-card work of CURR-43 (no new issue).

## F5. Rhythm quality

**Default:** One visual and one optional sound, both already specified in B2: a dot that fills on each beat (full when the press lands near it, partial when early or late), and a quiet tick on the beat behind the existing audio toggle. Result: one word — "Even", "Mostly even", "Uneven" — and the three-bar evenness glyph. No timing numbers, no per-key timing marks, no "late!" text.

**Reason:** The learner should be able to *hear* whether they were even; the glyph confirms it. Numbers would make it a score.

**Today:** Not present. Change → CURR-40 (already filed).

---

# G. Progress

## G1. Immediate

**Default:** The existing result card, unchanged: lesson name, one sentence of copy, "N characters typed · M missed keys" (or "Settled this time: E · D" when keys stabilised), accuracy for assessed runs, a keepsake if a chapter just closed, and one Continue labelled by what comes next. At most one technique line (E3). No stars animation, no XP, no "+12".

**Reason:** The learner needs to know two things: it went fine, and what is next.

**Today:** Already true. Stars are computed but the card leads with the sentence. No change.

## G2. Daily

**Default:** None. The only reason to return is that the next lesson is ready and short. `stats.days` and `lastDay` stay recorded and unshown; there is no streak display, no reminder, no "come back tomorrow" copy, no notification.

**Reason:** A streak makes a missed day a loss (I3 #4). A three-minute lesson that is always ready is the whole return mechanism.

**Today:** Already true — the streak fields exist but nothing displays them. Remove nothing; keep them unshown.

## G3. Long term

**Default:** Two things only: the **map** (chapters and lessons cleared, the current position) and the **keepsakes** (one permanent object per chapter checkpoint, DEC-10). Together they read as "how far I have come" without a number. XP stays computed and stored for compatibility but is never shown and drives nothing. No levels, ranks, currencies, mastery percentages or dashboards.

**Reason:** Capability is best represented by the course itself: what has been done, and the objects that mark it. Anything numeric becomes something to chase.

**Today:** Already true (`ui/map.ts`, `engine/keepsakes.ts`; XP unused on screen). No change.

---

# H. Research decisions

Answered 2026-09-22 (SPEC-04). Settled provisionally by `docs/04-movement-vocabulary-checkpoint.md`; not reopened here. Each answer points at the artefact.

## H1. Corpus stability

`outputs/cross-corpus-stability.md`, `outputs/tables/*_cross_corpus.csv`. At bigram level "which corpus" barely matters: no Google Books top-200 bigram falls out of the top-300 elsewhere. 25 of the top-30 same-finger transitions are universal; the top nine (`ed de ce ec tr un lo ol rt`) hold their order in all three corpora. Trigrams diverge (62 book artefacts, mostly Latinate or function-word chunks).

## H2. Technical vocabulary

`outputs/candidates/technical_transitions.csv` (40, provisional). v1 uses 11: `ed de ce ec tr un lo ol rt mu um` — the stable same-finger nine plus the `mu/um` pair. The other 29 rows (row jumps, stretches, pinky reaches) stay in the CSV, unused.

## H3. Gesture vocabulary

`outputs/candidates/gestures.csv` (30 + 10, provisional). v1 uses four chunks as *words only*: `ing`, `ion/tion`, `nce`, `ted`. No isolated gesture practice.

## H4. Practice words

`outputs/candidates/practice_words.csv` — up to 12 everyday words per target (SUBTLEX ≥ ~5/million, ≥ 100 films, mostly lower-case, no names/profanity/contraction stems), short carriers first. Good enough to ship; not proven to be good drill words.

## H5. Learner data

Replace, in this order, when the signal exists (all from `TransitionModel` unless noted):

| assumption | minimum learner signal |
|---|---|
| the 11-target set (membership) | `err` and `slowness` per target over ≥ 6 seen, across ≥ 30 learners: any target nobody finds hard leaves; any universal bigram many find hard enters |
| stability thresholds N = 200 / 500 / 30 | none — these only ever mattered for selection; learner data replaces the whole selection step |
| loop-vs-beat rule (`err ≤ 0.1` and uneven) | evenness term of `mastery` before vs after a beat exercise |
| practice-word floor and ordering | per-word `err` in etudes (needs no new field; per-run `KeyModel`/`TransitionModel` already see it) |
| any mechanical-class weighting | never introduce one before the row above exists (DEC-16) |

---

# I. Product boundaries

## I1. What is explicitly not in v1?

**Definitely in v1:** the 40-lesson course as shipped; one Continue; the three forms as lesson ingredients (B); the 11 targets in slot 2 and the four chunks as words (C); the D5 rule with one new field; keepsakes and the map as they are; accounts and cross-device sync; the manual; audio cues and the toggle; the settings that exist.

**Definitely out:** rewards, streaks shown as pressure, currencies, dashboards, live WPM, difficulty readouts, mode menus, correction modes, Backspace lessons, keyboard shortcuts, geometry profiles, audio-reactive text, isolated gesture loops, the other 29 technical rows, 4-gram gestures, any composite difficulty score.

**Open BACKLOG verdicts (Progression v1 / Accounts v1):**

| issue | verdict | action |
|---|---|---|
| REND-03 audio-reactive prompt | remove | declined — decoration that pulls attention from the text (I3) |
| CURR-05 Code grove snippet bank | freeze | shelved — the optional grove that shipped stays; no expansion |
| CURR-16 correction modes | remove | declined — settings for their own sake; Backspace is out of v1 (C7) |
| CURR-17 keyboard geometry profiles | freeze | shelved — real need for some keyboards, not a v1 problem |
| ACCT-04 shared account package | keep (later) | unchanged — infrastructure, no learner surface |

**Shipped features:** finger courses, extra practice, coach drills, explore-a-key — **keep, frozen** (not expanded into modes; DEC-14). Relaxed learning plan: CURR-36 keep (saves must not lose credit); CURR-31/35 freeze pending the CURR build issues.

## I2. What can be added later without changing the core model?

Only things that read existing fields or fill an existing slot: tuning the D5 thresholds; swapping which 11 targets; a chunk loop if D4 shows a chunk never settles; per-run target stats for D4; more practice words. Each is a data change or a one-field change, not a screen.

## I3. What would make the product feel like work rather than practice?

Deletion test — reject any CURR/UI issue that answers **yes** to one of these:

1. Does it add a screen between opening the app and the first keystroke?
2. Does it ask the learner to choose a mode, target, or difficulty?
3. Does it show a number the learner is meant to raise (WPM, level, XP, score)?
4. Does it make stopping feel like abandoning something (streak, "unfinished", nag)?
5. Does it add a setting whose only justification is that someone might want it?
6. Does it add a lesson form beyond loop / beat / words / prose?
7. Does it assert difficulty or mastery the learner cannot feel in their own hands?
8. Would deleting it change nothing a learner would notice in a week?

---

# Working rule

When answering these questions:

1. Prefer the simpler design.
2. Give a concrete default.
3. State the reason briefly.
4. Note meaningful alternatives only when necessary.
5. Do not expand the product merely because an idea is interesting.
