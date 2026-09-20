# RQWERTY — guided course progression

Current implementation contract under Ishoo **DEC-07**. This replaces the earlier fixed-run, rhythm-star and XP progression proposal. Stable source/save IDs still use `grove` and `trail`; the interface calls them chapters and lessons.

## One course, one next action

A learner follows 36 lessons in seven chapters. Continue either presents the next useful passage, inserts one short targeted practice after a repeated error pattern, or advances one visible exercise after a passage meets its accuracy target. The final exercise opens the next lesson. A practice always returns to the course; it does not recursively generate more practices. The player can skip it. A due review at the start of a visit offers a short warm-up, also skippable.

The Course book is optional navigation. Cleared lessons can be revisited. A keepsake replay returns to the earliest unfinished main-course lesson. Earned chapters and keepsakes persist through absence and method changes. No daily retention mechanic, speed gate, spendable currency or random loot exists.

## Curriculum

| Chapter | Lessons | Content | Lesson accuracy target | Keepsake |
|---|---:|---|---:|---|
| Roots | 1–6 | F J + Space, D K, E I, G H, first words | 90% | Little fir |
| Home | 7–11 | R U, S L, A ;, home words | 91% | Blue cup |
| Canopy | 12–15 | T Y, W O, Q P | 92% | Paper kite |
| Undergrowth | 16–21 | V M, C B, X comma, Z period, N slash | 94% | Emerald beetle |
| Bark | 22–26 | Opposite-hand Shift, sentences, quotes, questions, dashes, colons, parentheses | 95% | Sealed letter |
| Rings | 27–31 | Numbers, dates, prices, common symbols | 95% | Brass watch |
| Flow | 32–36 | Sequences, common words, pangrams, longer text, final mixed assessment | 96% | Music box |
| Code (optional) | 37–40 | Brackets, angles, arrows, snippets | 96% | Folded fox |

Code is enabled in Settings and opens after Bark. It never blocks the main course. Endurance and the final passage are lengths of text, not timed tests. Text generation never introduces characters outside a lesson’s cumulative key set. Introduced keys and chapter coverage are guaranteed rather than left to sampling. The final assessment is an authored passage with varied openings, all taught characters in context, and a deliberate ending.

## Evidence to clear a lesson

Lessons expose a finite sequence before practice: four exercises for a new letter pair (meet, connect, useful words, application), three for a new Shift/number/symbol skill, two for application lessons, and one chapter assessment. The first two lessons have an intentionally limited alphabet, so their application is rhythm and deliberate Space use; real words begin with E/I and become two-handed with G/H.

Every passing exercise advances immediately at the shown target; checkpoints require **97%**. Mastery, rhythm and speed never veto a pass. Failed attempts retry only the current exercise. Saved exercise counts survive reload/sync, and all previously completed lessons remain completed. Older recorded passes are still credited; new partial exercise results are never misread as legacy lesson clears.

The header and results identify exercise number, purpose and next action; the result view carries the Continue action. Opening Course or Keepsakes during typing restarts the unfinished passage and opens navigation immediately.

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

## Learning loop: the product baseline

The north star is a Duolingo-like typing course with Relaxed QWERTY as its default: small, purposeful learning steps that accumulate into usable writing. The analogy governs lesson design, not streak pressure or reward inflation.

- **Second to second:** one readable target, immediate correction, the appropriate finger/Shift guide, and a short enough exercise to understand its purpose. Space is a skill and a word boundary, not a compulsory separator after every two letters.
- **Minute to minute:** meet a movement, connect it with familiar movements, use real words, then apply it in a phrase or passage. Each pass gives a visible next step. A failed exercise retries that step, not the whole lesson. New-key movement introductions are roughly 16–28 characters before coverage; word work is around 40 and early transfer around 32–56.
- **Across a session:** finish a small lesson, reinforce earlier keys in the next lesson, and use a chapter passage to put the accumulated skills together. Course browsing is always available; leaving an unfinished run restarts that passage. There is no required session duration or speed gate.
- **Across days:** return to the saved exercise, optionally warm up due keys with the existing bounded review, and continue. Completed exercises, lessons and paired-side passes remain earned. Absence never removes progress. Later chapters devote more practice to messages, sentences, numbers and longer writing.

This is an implemented baseline to evaluate with learners, not a claim about an optimal scientific exercise ratio or a promise of learning outcomes. Further changes should address observed learning friction rather than add undirected repetition.

### Planned main-course distribution

Counts below are derived from `lessonExercises` across the 36 main lessons. These count first-pass exercises, not random retries, optional review or character/time percentages. “Passage” includes constrained lowercase phrases early and sentences/practical text later. The two pattern-only opening lessons cannot honestly offer normal words from F/J/D/K; words are required from E/I onward. After those openings, 7 of Roots' remaining 11 exercises are word/phrase work.

| Chapter | Movement | Words / useful context | Phrases / passages | Total |
|---|---:|---:|---:|---:|
| Roots | 12 | 3 | 4 | 19 |
| Home | 6 | 4 | 5 | 15 |
| Canopy | 6 | 3 | 4 | 13 |
| Undergrowth | 10 | 5 | 6 | 21 |
| Bark | 3 | 4 | 5 | 12 |
| Rings | 3 | 4 | 5 | 12 |
| Flow | 0 | 4 | 5 | 9 |
| **Total** | **40** | **27** | **34** | **101** |

About 40% movement practice and 60% language/application overall. New-letter lessons split two movement exercises and two application exercises. Later chapters lean further toward readable text. Words are filtered to taught keys. Early vocabulary prioritizes familiar words and names, avoiding unexplained fragments such as `iii`, `diff` and `ref`. Authored phrases are selected whole, never mutilated to fit the alphabet. Lowercase is intentional until Shift is taught; punctuation appears only when taught.

### Briefings: just-in-time coaching

Each Chapter 1 lesson opens with a briefing before its first exercise instead of dropping the learner into text. The heading reads "Before you begin" with the lesson's purpose; the hand illustrations and keyboard light only the finger and key the step is about (the other home-row badges are hidden); and a card steps through one message at a time — as few as the lesson needs, never more than four. A new-key lesson opens with an interactive step: empty, pulsing key tiles ask for each new key with the named finger; a correct press fills its tile, a wrong one nudges the empty tile; when every tile is filled a check mark draws, a beat passes, and the briefing advances by itself. Text steps use a Next button; the last one reads "Start typing · Enter". Only Enter, → or the button advance a text step, so stray typing never skips one; Escape skips the whole briefing. Content lives in `src/curriculum/briefings.ts`, names fingers through the same `{f}` placeholders as lesson copy (so it follows the active method), and coaches the physical basics: hands still, fingers grounded on F and J, press down not across, read ahead. A briefing shows once per lesson per session; later exercises and retries go straight to the passage. Later chapters have no briefings yet.

### The lesson shell

There is no introduction modal: Relaxed QWERTY is the default and Settings → Method toggles to traditional touch typing and back (the four reassigned keys lose their evidence; earned lessons stay). The text box carries a restart icon in its top-right corner and, while idle, a prominent "Begin typing when you're ready" cue; typing starts the passage. The footer shows metrics only. Extra practice (finger courses) is an orange button at the start of the main navigation. The stronger hand guide is always on. The result view carries its own Continue and alternative action.

### Hand and finger load

Movement blocks split evenly between hands by construction, but real words do not: over the original Roots set F J D K E I R U, English vocabulary runs about 83/17 left because E, D, R and F are common while J and K are the rarest letters. Measured over many seeds, Roots word and passage exercises ran 76–89% left-hand and the left middle finger alone pressed more than half of all keys. Two changes correct this:

- **G H arrive in Roots, R U move to Home.** H is one of the most frequent letters and sits under the right index finger, so the right hand gets real words (`he`, `hi`, `hid`, `high`, `hide`) in the first chapter. This keeps the spec's strong-finger core (index and middle fingers) while making the early vocabulary two-handed.
- **Word and phrase selection is balance-aware.** For words and passage exercises the generator samples a handful of candidates from the usual weak-key-weighted pool and keeps the one that holds the running left/right split nearest to even without one finger dominating, and without repeating the previous phrase. Thin phrase pools are widened rather than repeated.

A regression test (`src/engine/balance.test.ts`) holds every words/passage exercise in the four letter chapters within 40–60 left/right under both methods, each letter chapter within 45–55, no finger above half, and any finger the lesson is not introducing under roughly 30–35%. Lesson `Last Reaches` (N and slash) is the one whose two new keys both belong to the right hand; its short movement drill is single-handed by design. Finger Focus courses are intentionally single-finger and are excluded. Shift, number, symbol and Flow chapters are not yet held to this rule.

### Space and paired finger courses

The first three F/J exercises contain no spaces; exercise four explicitly introduces either-thumb Space. Later movement drills use short six-letter blocks instead of one Space per bigram. Normal words, phrases and sentences use natural spaces. The paired finger landmark run also has no Space, with spacing explained in its next reach exercise.

Each finger pair has three short movement levels, then real pair-key words, tricky word movements, short phrases, words with Shift, word/number labels, symbols in context, and a final review plus sentences. Exhaustive Cartesian key-pair lists are gone. Both sides still qualify independently; the next attempt concentrates on whichever side remains unfinished.

Examples for Index fingers without main-course prerequisites include `fur`, `try`, `murmur`, `rhythm`, and `try my curry`. Later words may also use keys from completed main-course lessons. Where a pair cannot make a useful phrase alone, only the needed helper letters are explicitly introduced with a short primer and the hand guide; previously learned helpers need no primer. For example Middle fingers can use `i did it` after meeting helper T. The final transfer introduces any needed full stop explicitly. Existing finger-level credit is preserved when content improves.
