# Typing Movement Research

Research workspace for building an empirically grounded typing curriculum.

The basic hypothesis:

> Typing fluency is learned partly as a vocabulary of recurring motor
> transitions and short gestures, analogous to fingering and transition
> practice in instrumental music.

## Commands

Download corpora (checked against the pinned `SHA256SUMS.txt` when done):

    make download

Check the corpora in `raw/` still match the pinned checksums:

    make verify

Run every current analysis in order (verifies first; a second run leaves `outputs/` unchanged):

    make analyze

Regenerate `src/curriculum/movements.ts` from the candidate sets:

    make export

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

Do not commit raw corpora. `raw/` is intentionally gitignored; `SHA256SUMS.txt` pins the exact files the committed
outputs were built from.

The scripts use the Python 3 standard library only; there is no `requirements.txt` to install.

## Current keyboard model

Conventional US QWERTY touch typing, B on the LEFT INDEX finger, with the v2 geometry of
`scripts/build_movement_atlas_v2.py` (DEC-16):

- every key has a **home reach** from its assigned finger's resting key;
- same-finger bigrams measure the finger's travel between the two keys;
- different-finger bigrams keep their two home reaches separate.

No composite difficulty score is asserted before learner data exists, and a target is promoted only when it is stable
across corpora. The v1 atlas (flat keyboard distance) is archived under `outputs/archive/` and `scripts/archive/`; do not
use its distance figures.

## Canonical outputs

| Output | Built by | Used for |
| --- | --- | --- |
| `outputs/report.md`, `outputs/tables/top_*.csv`, `bigrams_enriched.csv`, `same_finger_transitions.csv` | `analyze_norvig.py` | Frequency baseline |
| `outputs/cross-corpus-stability.md`, `outputs/tables/*_cross_corpus.csv` | `analyze_cross_corpus.py` | Which movements hold across books, web and subtitles |
| `outputs/movement-atlas-v2.md`, `outputs/tables/movement_atlas_v2.csv` | `build_movement_atlas_v2.py` | Reach geometry (the current model) |
| `outputs/trigram-gesture-atlas.md`, `outputs/tables/trigram_gesture_atlas.csv` | `analyze_trigram_gestures.py` | Three-letter gestures |
| `outputs/candidates.md`, `outputs/candidates/*.csv` | `build_candidates.py` | The candidate sets; read by `docs/04-movement-vocabulary-checkpoint.md` |
| `src/curriculum/movements.ts` (in the app) | `export_movements.py` | The v1 vocabulary the app ships |
