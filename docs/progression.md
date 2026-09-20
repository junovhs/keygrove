# RQWERTY — guided course progression

Current implementation contract under Ishoo **DEC-05**. This replaces the earlier fixed-run, rhythm-star and XP progression proposal. Stable source/save IDs still use `grove` and `trail`; the interface calls them chapters and lessons.

## One course, one next action

A learner follows 36 lessons in seven chapters. Continue either presents the next useful passage, inserts one short targeted practice after a repeated error pattern, or opens the next lesson after sufficient evidence. A practice always returns to the course; it does not recursively generate more practices. The player can skip it. A due review at the start of a visit offers a short warm-up, also skippable.

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

All conditions must hold:

1. The latest two course attempts meet the chapter’s accuracy target.
2. Every focus key has at least 0.8 mastery. Focus is the new keys (plus Space on lesson 1), or the five weakest cumulative keys when none are introduced.
3. The completed attempt **started in the words stage**. Improving enough during a drill does not make that drill count as transfer.
4. For checkpoints, the latest passage also reaches **97% accuracy**.

There is no five-run quota, speed requirement, consecutive-clean-run escape hatch or two-star chapter gate. Short patterns precede real words when the available alphabet cannot form words yet. Stages are drill below 0.35 minimum focus mastery, mix below 0.7, then words. Lessons without new keys use mix below 0.5, otherwise words.

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

Save version remains 6. Legacy `stars`, `xp`, `days`, `cleanStreak`, WPM references and rank helpers remain for compatibility, but do not govern the visible experience. Old clears are retained. Account and guest storage are separate. A new account adopts current guest progress; an existing account loads its own progress. Replays save the course destination rather than moving the learner backwards.

## Verification

- All 40 trails × three stages × 50 seeds use allowed characters, fit a bounded passage length and include their intended keys.
- A simulated learner types generated passages slowly through all 40 lessons using each method, including recoverable mistakes, without a coverage dead end.
- Regression tests exercise transfer-stage gating, repeated accuracy samples, no absence penalty, honest missed-space accuracy, bounded review coverage, guest/account isolation, migration and permanent keepsakes.
- Browser checks use real key events and the normal Import interface for isolated late-course fixtures. They cover first use, repair/return, welcome-back practice, chapter reveals, keepsake replay, the final assessment, keyboard navigation and narrow viewports.

These checks establish software behavior. They are not longitudinal evidence of learning outcomes or a guarantee of typing speed.
