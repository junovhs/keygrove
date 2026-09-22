# KeyGrove — Spec Scaffold

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

The three learner-facing forms of DEC-14 — **transition loop**, **steady beat**, **words / etude** — plus **transfer** (ordinary prose) are *ingredients of one lesson*, not separate lesson types or a taxonomy. A lesson names one target (a key, a technical transition, or a chunk) and runs 3–5 exercises drawn from these ingredients in a fixed order: find → loop → words → transfer. Steady beat replaces the loop when the target is already accurate but uneven.

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

## C1. First lessons

**Question:** What should a true beginner encounter in the first five lessons?

## C2. Key introduction

**Question:** How quickly should the keyboard be introduced?

## C3. Transition selection

**Question:** Which transitions deserve explicit isolated practice rather than being learned incidentally?

## C4. Gesture selection

**Question:** Which trigrams or short gestures deserve explicit practice?

## C5. Sequence

**Question:** What prerequisites, if any, should block a movement from appearing?

## C6. Review

**Question:** How should old movements return over time?

## C7. Real-world keyboard skills

**Question:** When should Shift, punctuation, numbers, symbols, Backspace, and shortcuts enter the curriculum?

---

# D. Adaptation

## D1. Accuracy

**Question:** What error measurements should influence future lessons?

## D2. Hesitation

**Question:** How should transition latency be measured without confusing thoughtful typing with difficulty?

## D3. Mastery

**Question:** What evidence is enough to call a movement comfortable?

## D4. Transfer

**Question:** How do we determine whether an isolated improvement persists in normal prose?

## D5. Next lesson

**Question:** What is the simplest reasonable rule for choosing the next lesson?

Start simple. Do not build a giant optimizer until needed.

---

# E. Fingering and technique

## E1. Finger instruction

**Question:** How is intended fingering shown when a movement is introduced?

## E2. Unobservable fingering

**Question:** How should the product communicate technique guidance without pretending it knows which finger was physically used?

## E3. Technique reminders

**Question:** When should the app remind a learner about relaxation, posture, or fingering?

Avoid constant nagging.

---

# F. Feedback

## F1. Correct input

**Question:** What visual/audio response accompanies correct typing?

## F2. Error

**Question:** What happens immediately when a learner mistypes?

## F3. Corrections

**Question:** Should the learner always correct errors, sometimes correct them, or continue depending on exercise type?

## F4. Speed

**Question:** Where, if anywhere, is WPM shown?

Current principle: measure speed without making it the central task.

## F5. Rhythm quality

**Question:** What feedback makes steady-beat practice understandable?

---

# G. Progress

## G1. Immediate

**Question:** What does the learner see when a short lesson ends?

## G2. Daily

**Question:** Is there any daily-return mechanism beyond “there is another useful lesson ready”?

## G3. Long term

**Question:** What is the simplest representation of growing capability?

Avoid elaborate economies unless they prove necessary.

---

# H. Research decisions

## H1. Corpus stability

**Question:** Which high-value transitions remain important across Google Books, web text, and SUBTLEX-US?

## H2. Technical vocabulary

**Question:** What compact set of transitions deserves first-class curriculum status?

## H3. Gesture vocabulary

**Question:** What compact set of 3–4 character gestures deserves first-class curriculum status?

## H4. Practice words

**Question:** What words provide the best natural practice for each technical target?

## H5. Learner data

**Question:** Once real learner data exists, which research assumptions should be replaced with empirical error/hesitation measurements?

---

# I. Product boundaries

## I1. What is explicitly not in v1?

Answer this aggressively.

## I2. What can be added later without changing the core model?

## I3. What would make the product feel like work rather than practice?

Use this as a deletion test.

---

# Working rule

When answering these questions:

1. Prefer the simpler design.
2. Give a concrete default.
3. State the reason briefly.
4. Note meaningful alternatives only when necessary.
5. Do not expand the product merely because an idea is interesting.
