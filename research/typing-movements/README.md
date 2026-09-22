# Typing Movement Research

Research workspace for building an empirically grounded typing curriculum.

The basic hypothesis:

> Typing fluency is learned partly as a vocabulary of recurring motor
> transitions and short gestures, analogous to fingering and transition
> practice in instrumental music.

## Commands

Download corpora:

    make download

Run baseline analysis:

    make analyze

Do both:

    make all

Read the compact report:

    less outputs/report.md

Look at generated tables:

    ls outputs/tables/

## Repository policy

Commit:

- scripts/
- README.md
- SOURCES.md
- notes/
- useful generated summaries under outputs/

Do not commit raw corpora. `raw/` is intentionally gitignored.

## Current keyboard model

Conventional US QWERTY touch typing.

B is assigned to the LEFT INDEX finger.

The model currently distinguishes:

- alternate hand
- same hand / different finger
- same finger / different key
- repeated key
- row changes

This is only a first mechanical model. Future work can add distance, direction,
finger strength, hand geometry, rolls, redirects, Shift, punctuation, space,
and empirical learner difficulty.
