# KeyGrove curriculum handoff — 2026-09-22

> **Status, end of 2026-09-22:** the recommended order below has been carried out. Test suite green again, keyboard tour kept (CURR-48). Trace reports warmed-now / known-already / novel (CURR-49). Every new-key lesson now has one headline movement running drill → words → phrase; unrelated visits and junk fillers are gone (CURR-50). The words line warmed by its own lesson rose from 6% to about 27% on average (no threshold set). Still open in Ishoo's *Lesson coherence* plan: CURR-51 (one research-derived vocabulary) and CURR-52 (interactive briefings for chapters 2–4). Next: replay Chapters 1–2 with `?dev=1`. The rest of this document is the original handoff, kept as written.

## Why this work exists

We have been tightening KeyGrove around one teaching idea:

> Typing is a physical skill. Difficult movements should be isolated, practiced deliberately, then used immediately in real words and ordinary language.

The model is closer to classical-instrument practice than to a conventional typing game. Speed is treated as an outcome of accuracy, control, familiarity, and automaticity rather than the main training target.

The product constraint is equally important:

> Small surface, deep model.

The learner should mostly open the app, do a useful 2–5 minute lesson, and leave or continue. Do not turn this into a curriculum dashboard, giant mode system, reward economy, or research project.

## Research already completed

The movement research lives under `research/typing-movements/`.

The useful v1 reading is intentionally small:

- 43 core bigrams are a **coverage check**, not 43 things to drill.
- 11 same-finger technical targets are the explicit v1 movement set:
  `ed de ce ec tr un lo ol rt mu um`
- A few obvious chunks are useful in words:
  `ing`, `ion/tion`, `nce`, `ted`
- Everything else remains provisional until learner data justifies promoting it.

The research thread is checkpointed in:
`research/typing-movements/docs/04-movement-vocabulary-checkpoint.md`

Do not reopen the corpus research unless real learner evidence creates a concrete question.

## Product/spec work already completed

`research/typing-movements/docs/03-spec-scaffold.md` has been answered end to end.

The resulting v1 shape is:

- one obvious Continue path
- short lessons
- easy stopping at lesson boundaries
- no mode-selection screen
- movement loops, steady beat, words/etudes, and transfer text as lesson ingredients
- one small adaptive slot rather than a separate adaptive system
- no visible streaks, currencies, dashboards, live WPM, difficulty scores, or mastery bureaucracy
- intended fingering is taught, but the app never pretends it can observe which physical finger was used

That product-definition phase is closed unless testing reveals a real contradiction.

## What was implemented

The movement work is now real app behavior, not just research.

Major pieces already shipped include:

- v1 movement vocabulary exported from research into app code
- transition loops for the technical targets
- word/etude practice that follows technical work
- a simple next-practice rule that chooses a target invisibly
- steady-beat practice when a target is accurate but uneven
- transition timestamps for review
- transfer feedback when a target slips later in prose
- honest fingering copy
- dev tracing with `?dev=1`

The dev trace can be exported with:

`keygrove.dev.report()`

and cleared with:

`keygrove.dev.clear()`

It records prompts, lesson/exercise metadata, target selection, hand load, keystrokes, timing, errors, result metrics, and now within-lesson preparation data.

## First test: what it exposed

The first real Chapter 1 trace showed that the app had intelligent pieces but the lesson sequence was not yet coherent enough.

Concrete failures included:

1. Lesson 2 said it was connecting D/K with F/J, but generated almost only D/K.
2. Lesson 3 drilled `ed` heavily, then the following word exercise contained no `ed` words.
3. The first explicit technical drill was very left-hand-heavy.
4. A real user miss happened on `k → j`, while the curriculum was spending attention elsewhere.

Commit `52f761e` fixed those specific problems:

- Lesson 2 now actually uses D/K together with F/J.
- Lesson 3 pairs E↔D with the matching I↔K middle-finger movement.
- Sparse early etudes now supplement the research word list so the trained target actually appears in the following words.
- Dev traces now record prepared vs. novel within-word bigrams.

## Second test: current evidence

The latest trace is in the repo root as:

`newest-reults.txt`

The filename is currently misspelled exactly that way.

Important: this file contains both the older trace and the newer run. The newer run starts around `2026-09-22T16:40Z`. Do not mix the earlier pre-fix runs into conclusions about the latest curriculum.

The second run confirms that the targeted fixes worked:

- Lesson 2's coordination exercise now actually uses `d f j k`.
- Its final coordination exercise was about 83% composed of within-word bigrams already seen earlier in the lesson.
- Lesson 3 now does `ed ik de ki...`, then actual `ed` words.
- Lesson 3's final phrase was 100% prepared by earlier material in that lesson.

So the basic idea works when the lesson is authored coherently.

But the run exposed a deeper issue.

### The core problem now

The app still often generates each exercise somewhat independently.

As a result, “Carry it into words” frequently does **not** carry the exact movements just practiced into words.

Examples from the new run:

- Lesson 4 words: **0%** of within-word bigram occurrences had been prepared earlier in that lesson.
- Lesson 5 words: **0%** prepared.
- Lesson 7 `mu` words: **64%** prepared.
- Lesson 7 final phrase: **25%** prepared.
- Lesson 8 words: **4.3%** prepared.

Lesson 8 is a clear example:

Movement work:
`ssllssll`
then
`ssllls lsslsl lsslls`

Word work:
`life file dish lied is lid rush led fell`

Those are valid words using S/L, but most of their actual transitions were never prepared in the preceding movement work.

That is the main curriculum flaw to investigate next.

## Current working principle

The next design step should not be “patch lesson 4, then patch lesson 5.”

The stronger principle is:

> Every lesson should have a destination. Its technical work should prepare the actual movements that appear in its words, and its words should prepare the actual movements that appear in its transfer text.

In other words, lesson generation should move closer to:

1. choose useful destination words / short language
2. inspect the important movements inside them
3. rehearse those movements
4. type the words
5. use those words or movements in a short transfer phrase

rather than:

1. choose a movement
2. independently generate some words containing the new keys
3. independently generate prose

This is the closest implementation of the classical-instrument analogy: technical exercises are derived from the passage they prepare you to play.

## Instrumentation caveat

The current `preparation.preparedBigramShare` only means:

> this bigram appeared earlier in the **same lesson**

That is useful, but incomplete.

It produces misleading results for checkpoints and familiar material. For example, the Roots checkpoint can show 0% prepared even though its movements were practiced across the entire chapter.

The next instrumentation improvement should distinguish:

- **warmed now** — appeared earlier in this lesson
- **known already** — appeared in prior completed lessons / prior learner evidence
- **novel** — neither warmed in this lesson nor previously known

Then the useful question becomes:

> How much of this exercise is familiar, how much did we deliberately warm up just now, and how much is genuinely new?

Do not freeze “90% prepared / 10% novel” as a rule yet. Treat it as a hypothesis until the measurement is correct.

## Other observations from the second run

### Hand balance

The earlier “left-hand heavy” feeling is less of a global problem after the fixes.

Across the new run, word exercises were roughly balanced overall, and passage work was also roughly balanced.

Do **not** force every individual technical drill to be 50/50. A `mu` drill can be all right hand and an `ed` drill can be all left hand. The useful constraint is lesson/session balance, not artificial symmetry inside every exercise.

### Surprise preview exercises

The extra “visit” exercises deserve scrutiny.

Examples include:

- `aappapap`
- `zz..z.z.`
- `44774747`

The A/P preview produced the clearest physical confusion in the new trace: `p → [` twice.

The whole-keyboard tour in lesson 1 already gives the learner gentle exposure to the existence of the full instrument. These later surprise visits may now be redundant or disruptive.

Do not delete them blindly, but examine whether each preview actually supports the destination of its lesson.

## What to look at next

The next agent should focus on **lesson coherence**, not new features.

Recommended order:

1. Fix the dev vocabulary so traces distinguish `warmedNow / knownAlready / novel`.
2. Inspect lessons 3–8 as complete arcs, not individual generators.
3. For each lesson, identify the intended destination words / phrase first.
4. Derive the movement warm-up from those destinations.
5. Keep novelty deliberate and visible in the trace.
6. Reconsider surprise preview exercises that are unrelated to the lesson destination.
7. Re-run Chapters 1–2 in `?dev=1`.
8. Only then decide whether any numeric “prepared share” threshold is useful.

## Guardrails

Do not:

- add a new learner-facing mode
- add curriculum dashboards or scores
- add a giant prerequisite graph
- build a generic optimizer
- reopen the research taxonomy
- tune WPM
- solve this by hand-authoring dozens of brittle lessons unless a smaller generator rule can express the principle
- mistake “contains the new key” for “was prepared”

Prefer the smallest rule that makes the lesson feel intentional.

## Current question

The current question is no longer:

> Which movements should KeyGrove teach?

We have enough of that for v1.

It is:

> How do we make each short lesson feel like one coherent piece of instruction, where every exercise clearly prepares the next one?

That is the next problem.
