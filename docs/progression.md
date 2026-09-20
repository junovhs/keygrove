# RQWERTY — guided course progression

Current implementation contract under Ishoo **DEC-07**. This replaces the earlier fixed-run, rhythm-star and XP progression proposal. Stable source/save IDs still use `grove` and `trail`; the interface calls them chapters and lessons.

## One course, one next action

A learner follows 36 lessons in seven chapters. Continue either presents the next useful passage, inserts one short targeted practice after a repeated error pattern, or advances one visible exercise after a passage meets its accuracy target. The final exercise opens the next lesson. A practice always returns to the course; it does not recursively generate more practices. The player can skip it. A due review at the start of a visit offers a short warm-up, also skippable.

The Course book is optional navigation. Cleared lessons can be revisited. A keepsake replay returns to the earliest unfinished main-course lesson. Earned chapters and keepsakes persist through absence and method changes. No daily retention mechanic, speed gate, spendable currency or random loot exists.

## Curriculum

| Chapter | Lessons | Content | Lesson accuracy target | Keepsake |
|---|---:|---|---:|---|
| Roots | 1–6 | F J + Space, D K, E I, R U, first words | 90% | Little fir |
| Home | 7–11 | S L, A ;, G H, home words | 91% | Blue cup |
| Canopy | 12–15 | T Y, W O, Q P | 92% | Paper kite |
| Undergrowth | 16–21 | V M, C B, X comma, Z period, N slash | 94% | Emerald beetle |
| Bark | 22–26 | Opposite-hand Shift, sentences, quotes, questions, dashes, colons, parentheses | 95% | Sealed letter |
| Rings | 27–31 | Numbers, dates, prices, common symbols | 95% | Brass watch |
| Flow | 32–36 | Sequences, common words, pangrams, longer text, final mixed assessment | 96% | Music box |
| Code (optional) | 37–40 | Brackets, angles, arrows, snippets | 96% | Folded fox |

Code is enabled in Settings and opens after Bark. It never blocks the main course. Endurance and the final passage are lengths of text, not timed tests. Text generation never introduces characters outside a lesson’s cumulative key set. Introduced keys and chapter coverage are guaranteed rather than left to sampling. The final assessment is an authored passage with varied openings, all taught characters in context, and a deliberate ending.

## Evidence to clear a lesson

Lessons expose a finite sequence before practice: four exercises for a new letter pair (meet, connect, useful words, application), three for a new Shift/number/symbol skill, two for application lessons, and one chapter assessment. The first two lessons have an intentionally limited alphabet, so their application is rhythm and deliberate Space use; real words begin with E/I.

Every passing exercise advances immediately at the shown target; checkpoints require **97%**. Mastery, rhythm and speed never veto a pass. Failed attempts retry only the current exercise. Saved exercise counts survive reload/sync, and all previously completed lessons remain completed. Older recorded passes are still credited; new partial exercise results are never misread as legacy lesson clears.

The header and results identify exercise number, purpose and next action. Opening Course or Keepsakes during typing restarts the unfinished passage and opens navigation immediately.

## Key model and timing

- Key observations use exponential moving averages with alpha 0.15.
- Volume = min(1, correct presses / 24).
- Accuracy evidence = clamp((1 − error EMA − 0.80) / 0.15).
- Mastery = volume × (0.9 × accuracy evidence + 0.1 × timing evidence). Space uses timing evidence 1.
- Timing evidence describes variation relative to the learner’s own timing, not a WPM standard.
- The UI supplies timing only after a correct consecutive within-word press, excluding word boundaries, retries and interruptions of at least two seconds.
- Every printable incorrect attempt counts, including a letter where Space was required. Incorrect characters do not advance the cursor.
- Due dates schedule review. They **do not decay mastery or revoke clears**.

A browser cannot observe which finger actually pressed a key. The guide follows the canonical active method; it does not claim to verify posture or finger compliance. Switching methods retains completed lessons and resets observations for the reassigned Z/X/C/B keys and their transitions.

## Feedback and returning

Results show accuracy, observed WPM, characters/misses or newly settled keys, and the next action. An earned checkpoint reveals a small authored SVG object. Collection ownership derives from permanent checkpoint clears; old saves gain the appropriate objects without another migration or claim action.

Only repeated mistakes trigger automatic targeted practice. Timing-only observations do not redirect the learner. Warmups and repairs have bounded text lengths and cover their named keys. A line beneath the prompt follows completed words. Correct-key animation is limited to small word-boundary marks, with reduced-motion support. Longer passages use a three-line window following the cursor.

## Save compatibility

Save version remains 6. Legacy `stars`, `xp`, `days`, `cleanStreak`, WPM references and rank helpers remain for compatibility, but do not govern the visible experience. Old clears are retained. Recorded passing attempts formerly blocked by hidden requirements are credited on load, including account sync and imports; a newly credited current lesson moves to the next unfinished lesson. Existing intentional replay selections stay intact. Account and guest storage are separate. A new account adopts current guest progress; an existing account loads its own progress. Replays save the course destination rather than moving the learner backwards.

## Verification

- All 40 trails × three stages × 50 seeds use allowed characters, fit a bounded passage length and include their intended keys.
- A simulated learner types generated passages slowly through all 40 lessons using each method, including recoverable mistakes, without a coverage dead end.
- Regression tests exercise explicit exercise advancement, explicit accuracy boundaries, credit for previously trapped learners, no absence penalty, honest missed-space accuracy, bounded review coverage, guest/account isolation, migration and permanent keepsakes.
- Browser checks use real key events and the normal Import interface for isolated late-course fixtures. They cover first use, repair/return, welcome-back practice, chapter reveals, keepsake replay, the final assessment, keyboard navigation and narrow viewports.

These checks establish software behavior. They are not longitudinal evidence of learning outcomes or a guarantee of typing speed.
