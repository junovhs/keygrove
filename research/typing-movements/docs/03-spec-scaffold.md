# KeyGrove — Spec Scaffold

This is intentionally a **decision list**, not a giant specification.

Each question should be answerable independently by an agent without redesigning the whole product.

Resolved decisions should replace questions with short answers.

---

# A. Core experience

## A1. Entry

**Question:** What exactly is on the default screen when a returning learner opens the app?

Desired constraint: very little.

## A2. Lesson duration

**Question:** What is the default target duration for one lesson?

Current direction: roughly 2–5 minutes.

## A3. Lesson completion

**Question:** What constitutes finishing a lesson?

## A4. Continue behavior

**Question:** After a lesson, what happens if the learner wants another?

## A5. Leaving

**Question:** Can the learner stop cleanly at any lesson boundary without feeling they abandoned something?

---

# B. Lesson anatomy

## B1. Transition loop

**Question:** What does the smallest excellent transition-loop lesson look like second by second?

## B2. Steady beat

**Question:** How should rhythm practice work visually and sonically without becoming annoying?

## B3. Words / etudes

**Question:** How should words be selected around a target movement while remaining natural and useful?

## B4. Transfer

**Question:** When and how does a lesson move from isolated technique into ordinary text?

## B5. Variety

**Question:** How does the app vary lesson form without making the learner choose from a menu of modes?

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
