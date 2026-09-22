# KeyJam — One Page

## What this is

A typing teacher built around a simple belief:

**Typing is a physical skill. Learn movements deliberately, then let fluency emerge.**

The analogy is classical instrument practice. Knowing where notes are is not enough; difficult transitions and fingerings are isolated, practiced cleanly, then returned to real music. Typing should work the same way.

The product itself should stay tiny:

> Open app → do a useful 2–5 minute lesson → stop or do another.

Deep curriculum underneath. Very little machinery exposed to the learner.

## Teaching philosophy

The basic progression is:

**key → transition → gesture → word → real language**

A learner may know `m` and `u` individually but still struggle with `mu`. That movement can be isolated, repeated, then used in `must`, `much`, `music`, `community`, and finally ordinary prose.

Speed is not the primary skill. It is an emergent consequence of accurate, controlled, increasingly automatic movement.

The app should favor:

- correct technique
- relaxed, controlled movement
- accuracy
- useful repetition
- short practice
- transfer into real language

## Core lesson forms

Keep the interaction vocabulary small.

### Transition loops
Repeat a useful or difficult movement cleanly.

`mu mu mu`

`nce nce nce`

### Steady beat
Type a sequence to a regular pulse.

The point is timing, consistency, and control rather than racing.

### Words / etudes
Use concentrated real words chosen around one technical movement.

`must much music community`

Normal passages can then test whether the technique transfers into ordinary typing.

## What the app knows underneath

The curriculum can quietly consider:

- how common a movement is in real English
- its standard QWERTY fingering
- whether it involves same-finger movement, row changes, rolls, redirects, etc.
- what the learner gets wrong
- where the learner hesitates
- what has not been practiced recently
- whether isolated practice transfers into normal text

The learner should mostly experience one button:

**Continue**

## Important constraint

A normal keyboard cannot tell which physical finger pressed a key.

The app can teach intended fingering and infer possible problems from timing/error patterns, but it should not pretend to know fingering with certainty.

## Research so far

Google Books-derived English data shows:

- 168 bigrams account for about 90% of within-word bigram occurrences.
- 214 account for about 95%.
- 6.94% of bigram occurrences are same-finger / different-key movements under conventional QWERTY.
- High-value examples include `ed`, `de`, `ce`, `ec`, `tr`, `un`, `lo`, `ol`, `rt`, and `mu`.
- `mu` is far more common than mechanically unusual but rare `qa`.
- 13.53% of trigram occurrence mass contains an adjacent same-finger movement.
- Common trigrams exhibit meaningful gesture structures such as rolls, redirects, alternating hands, repeated fingers, and row changes.

This research exists to help choose what deserves explicit practice. It is not the product itself.

## Product principle

**Small surface. Deep model.**

Do not turn this into a typing laboratory, curriculum bureaucracy, or second job.

The app should feel obvious.
