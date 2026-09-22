# Research Questions

## Core

What is the smallest useful vocabulary of keyboard movements that gives strong
coverage of ordinary English typing?

## Frequency

- How concentrated are bigrams, trigrams, and 4-grams?
- Where are the 50%, 75%, 90%, 95%, and 99% coverage points?
- How stable are rankings across corpora?

## Mechanical difficulty

- same-finger transitions
- same-hand sequences
- row changes
- redirects
- stretches
- weak-finger transitions
- repeated keys
- repeated finger across different keys
- awkward sequences spanning 3+ keystrokes

## Chunk transfer

How much fundamental bigram movement is automatically practiced by high-value
trigrams and 4-grams?

Can a small set of natural chunks cover most important transitions?

## Curriculum optimization

Eventually optimize something like:

frequency
× mechanical difficulty
× empirical learner error
× transfer coverage
× linguistic usefulness
× naturalness

while penalizing redundant drills.

## Corpora

Compare:

1. Google Books
2. Google Web corpus
3. SUBTLEX-US
4. eventually modern running text including:
   - spaces
   - punctuation
   - contractions
   - capitalization
   - cross-word transitions
   - chat/email prose

## Pedagogy

Desired hierarchy:

key
→ transition
→ short gesture
→ word
→ phrase
→ sentence
→ fluent text

A difficult movement should be isolatable like a difficult transition or
fingering in classical instrumental practice.
