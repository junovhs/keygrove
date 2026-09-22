# Relaxed QWERTY method specification

> **Status (DEC-12):** Traditional touch typing is the default method for new learners. This document specifies **Relaxed QWERTY 1.0**, which remains selectable in Settings → Method and unchanged. Course order, lesson names and the research movement vocabulary are method-neutral; see [the north star](north-star.md) and [course progression](progression.md).

## 1. Purpose

This document defines the Relaxed QWERTY method, an opt-in alternative to traditional touch typing in the application.

The method is designed for people learning to type on standard staggered QWERTY keyboards. Its purpose is not to reproduce historical touch-typing instruction exactly. Instead, it provides a consistent, practical typing system that preserves the familiarity and interoperability of QWERTY while adapting finger assignments and movement rules to better reflect the physical shape of the keyboard and the natural movement of the human hand.

The method prioritizes:

* accuracy;
* repeatable finger-to-key relationships;
* relaxed movement;
* neutral wrist posture;
* low unnecessary hand motion;
* efficient preparation for upcoming keystrokes;
* compatibility with ordinary QWERTY keyboards;
* ease of learning;
* transferability to other computers and keyboards;
* long-term typing fluency rather than short-term speed.

The method is intentionally conservative in how much it changes. It does not introduce a new keyboard layout, require remapping software, or demand unusual hardware.

Users should be able to learn this method and remain immediately capable of typing on essentially any ordinary QWERTY keyboard.

---

# 2. Method Name

The recommended working name is:

**Relaxed QWERTY**

Alternative product-facing names may be used, but the underlying specification should remain stable.

The term "Relaxed QWERTY" describes the central philosophy of the method:

> Maintain a stable typing map, but allow the hands to move naturally rather than forcing them into rigid historical positions.

The word "relaxed" refers to movement strategy, not lack of precision.

Relaxed QWERTY still teaches explicit finger assignments and deliberate technique.

---

# 3. Design Philosophy

Traditional touch typing generally teaches a fixed home position:

* left hand on A S D F;
* right hand on J K L ;
* each finger assigned to a vertical or near-vertical column;
* fingers repeatedly returning to their home-row positions.

That system is simple to teach and has produced generations of proficient typists.

However, a standard staggered keyboard is not geometrically symmetrical.

Its rows are horizontally offset:

```text
Q   W   E   R   T   Y   U   I   O   P
  A   S   D   F   G   H   J   K   L
    Z   X   C   V   B   N   M
```

As a result, strict vertical finger assignments do not always correspond naturally to the direction in which the fingers or hand move.

Relaxed QWERTY retains the advantages of a stable touch-typing system while modifying several assumptions about how that system should be executed.

Its foundational position is:

> Finger assignments should create reliable motor patterns without requiring unnecessary strain, stretching, or artificial hand rigidity.

---

# 4. Core Principles

The application MUST teach the following principles as the foundation of the method.

## 4.1 Stable Key Ownership

Every commonly typed key should have a preferred finger.

Learners should develop a predictable relationship between a key and the finger responsible for pressing it.

The goal is for key selection to become automatic.

The system therefore does **not** advocate randomly choosing whichever finger happens to be closest to a key.

Flexibility applies primarily to hand positioning and movement, not to arbitrary key ownership.

---

## 4.2 F and J Are Landmarks, Not Anchors

The raised markers on F and J provide tactile orientation.

The application SHOULD teach users to use them to locate the keyboard without looking.

However, F and J should not be described as positions to which the index fingers must mechanically return after every keystroke.

The hands may shift slightly during normal typing.

The intended mental model is:

> F and J tell the hands where they are.

not:

> The index fingers must remain attached to F and J.

---

## 4.3 Neutral Position Over Forced Reach

Users SHOULD avoid bending or twisting the wrist merely to preserve a theoretical finger assignment.

The preferred order of movement is:

1. finger movement;
2. small natural hand adjustment;
3. return toward a comfortable neutral position when appropriate.

Large or continuous hand wandering is discouraged.

Small hand translation is acceptable.

---

## 4.4 Relaxation Before Speed

Speed MUST NOT be treated as the primary beginner objective.

The preferred priority is:

1. comfort;
2. accuracy;
3. consistency;
4. rhythm;
5. speed.

The application SHOULD actively discourage users from increasing speed when their accuracy or movement quality is deteriorating.

---

## 4.5 Prepare Rather Than Reset

Typing should be treated as a sequence of coordinated movements rather than an isolated series of key presses.

The application SHOULD NOT teach learners to consciously return every finger to home position between individual letters.

During continuous typing, the hands and fingers may prepare for upcoming letters.

For example, a learner typing:

```text
there
```

should eventually experience the word as a coordinated movement sequence rather than:

```text
press T
reset
press H
reset
press E
reset
press R
reset
press E
reset
```

The home position remains useful for orientation and recovery, but not as a mandatory reset state after every keystroke.

---

## 4.6 Consistency Before Optimization

Beginners SHOULD first learn a stable map.

Advanced optimization can be introduced later.

A learner who repeatedly changes finger assignments in search of marginal efficiency is likely to interfere with motor learning.

Accordingly, the default method SHOULD remain stable throughout the core curriculum.

---

# 5. Default Finger Map

The following map defines the default Relaxed QWERTY letter assignments.

## 5.1 Left Hand

### Left Pinky

```text
Q
A
```

### Left Ring Finger

```text
W
S
Z
```

### Left Middle Finger

```text
E
D
X
```

### Left Index Finger

```text
R
F
C
V
T
G
```

---

## 5.2 Right Hand

### Right Index Finger

```text
Y
U
H
J
B
N
M
```

### Right Middle Finger

```text
I
K
,
```

### Right Ring Finger

```text
O
L
.
```

### Right Pinky

```text
P
;
/
```

---

# 6. Primary Difference From Traditional Touch Typing

The major modification occurs on the lower-left row.

Traditional typing commonly teaches:

```text
Z = left pinky
X = left ring
C = left middle
V = left index
```

Relaxed QWERTY teaches:

```text
Z = left ring
X = left middle
C = left index
V = left index
```

This creates the following lower-left progression:

```text
Ring   Middle   Index   Index
 Z       X        C       V
```

rather than:

```text
Pinky   Ring   Middle   Index
  Z      X       C       V
```

The purpose is to allow the left hand to follow the physical angle created by the keyboard's row stagger.

---

# 7. B-Key Assignment

Relaxed QWERTY assigns:

```text
B = right index finger
```

This is the default instruction.

The B key physically sits near the division between the hands and is treated inconsistently across typing systems.

For instructional consistency, this application assigns it to the right hand.

The resulting lower-row division is:

```text
Left hand:   Z X C V
Right hand:  B N M , .
```

This also creates a visually and conceptually simple hand boundary.

---

# 8. Complete Letter Diagram

The default teaching diagram is:

```text
LEFT HAND                         RIGHT HAND

Q    W    E    R    T      Y    U    I    O    P
LP   LR   LM   LI   LI     RI   RI   RM   RR   RP

 A    S    D    F    G      H    J    K    L    ;
 LP   LR   LM   LI   LI     RI   RI   RM   RR   RP

   Z    X    C    V      B    N    M    ,    .
   LR   LM   LI   LI     RI   RI   RI   RM   RR
```

Abbreviations:

```text
LP = Left Pinky
LR = Left Ring
LM = Left Middle
LI = Left Index

RI = Right Index
RM = Right Middle
RR = Right Ring
RP = Right Pinky
```

The application MAY use colors, hand illustrations, animation, or other visual representations instead of abbreviations.

---

# 9. Home Position

The instructional home position remains approximately:

```text
Left:   A S D F
Right:  J K L ;
```

However, the application MUST distinguish between:

* **home position**, and
* **mandatory finger anchoring**.

The learner begins from the home position because it provides a reproducible reference point.

The learner is not expected to freeze the hands there.

The recommended instruction is:

> Rest your fingers lightly near the home row. Use F and J to orient yourself. Allow small natural movements as you type.

The application SHOULD avoid wording such as:

> Always return every finger to its home key immediately.

---

# 10. Hand Position

The preferred hand position is relaxed and approximately aligned with the forearms.

The learner SHOULD be taught to avoid:

* sharply bending the wrist left or right;
* holding the wrist in a visibly twisted position;
* hovering with excessive muscular tension;
* aggressively spreading the fingers;
* reaching distant keys solely through finger stretching when a small hand movement would be easier.

The application SHOULD depict the hand as a mobile unit rather than a rigid frame.

---

# 11. Hand Translation

Small translational movement of the hand is permitted.

For example, when reaching the top or bottom rows, the hand may move slightly toward the target.

This is preferable to treating the wrist and palm as completely stationary while forcing the fingers to perform every reach independently.

However, excessive translation is undesirable.

A learner SHOULD NOT:

* move the entire hand for every letter;
* lose tactile orientation;
* repeatedly lift and relocate the hand unnecessarily.

The desired behavior is:

> Fingers perform most movement; the hand assists when useful.

---

# 12. Wrist Motion

The typing method SHOULD encourage relatively neutral wrists.

The learner should not intentionally introduce large lateral wrist movements as part of routine key access.

Small natural motion is expected.

The application SHOULD avoid presenting any particular wrist angle as a rigid numerical target.

Instead, the user-facing guidance should emphasize:

* comfort;
* alignment;
* absence of sustained twisting;
* absence of unnecessary tension.

---

# 13. Spacebar

The application SHOULD allow either thumb to operate Space.

Recommended instruction:

> Press Space with whichever thumb naturally rests over the spacebar.

The software MAY observe which thumb a learner chooses if suitable hardware or manual configuration permits it, but it SHOULD NOT penalize the use of one thumb over the other.

Learners who naturally alternate thumbs also need not be corrected unless alternation interferes with consistency.

---

# 14. Shift Keys

The default rule is:

> Use the Shift key with the hand opposite the character being typed.

Examples:

```text
A = right Shift + left pinky
T = right Shift + left index
P = left Shift + right pinky
M = left Shift + right index
```

This enables one hand to prepare the character while the other holds Shift.

The application SHOULD introduce Shift only after basic lowercase letter control is reasonably established.

---

# 15. Enter, Backspace, Tab, and Other Pinky Keys

For standard keyboards, the following conventional assignments SHOULD be retained by default.

## Right Pinky

Common responsibilities include:

```text
Enter
Backspace
Right Shift
]
[
'
\
```

Exact assignments may vary according to regional keyboard layout.

## Left Pinky

Common responsibilities include:

```text
Tab
Caps Lock
Left Shift
`
```

The application SHOULD introduce these keys progressively rather than presenting every pinky responsibility to beginners at once.

---

# 16. Number Row

The number row SHOULD generally preserve conventional touch-typing ownership.

Recommended map:

```text
1 = left pinky
2 = left ring
3 = left middle
4 = left index
5 = left index

6 = right index
7 = right index
8 = right middle
9 = right ring
0 = right pinky
```

Symbols accessed through Shift inherit the same base-key finger.

For example:

```text
! = left pinky
@ = left ring
# = left middle
$ = left index
% = left index
^ = right index
& = right index
* = right middle
( = right ring
) = right pinky
```

---

# 17. Punctuation

Primary punctuation SHOULD be taught after basic letter fluency.

Recommended default:

```text
, = right middle
. = right ring
/ = right pinky
; = right pinky
' = right pinky
```

The application SHOULD preserve familiar standard assignments unless a strong ergonomic or instructional reason exists to change them.

The purpose of Relaxed QWERTY is not to redesign every key relationship.

---

# 18. Key Ownership vs. Movement Freedom

This distinction is fundamental.

Relaxed QWERTY is:

**strict about which finger normally presses a key**

while being:

**flexible about exactly where the hand must remain while that finger presses it.**

This prevents two undesirable extremes.

### Extreme A: Rigid Classical Typing

```text
Every finger must remain perfectly aligned to home columns.
Any deviation is an error.
```

Relaxed QWERTY rejects this.

### Extreme B: Unstructured Hunt-and-Peck

```text
Use whichever finger happens to be nearby.
```

Relaxed QWERTY also rejects this.

The intended system is:

```text
stable finger map
+
natural hand movement
+
minimal unnecessary motion
```

---

# 19. Accuracy Standard

Accuracy is the first measurable performance target.

The application SHOULD generally encourage learners to maintain approximately:

```text
95% or greater accuracy
```

before substantially increasing lesson speed.

For early lessons, higher accuracy may be desirable.

The software SHOULD interpret repeated mistakes as evidence that the current speed exceeds the learner's stable motor control.

It SHOULD NOT reward high words-per-minute scores achieved through excessive error rates.

---

# 20. Speed Philosophy

Words per minute is useful but secondary.

The application SHOULD avoid building the beginner experience around speed tests.

Instead, speed should emerge from:

* reduced hesitation;
* stronger finger-key associations;
* improved sequence recognition;
* lower error rates;
* better rhythm;
* less unnecessary motion.

When speed is measured, the application SHOULD display accuracy alongside it.

A high speed score without adequate accuracy SHOULD NOT be treated as superior performance.

---

# 21. Rhythm

Typing rhythm is an important intermediate skill.

Learners SHOULD initially aim for smooth, controlled timing rather than bursts of extremely fast typing followed by pauses and corrections.

Exercises MAY explicitly train rhythm.

For example:

```text
red red red red
fed fed fed fed
read read read
```

The desired progression is:

```text
deliberate
→
smooth
→
automatic
→
fast
```

not:

```text
fast
→
error
→
backspace
→
fast
→
error
```

---

# 22. Learning Progression

The product north star is [the KeyGrove north star](north-star.md), governed by DEC-10 to DEC-14 (DEC-12 made Traditional the default). This replaces the earlier region-by-region recommended sequence; the canonical Relaxed QWERTY 1.0 finger assignments are unchanged.

## 22.1 Learn the instrument in small movement phrases

The whole keyboard SHOULD be visible and available for guided exploration from the start. Assessed attention progresses from manageable strong-finger movements to wider coordination; a region need not be mastered before another can be encountered.

The recurring learning sequence is:

1. Find a key deliberately.
2. Connect two keys with the same finger.
3. Alternate between hands.
4. Prepare the next finger while the current one presses.
5. Carry that coordination into a word.

A short lesson SHOULD demonstrate a movement, allow ungraded practice, connect it with familiar movements, and apply it in words or text. F/J establish orientation; early focused practice includes upper and lower reaches. Outer fingers, rarer movements and practical symbols receive deliberate attention progressively. Space belongs between words and meaningful groups.

## 22.2 Accuracy at a comfortable pace

Slow deliberate work counts fully. Learners SHOULD use light pressure and small comfortable adjustments, never hold the hand rigid to minimize movement. They SHOULD pause when tension or strain appears. A miss invites a calm correction; flawless runs are not a prerequisite for progress.

Guided introductions MUST identify the keys and their preferred fingers before asking for independent performance. They have no passing score, can be skipped, and MUST NOT contribute to accuracy gates, performance models, speed statistics or remedial triggers. A guided encounter is not mastery.

Assessed exercises MUST show their purpose and accuracy target. Each pass advances immediately. Mastery, speed, absence and hidden repetition MUST NOT veto a pass. Earned lesson, exercise and paired-finger credit remains earned when the curriculum evolves.

## 22.3 Connect, revisit and become independent

Practice SHOULD move into familiar words as soon as useful language is possible, and return to earlier movements in new contexts. Unfamiliar helper keys need explicit guidance, not surprise appearances in assessed text. Novelty is bounded by the number and complexity of new movements, not a fixed character percentage.

The Relaxed lower-left mapping MUST be explicitly taught: Z with the left ring, X with the left middle, C with the left index, and B with the right index. All finger guidance MUST derive from the active method, including the Traditional alternative.

Later lessons emphasize connected words, opposite-hand Shift, sentence punctuation, practical numbers and symbols, and sustained unfamiliar text. Shift coordination follows basic lowercase control; a guided number-row visit may precede sustained number work. Proactive guidance SHOULD recede during later familiar practice, with help always available.

Fluency is encouraged through familiarity, preparation and connected movement, not promised as an automatic consequence of slowness. Keystrokes cannot verify finger choice, relaxation or posture. Evaluation SHOULD include delayed transfer and learner comfort rather than immediate scores alone.

---

# 23. Lesson Design

Lessons SHOULD minimize meaningless repetition where practical.

Traditional exercises such as:

```text
fff jjj ddd kkk
```

can be useful briefly for establishing movement.

They SHOULD NOT dominate the curriculum.

As soon as sufficient letters are available, exercises SHOULD use:

* words;
* word fragments;
* natural sequences;
* simple sentences.

Meaningful language improves engagement and better resembles actual typing.

---

# 24. Adaptive Practice

The application SHOULD dynamically identify difficult keys and transitions.

The system SHOULD distinguish between:

* individual key errors;
* finger-transition errors;
* same-finger sequence difficulty;
* hand-transition difficulty;
* capitalization errors;
* punctuation errors;
* hesitation;
* repeated correction behavior.

Practice SHOULD then emphasize the relevant pattern.

For example, a learner struggling with:

```text
C
```

may receive exercises involving:

```text
can
come
case
once
ice
```

A learner struggling with transitions between:

```text
R → F
```

may receive words that naturally contain those movements.

---

# 25. Bigram and Trigram Training

The application SHOULD eventually train letter sequences rather than only individual keys.

A **bigram** is a sequence of two characters.

Examples:

```text
th
er
in
re
on
```

A **trigram** is a sequence of three characters.

Examples:

```text
the
ing
ion
and
```

Fluent typing depends heavily on learning these sequences as coordinated motor patterns.

Advanced lessons SHOULD therefore increasingly emphasize common sequences.

---

# 26. Same-Finger Sequences

The application MAY identify sequences requiring repeated use of the same finger.

Such sequences are not inherently errors.

The learner SHOULD be taught to execute them smoothly rather than attempting to violate the finger map to avoid them.

The method prioritizes:

```text
stable motor mapping
```

over:

```text
elimination of every same-finger sequence
```

Users should not be encouraged to invent alternate finger assignments for individual words unless using an explicitly advanced or adaptive mode.

---

# 27. Look-Down Behavior

The application SHOULD encourage touch-oriented typing.

However, looking at the keyboard SHOULD NOT be treated as a moral or categorical failure.

Beginning learners may occasionally look down.

The training objective is to progressively reduce visual dependency.

Recommended progression:

```text
frequent looking
→
occasional checking
→
tactile reorientation
→
eyes remain on screen
```

The application MAY offer exercises specifically designed to reduce keyboard looking.

---

# 28. Corrections

Backspace should not dominate beginner practice.

During dedicated accuracy exercises, the application MAY offer different correction modes.

### Normal Mode

Users may correct mistakes normally.

### No-Backspace Mode

Errors remain visible and the learner continues typing.

This can help reveal error patterns without repeatedly interrupting movement.

### Precision Mode

The learner must correct errors before continuing.

Different modes train different abilities.

No single correction strategy should be treated as universally mandatory.

---

# 29. Error Classification

Errors SHOULD be classified when possible.

Examples:

### Neighbor Error

Expected:

```text
E
```

Typed:

```text
R
```

### Finger-Confusion Error

A key belonging to an adjacent finger is repeatedly substituted.

### Anticipation Error

A later character is typed too early.

Example:

Expected:

```text
form
```

Typed:

```text
from
```

### Repetition Error

A key is accidentally repeated.

### Omission Error

A character is skipped.

### Timing Error

The correct key is eventually typed but after abnormal hesitation.

This information can improve adaptive training.

---

# 30. Movement Quality

Where measurement is possible, the application MAY distinguish between typing performance and movement quality.

Typing performance includes:

* speed;
* accuracy;
* consistency.

Movement quality may include user-reported or sensor-derived indicators such as:

* tension;
* excessive reaching;
* unusual fatigue;
* hand displacement.

The application SHOULD NOT diagnose medical conditions from typing behavior.

---

# 31. Fatigue Guidance

Typing lessons SHOULD encourage breaks when fatigue meaningfully changes technique.

The application SHOULD avoid messaging that encourages users to "push through" pain.

Appropriate guidance includes:

> Stop or reduce intensity if typing causes increasing pain, numbness, tingling, or loss of normal movement.

The app SHOULD distinguish ordinary learning effort from symptoms that may warrant rest or professional evaluation.

The product MUST NOT represent its typing method as medical treatment or injury rehabilitation unless separately developed and validated for that purpose.

---

# 32. Accessibility and Temporary Adaptations

The default method assumes use of both hands and all major typing fingers.

However, the application SHOULD permit adaptation for:

* temporary injury;
* permanent mobility differences;
* missing digits;
* reduced range of motion;
* one-handed typing;
* assistive input devices;
* alternative keyboard hardware.

These adaptations SHOULD exist as explicit accessibility profiles rather than silently changing the core method.

The default curriculum should remain stable for the majority of learners.

---

# 33. Alternative Finger Maps

The application MAY support alternative typing systems.

At minimum, it SHOULD provide:

## Relaxed QWERTY

Recommended default.

## Traditional Touch Typing

Conventional assignments, including:

```text
Z = left pinky
X = left ring
C = left middle
B = left index
```

or whatever traditional B assignment is selected for that mode.

Users with established muscle memory SHOULD be allowed to select this mode.

The product SHOULD NOT force experienced typists to relearn finger assignments merely to use the application.

---

# 34. Existing Typists

During onboarding, users SHOULD be asked whether they:

* are complete beginners;
* already touch type;
* type without formal technique;
* are relearning after a long break;
* require an accessibility adaptation.

Experienced typists SHOULD be offered a short assessment before being instructed to change technique.

The software SHOULD avoid correcting harmless individual variation unless that variation creates a clear learning problem.

---

# 35. Beginner vs. Expert Flexibility

The application should be stricter with beginners than with advanced typists.

Beginners benefit from stable rules.

Experts often develop small variations that remain efficient and consistent.

Therefore:

### Beginner

The app SHOULD strongly reinforce the default finger map.

### Intermediate

The app MAY tolerate minor variation.

### Advanced

The app MAY allow user-defined key ownership or alternate techniques.

This reflects an important distinction:

> A good learning rule does not need to describe every behavior of every expert typist.

---

# 36. Keyboard Geometry

The default Relaxed QWERTY system is intended primarily for conventional staggered keyboards.

Examples include:

* laptop keyboards;
* standard desktop keyboards;
* common mechanical keyboards.

Different geometry may justify different technique.

The application SHOULD recognize at least:

* row-staggered keyboards;
* ortholinear keyboards;
* column-staggered ergonomic keyboards;
* split keyboards.

The Relaxed QWERTY lower-left modification is specifically motivated by the geometry of row-staggered boards.

It SHOULD NOT automatically be applied to an ortholinear board.

---

# 37. Laptop Keyboards

Laptop keyboards are fully supported.

Because laptop keyboards often have:

* short travel;
* shallow keycaps;
* limited palm positioning;
* integrated pointing devices;

the application SHOULD avoid assuming a mechanical desktop keyboard.

Technique instructions should remain hardware-neutral where possible.

---

# 38. Split and Ergonomic Keyboards

Users of split or column-staggered ergonomic keyboards may benefit from more traditional column-based finger ownership because those keyboards intentionally alter physical geometry.

The application SHOULD eventually provide hardware-specific profiles.

The default Relaxed QWERTY method should not claim to be universally optimal across every keyboard geometry.

---

# 39. Terminology

The application SHOULD use accessible language first and technical terminology second.

Preferred:

> Move your hand slightly instead of stretching your finger uncomfortably.

Rather than:

> Perform a translational repositioning of the metacarpal frame.

Technical explanations can exist in documentation and advanced lessons.

Beginner instruction should remain understandable.

---

# 40. Claims and Positioning

The application MAY describe Relaxed QWERTY as:

* ergonomic-minded;
* geometry-aware;
* movement-conscious;
* designed around relaxed typing;
* a modern interpretation of touch typing.

The application SHOULD NOT make unsupported claims such as:

* "scientifically proven perfect";
* "prevents RSI";
* "eliminates wrist injuries";
* "the fastest possible typing system";
* "biomechanically optimal for every person."

A preferable description is:

> Relaxed QWERTY modifies conventional touch typing to better match the physical stagger of standard keyboards while preserving familiar QWERTY behavior.

---

# 41. Recommended User-Facing Explanation

A concise explanation for onboarding may read:

> Relaxed QWERTY is our recommended typing method. It uses normal QWERTY keys and familiar touch-typing principles, but it allows your hands to move naturally instead of forcing them into rigid columns. We slightly change the lower-left finger assignments to better follow the physical angle of a standard keyboard. Nothing is remapped, so the technique works on ordinary computers everywhere.

---

# 42. Finger Map Presentation

The application SHOULD visually distinguish fingers.

A learner should be able to immediately understand:

* which hand owns a key;
* which finger owns a key;
* where the current target is;
* where the target finger begins.

Finger colors SHOULD remain consistent throughout the entire application.

For example, if left index is represented by one visual identifier in lessons, the same identifier should appear in:

* keyboard diagrams;
* analytics;
* errors;
* tutorials;
* settings;
* practice modes.

---

# 43. Animation

Key demonstrations SHOULD animate the finger rather than only highlighting the key.

Ideal demonstrations show:

1. starting hand position;
2. finger movement;
3. small hand movement if appropriate;
4. key press;
5. transition toward the next target.

The application SHOULD avoid animations that imply the palm and wrist must remain perfectly immobile.

---

# 44. Finger Map Enforcement

The training engine SHOULD maintain a canonical assignment table.

For example:

```text
Key: C
Hand: Left
Finger: Index
Method: Relaxed QWERTY
```

Lesson generation, visual guidance, analytics, and coaching messages SHOULD all reference the same canonical mapping.

Finger assignments MUST NOT be independently duplicated across unrelated parts of the codebase.

---

# 45. Recommended Internal Data Model

Conceptually:

```text
TypingMethod
    id
    name
    version
    keyboardGeometry
    keyAssignments
    shiftStrategy
    spaceStrategy
    movementRules
```

A key assignment may contain:

```text
KeyAssignment
    key
    hand
    finger
    required
    alternatives
```

Example:

```text
key: "c"
hand: "left"
finger: "index"
required: true
alternatives: []
```

Space may instead use:

```text
key: "space"
hand: "either"
finger: "thumb"
required: false
alternatives:
    - left thumb
    - right thumb
```

This makes the learning method configurable rather than hard-coded.

---

# 46. Versioning

The typing method SHOULD be versioned.

Example:

```text
Relaxed QWERTY 1.0
```

Finger assignments SHOULD NOT be changed casually after users have begun training.

A modification to a core key assignment is a breaking pedagogical change.

If such a change becomes necessary, the application should:

1. create a new method version;
2. retain the previous map for existing users;
3. allow users to migrate intentionally.

Motor learning depends heavily on consistency.

Silent changes to finger ownership are unacceptable.

---

# 47. Analytics

The application SHOULD track more than words per minute.

Recommended metrics include:

* raw WPM;
* corrected WPM;
* accuracy;
* error rate by key;
* hesitation by key;
* error rate by finger;
* error rate by hand;
* bigram performance;
* trigram performance;
* capitalization accuracy;
* punctuation accuracy;
* backspace frequency;
* consistency over time.

These metrics should primarily support learning decisions rather than competitive scoring.

---

# 48. Per-Key Mastery

Each key MAY have a mastery model containing:

```text
recognition
accuracy
latency
sequence performance
recent stability
```

A learner should not be considered to have mastered a key merely because it was typed correctly several times in isolation.

Mastery should eventually include the ability to type the key in varied contexts.

---

# 49. Sequence Mastery

The system SHOULD eventually model transitions.

For example:

```text
T → H
H → E
E → R
R → E
```

A learner may know each individual key while still struggling with particular transitions.

Adaptive practice SHOULD therefore operate at both:

```text
key level
```

and:

```text
sequence level
```

---

# 50. Practice Difficulty

Difficulty SHOULD increase across several dimensions independently.

These include:

* number of available keys;
* word complexity;
* sequence complexity;
* punctuation;
* capitalization;
* lesson duration;
* required accuracy;
* target pace.

The application SHOULD NOT equate difficulty exclusively with typing speed.

---

# 51. Lesson Failure

A learner should rarely encounter a punitive "failure" state.

Poor performance should instead modify practice.

For example:

```text
Accuracy fell to 88%.

Next:
reduce target pace
increase C/X practice
repeat weak transitions
```

The system should communicate:

> the technique is not stable yet

rather than:

> the learner failed.

---

# 52. Speed Tests

Speed tests SHOULD exist, but they are assessments rather than the central learning mechanism.

A speed test SHOULD:

* use sufficiently varied text;
* display accuracy;
* identify correction behavior;
* avoid permanently altering lesson difficulty based on one anomalous result.

Personal-best systems MAY be included for motivation.

---

# 53. Competitive Features

If leaderboards or competitive typing modes exist, they SHOULD remain separate from core instruction.

Competitive incentives can encourage users to sacrifice technique for short-term speed.

Learning analytics should therefore remain distinguishable from game scores.

---

# 54. Typing Sounds and Feedback

Feedback SHOULD reinforce correct timing without becoming distracting.

Possible signals include:

* subtle key confirmation;
* error sound;
* visual finger cue;
* rhythm indicator.

Feedback SHOULD be configurable.

Users should be able to disable nonessential audio and animation.

---

# 55. Physical Setup Guidance

The application MAY provide basic setup guidance.

Recommended principles:

* keyboard positioned so the user does not need to reach excessively;
* shoulders relaxed;
* elbows in a comfortable position;
* wrists not held in extreme angles;
* screen placed so users do not continually look down at the keyboard.

The application should avoid presenting a single exact posture as mandatory for every body.

---

# 56. Instructional Tone

The application SHOULD avoid framing natural human variation as misconduct.

Avoid:

> Never move your hands.

Prefer:

> Keep your movements small and controlled.

Avoid:

> Your finger must always return immediately to F.

Prefer:

> Use F to stay oriented.

Avoid:

> You are typing incorrectly.

Prefer:

> Try using your left index for C. Keeping C assigned to one finger will make the movement easier to automate.

The method should feel precise without feeling punitive.

---

# 57. What the Method Is Not

Relaxed QWERTY is not:

* a new keyboard layout;
* a Colemak variant;
* a Dvorak variant;
* a keyboard remapping;
* a one-handed typing system;
* a medical rehabilitation program;
* a promise of maximum theoretical typing speed;
* unrestricted freestyle typing.

It is a touch-typing methodology for ordinary QWERTY keyboards.

---

# 58. Relationship to Traditional Touch Typing

Relaxed QWERTY should be described as evolutionary rather than oppositional.

Traditional typing provides several useful concepts that remain intact:

* touch-based orientation;
* stable finger assignments;
* division of work across both hands;
* use of all major typing fingers;
* opposite-hand Shift;
* progressive motor learning.

Relaxed QWERTY modifies:

* the lower-left finger map;
* the interpretation of home position;
* tolerance for small hand movement;
* the emphasis placed on neutral, relaxed movement.

---

# 59. Default Status

Relaxed QWERTY SHOULD be the default method for new users who:

* use standard staggered QWERTY hardware;
* do not already possess strong touch-typing muscle memory;
* do not select an accessibility-specific method.

Traditional Touch Typing SHOULD remain available in settings.

Users with existing technique SHOULD be informed before the application attempts to retrain their lower-row finger assignments.

---

# 60. Default Selection Logic

Recommended onboarding logic:

```text
Are you already comfortable touch typing?

NO
→ Relaxed QWERTY

SOMEWHAT
→ short technique assessment
→ recommend Relaxed QWERTY unless established conflicting muscle memory is detected

YES
→ ask whether user wants:
   - Keep my existing technique
   - Learn Relaxed QWERTY

ACCESSIBILITY NEED
→ choose or configure an adapted method
```

The application SHOULD avoid forcing experienced users into a new map without consent.

---

# 61. The Core Teaching Model

All instructional material should ultimately reinforce four concepts:

## Map

Know which finger owns the key.

## Orientation

Know where the hands are without looking.

## Movement

Move naturally and economically.

## Sequence

Learn to type groups of letters as coordinated actions.

These form the conceptual architecture of the entire typing curriculum.

---

# 62. Canonical Summary

The official Relaxed QWERTY specification can be summarized as follows:

> Relaxed QWERTY is a geometry-aware touch-typing method for standard staggered QWERTY keyboards. It retains stable finger-to-key assignments while allowing small natural hand movements instead of requiring rigid home-row anchoring. The primary mapping change from conventional typing is the lower-left row: Z is typed with the left ring finger, X with the left middle finger, and C with the left index finger. B is assigned to the right index finger. F and J serve as tactile orientation landmarks rather than permanent anchors. Learners prioritize comfort, accuracy, consistency, rhythm, and automatic movement before speed.

---

# 63. Canonical Finger Map

For implementation purposes, the following mapping is authoritative for Relaxed QWERTY 1.0:

```text
LEFT PINKY
Q A

LEFT RING
W S Z

LEFT MIDDLE
E D X

LEFT INDEX
R T F G C V

RIGHT INDEX
Y U H J B N M

RIGHT MIDDLE
I K ,

RIGHT RING
O L .

RIGHT PINKY
P ; /
```

Supporting assignments:

```text
SPACE
Either thumb

SHIFT
Opposite hand from typed character

NUMBER ROW
1 LP
2 LR
3 LM
4 LI
5 LI
6 RI
7 RI
8 RM
9 RR
0 RP
```

---

# 64. Non-Negotiable Product Rules

For Relaxed QWERTY 1.0, the application MUST:

1. teach a stable preferred finger for every primary letter key;
2. teach `Z = left ring`;
3. teach `X = left middle`;
4. teach `C = left index`;
5. teach `B = right index`;
6. use F and J as tactile orientation landmarks;
7. avoid teaching mandatory immediate return to home after every key;
8. permit small natural hand movement;
9. prioritize accuracy and relaxed movement before speed;
10. teach opposite-hand Shift;
11. allow either thumb for Space;
12. preserve normal QWERTY key positions;
13. provide traditional touch typing as an alternative;
14. avoid unsupported medical or universal-optimality claims;
15. maintain versioned, internally consistent finger assignments.

---

# 65. Product Principle

The defining principle of the method is:

> **Learn a stable map. Stay oriented. Keep the wrists comfortable. Let the hands behave like hands.**

Everything in the application—from beginner lessons to adaptive practice—should be consistent with that principle.
