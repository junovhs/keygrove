# KeyJam — course progression

Current implementation contract under Ishoo DEC-10 (instrument-style practice), DEC-11 (guided vs assessed evidence), DEC-17 (standard touch typing), DEC-13 (research-chosen movements) and DEC-14 (small surface). Stable source/save IDs still use `grove` and `trail`; the interface calls them chapters and lessons.

## One course, one next action

A learner follows 36 lessons in seven chapters. Continue presents the next exercise; after repeated errors it may insert one short targeted practice, which always returns to the course and can be skipped. A due review at the start of a visit offers a short, skippable warm-up. Which technical movement a lesson drills is chosen invisibly (spec D5); the learner only ever sees purpose and Continue.

The Course book is optional navigation. Cleared lessons can be revisited, and a keepsake replay returns to the earliest unfinished lesson. Earned chapters and keepsakes persist through absence and method changes. There is no daily retention mechanic, speed gate, spendable currency or random loot.

## Curriculum

| Chapter | Lessons | New keys, in order (headline movement) | Accuracy target | Keepsake |
|---|---:|---|---:|---|
| Roots | 1–6 | F J + Space, D K, E I (`ed`), G H (`hi`), V M (`ve`), checkpoint | 90% | Little fir |
| Home | 7–11 | R U (`mu` / `er`), S L (`is`), A ; (`ar`), N T (`tr` / `in`), checkpoint | 91% | Blue cup |
| Canopy | 12–15 | C Y (`ce` / `ca`), W O (`lo` / `on`), Q P (`pe`), checkpoint | 92% | Paper kite |
| Undergrowth | 16–21 | B (`be`), connected lower row, X comma (`ex`), Z full stop (`ze`), slash, checkpoint | 94% | Emerald beetle |
| Bark | 22–26 | Opposite-hand Shift, sentences, quotes and questions, dashes/colons/parentheses, checkpoint | 95% | Sealed letter |
| Rings | 27–31 | Left numbers, right numbers, mixed numbers, symbols, checkpoint | 95% | Brass watch |
| Flow | 32–36 | Common sequences, common words, pangrams and quotes, endurance, final passage | 96% | Music box |
| Code (optional) | 37–40 | Braces, angles and equals, arrows, snippets | 96% | Folded fox |

Where two headlines are shown, the first is the research's same-finger target that a first-time learner meets there; the second is the lesson default once that target has evidence. Chapter checkpoints require **97%**. Code opens after Bark from Settings and never blocks the main course. Endurance and the final passage are lengths of text, not timed tests. Generated text never uses characters outside a lesson's cumulative key set, and introduced keys are guaranteed rather than left to sampling.

## Lesson anatomy (letter chapters)

A new-key lesson has one **headline movement** and every exercise leads to it (CURR-50):

1. **Find the new keys**: guided, unscored, e.g. `gghhgghh`.
2. **Isolate the movement**: a transition loop in both directions, e.g. `mu um mum mu um`. The instruction names the mechanics (same finger / two fingers of one hand / alternate hands), never which finger was used (DEC-15). If the learner is accurate but uneven, steady beat replaces the loop.
3. **Carry it into words**: an etude of everyday words containing the movement, e.g. `mud mug did mud murmur`. At least half the words carry it, with ordinary words between them to keep the hands even.
4. **A small phrase**: ordinary language that opens with a phrase carrying the movement where one exists, e.g. `mum hid her mug`.

The headline is the D5 technical pick when one touches the new keys (`ed de ce ec tr un lo ol rt mu um`, the same-finger transitions stable across books, web and subtitles). Otherwise it is the most common English movement the new letters make (`COMMON_TRANSITIONS`, exported from `research/typing-movements`). Lessons 1–2 are authored rhythm lessons, and lesson 3 pairs `ed` with the matching `ik` middle-finger movement. Lesson 1 also has a guided, unscored whole-keyboard tour, and lessons 1–2 preview the next keys. There are no other visits. The `ing / ion / nce` chunks live in the Flow Common Sequences lesson and in ordinary prose.

Shift, number and symbol lessons have three exercises (find, use in context, put to work); application lessons have two; checkpoints have one passage. Lowercase is intentional until Shift is taught, and punctuation appears only when taught. In a words line it sits on a word (`box,`, `yes/no`), never alone.

### Planned main-course distribution

First-pass exercises from `lessonExercises` across the 36 main lessons (no pick):

| Chapter | Guided | Movement | Words | Phrases / passages | Total |
|---|---:|---:|---:|---:|---:|
| Roots | 9 | 7 | 3 | 4 | 23 |
| Home | 4 | 4 | 4 | 5 | 17 |
| Canopy | 3 | 3 | 3 | 4 | 13 |
| Undergrowth | 4 | 4 | 5 | 6 | 19 |
| Bark | 3 | 0 | 4 | 5 | 12 |
| Rings | 3 | 0 | 4 | 5 | 12 |
| Flow | 0 | 0 | 4 | 5 | 9 |
| **Total** | **26** | **18** | **27** | **34** | **105** |

## Evidence to clear a lesson

Guided steps advance on completion and never count as performance evidence (DEC-11). Every assessed exercise advances immediately at the shown target; mastery, rhythm and speed never veto a pass. A failed attempt retries only the current exercise. Saved exercise counts survive reload and sync, and completed lessons stay completed. Older recorded passes are still credited.

The header and results identify exercise number, purpose and next action; the result view carries Continue. Opening Course or Keepsakes during typing restarts the unfinished passage.

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

## Briefings: just-in-time coaching

Each Chapter 1 lesson opens with an authored briefing. Its first step is interactive: empty, pulsing key tiles ask for each new key with the named finger, fill as they are pressed, draw a check mark and advance on their own. The text steps coach the physical basics and advance on any key; Escape skips the whole briefing. Later new-key lessons get a short generic briefing without the press step. Extending the interactive step and naming each lesson's headline movement is CURR-52. A briefing shows once per lesson per session. Content lives in `src/curriculum/briefings.ts` and names fingers through the `{f}` placeholders, so it follows the active method.

## The lesson shell

Standard touch typing is the method taught (DEC-17). The method framework stays for future official methods: with more than one, Settings → Method switches between them and resets only the evidence for keys whose finger changed, keeping earned lessons. With one method the control is hidden. The text box carries a restart icon and, while idle, a "Begin typing when you're ready · any key" cue that fades on the first keystroke without moving the text. Any key moves on from a result. Extra practice (finger courses) sits at the start of the main navigation.

## Hand and finger load

Real words are not naturally two-handed: over F J D K E I R U, English vocabulary runs about 83/17 left. So G H arrive in Roots, giving the right hand `he hi hid high`. Word and phrase selection is also balance-aware: the generator samples a few candidates and keeps the one that holds the running split nearest even without one finger dominating.

`src/engine/balance.test.ts` holds every phrase and passage in the four letter chapters within 40–60 left/right under both methods, each letter chapter as a whole within 45–55, and no finger above half. A word etude and a transition loop concentrate on one movement and may sit on one hand (`be`, `ex`); the chapter totals still include them, and the etude's ordinary words lean the other way. Finger courses are intentionally single-finger and excluded. Shift, number, symbol and Flow chapters are not yet held to this rule.

### Space and paired finger courses

Apart from the guided keyboard tour, the F/J exercises before "Meet Space" contain no spaces; that last exercise explicitly introduces either-thumb Space. Later movement drills use short six-letter blocks instead of one Space per bigram. Normal words, phrases and sentences use natural spaces. The paired finger landmark run also has no Space, with spacing explained in its next reach exercise.

Each finger pair has three short movement levels, then real pair-key words, tricky word movements, short phrases, words with Shift, word/number labels, symbols in context, and a final review plus sentences. Exhaustive Cartesian key-pair lists are gone. Both sides still qualify independently; the next attempt concentrates on whichever side remains unfinished.

Examples for Index fingers without main-course prerequisites include `fur`, `try`, `murmur`, `rhythm`, and `try my curry`. Later words may also use keys from completed main-course lessons. Where a pair cannot make a useful phrase alone, only the needed helper letters are explicitly introduced with a short primer and the hand guide; previously learned helpers need no primer. For example Middle fingers can use `i did it` after meeting helper T. The final transfer introduces any needed full stop explicitly. Existing finger-level credit is preserved when content improves.

## Verification

- Every trail × stage × 50 seeds uses allowed characters, fits a bounded length and includes its intended keys. Every unlocked core bigram can be produced.
- Each new-key letter lesson's drill, words and phrase share its headline movement, with and without a first-time pick. The `?dev=1` trace reports warmed-now / known-already / novel bigrams per exercise.
- A simulated learner types through all 40 lessons with each method, including recoverable mistakes.
- Regression tests cover exercise advancement, accuracy boundaries, absence, missed-space accuracy, review coverage, guest/account isolation, migration and keepsakes. Browser checks drive the real app with key events.

These checks establish software behaviour. They are not longitudinal evidence of learning outcomes or a guarantee of typing speed.
