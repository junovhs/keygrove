# KeyJam — Product Brief

## 1. Product idea

KeyJam teaches typing more like a serious physical skill than a speed game.

Traditional typing software often emphasizes key memorization, repetitive letter drills, or WPM. KeyJam instead treats fluent typing as a learned vocabulary of physical movements.

A useful mental model is classical guitar:

- learn where things are
- isolate difficult transitions
- repeat them accurately
- combine them into useful phrases
- return them to real music

For typing:

**key → transition → gesture → word → prose**

The learner should not need to understand this architecture. They should mostly open the app and receive a short, sensible lesson.

## 2. Desired product feel

The product should be:

- easy to enter
- easy to leave
- useful in a few minutes
- calm
- technically serious
- simple on the surface
- increasingly personalized underneath

A session should not require a 30-minute commitment.

The preferred model is:

> a 3-minute lesson that can be continued

rather than:

> a 30-minute lesson that can be shortened

The default entry point should probably be some version of **Continue**.

Avoid unnecessary mode selection, setup, configuration, and curriculum navigation.

## 3. What is being taught

### Keys

The learner needs reliable key location and conventional fingering.

This is foundational, but not the central idea of the product.

### Transitions

The movement from one key to another can itself be a technical problem.

Examples:

- `ed`
- `ce`
- `tr`
- `un`
- `mu`

These deserve practice according to both real-world frequency and mechanical character.

### Gestures

Some 3- and 4-character patterns become reusable motor units.

Examples include:

- `ing`
- `ion`
- `tion`
- `the`
- `str`

They can involve rolls, redirects, repeated fingers, hand alternation, or repeated row changes.

### Language

Technical practice should return quickly to meaningful words and normal text.

The goal is not to become excellent at artificial drills. The goal is better real typing.

## 4. Lesson forms

Keep the number small.

### Transition loops

Isolate and repeat a movement.

Example:

`mu mu mu`

Then perhaps:

`um mu um mu`

The purpose is clean execution.

### Steady beat

The learner types a sequence in time with a pulse.

This trains consistency and control.

Speed can increase naturally later, but timing quality is the immediate task.

### Words / etudes

Real words are selected because they repeatedly contain the technical target.

For `mu`:

`must`
`much`
`music`
`community`

This bridges mechanical practice and meaningful typing.

### Ordinary text

Not really a special “mode”; normal prose is where the app checks transfer.

## 5. Speed

Speed should be measured but should not dominate instruction.

The working belief is:

> if accuracy, control, movement economy, familiarity, and automaticity improve, speed appears.

WPM can be useful as a long-term outcome measure.

Constant live speed pressure may teach exactly the wrong behavior: tension, rushing, sloppy technique, and chasing a number.

## 6. Fingering

The app can prescribe a finger but cannot normally observe which finger the learner actually used.

Therefore:

- explicitly teach intended fingering
- occasionally remind the learner during technical practice
- use behavioral evidence to suggest technique checks
- never claim certainty the keyboard cannot provide

A future optional camera/sensor system is conceivable but should not be required for the core product.

## 7. Adaptation

The app should learn enough to answer:

> What is the most useful thing for this learner to practice next?

Useful signals include:

- errors
- hesitation
- repeated corrections
- unstable transitions
- recent practice history
- movement frequency in real language
- whether a practiced movement succeeds in normal prose

The sophistication should remain mostly invisible.

## 8. Loops

The product should work at several timescales without becoming game-system-heavy.

### Seconds

See something → type it → receive immediate feedback → continue.

Typing itself should feel good.

### Minutes

A lesson has a small technical purpose and finishes quickly.

The learner should be able to feel:

> I practiced something real.

### Days

Open the app and it already knows what makes sense next.

### Long term

The reward is growing capability: the keyboard increasingly feels automatic.

Progress systems can support this, but should not replace it with currencies, chores, or excessive gamification.

## 9. Research foundation

Current work lives in `research/typing-movements`.

The main findings so far:

- Bigram usage is highly concentrated.
- About 200 bigrams account for nearly 94% of within-word bigram occurrences in the Norvig/Google Books data.
- Same-finger/different-key transitions represent about 6.94% of bigram occurrence mass.
- A relatively small number of same-finger transitions dominate that category.
- `mu` is a meaningful recurring technical movement; `qa` is mechanically interesting but extremely rare.
- Trigrams expose larger gesture structures.
- 13.53% of trigram occurrence mass contains an adjacent same-finger transition.
- Common gesture types include repeated-finger movement, separated finger reuse, rolls, redirects, alternating hands, and repeated row changes.

The next research priority is not endless taxonomy.

It is verifying that important findings remain useful across different English corpora, especially SUBTLEX-US and the web corpus already downloaded.

## 10. North star

The curriculum may be sophisticated.

The experience should not feel sophisticated.

**Open → practice something useful → get better → leave.**
