# Keygrove — Progression & Levels

Design of record for the curriculum. Ishoo ADR DEC on "progression model" points here.
Vocabulary: **Grove** = world · **Trail** = level · **Run** = one attempt at a trail's text.

## Principles

1. **Accuracy gates, speed decorates.** You never advance on WPM alone. Every unlock is an accuracy gate; WPM only earns stars.
2. **Introduce keys by finger, in pairs, symmetric.** Each new trail adds one left-hand key and its right-hand mirror (F+J, D+K, …), so both hands learn the same reach at once.
3. **Cumulative key set.** A trail's text may only use keys unlocked at or before it. This is a hard invariant, enforced by tests.
4. **Three stages per trail.** Every trail is played as `drill → mix → words`: (1) pure new-key rhythm patterns, (2) new keys blended with the previous set, (3) real words/sentences from the cumulative set. Advancing a stage needs the trail's pass gate; all three passed = trail cleared.
5. **Adaptive underneath, linear on top.** The path is fixed and legible (a map you can see), but *which words you get* is weighted toward your weak keys, and remedial micro-drills are injected when a key runs hot.
6. **Failure is cheap.** Fail a stage 3× in a row → Keygrove offers "slow mode" (WPM star target drops, hand guide strengthens). Never lock a player out.

## Gates & stars

| | Condition |
|---|---|
| **Pass** (unlock next stage/trail) | accuracy ≥ *passAcc* for the grove |
| ★ | Pass |
| ★★ | accuracy ≥ 97 % **and** WPM ≥ *target* |
| ★★★ | accuracy = 100 % **and** WPM ≥ *target* × 1.2 |

Grove-level defaults (each trail can override):

| Grove | passAcc | WPM target |
|---|---|---|
| 1 Roots | 90 % | 15 |
| 2 Canopy | 92 % | 20 |
| 3 Undergrowth | 94 % | 25 |
| 4 Bark (shift + punctuation) | 95 % | 30 |
| 5 Rings (numbers + symbols) | 95 % | 30 |
| 6 Flow | 96 % | ladder 40 / 50 / 60 / 70 |
| 7 Code (optional) | 96 % | 40 |

A **Grove checkpoint** is the last trail of each grove: a longer mixed-words run that must be ★★ (not just Pass) to open the next grove. That is the only place speed gates anything, and the target is modest.

## The trails

Keys shown as `new keys` — the cumulative set is everything above it.

### Grove 1 — Roots (home row)
| # | Trail | New keys | Notes |
|---|---|---|---|
| 1 | Anchors | `f j` + space | Rhythm patterns `fj jf ff jj`; teach thumb space. |
| 2 | Inner Pair | `d k` | `dk kd fd jk`… |
| 3 | Ring Pair | `s l` | |
| 4 | Outer Pair | `a ;` | pinkies; explicitly slower target |
| 5 | Home Words | — | first real words: `sad lad fall ask flask salad dads` |
| 6 | Index Reach | `g h` | index fingers stretch inward and return |
| 7 | **Roots Checkpoint** | — | 60-char mixed words from all 10 keys |

### Grove 2 — Canopy (top row)
| # | Trail | New keys |
|---|---|---|
| 8 | Middle Up | `e i` |
| 9 | Index Up | `r u` |
| 10 | Index Stretch Up | `t y` |
| 11 | Ring Up | `w o` |
| 12 | Pinky Up | `q p` |
| 13 | **Canopy Checkpoint** | — (top + home words) |

### Grove 3 — Undergrowth (bottom row)
| # | Trail | New keys |
|---|---|---|
| 14 | Index Down | `v m` |
| 15 | Index Stretch Down | `b n` |
| 16 | Middle Down | `c ,` |
| 17 | Ring Down | `x .` |
| 18 | Pinky Down | `z /` |
| 19 | **Undergrowth Checkpoint** | — full alphabet words, sentences without capitals |

### Grove 4 — Bark (shift & punctuation)
| # | Trail | New keys |
|---|---|---|
| 20 | Opposite Shift | `Shift` — right-shift for left-hand letters, left-shift for right |
| 21 | Sentences | `.` + capitals in real sentences |
| 22 | Quotes & Questions | `' " ? !` |
| 23 | Dashes & Colons | `- : ( )` |
| 24 | **Bark Checkpoint** | — paragraph of 2–3 full sentences |

### Grove 5 — Rings (numbers & symbols)
| # | Trail | New keys |
|---|---|---|
| 25 | Left Numbers | `1 2 3 4 5` |
| 26 | Right Numbers | `6 7 8 9 0` |
| 27 | Mixed Numbers | dates, prices, times |
| 28 | Symbols | `@ # $ % & * = + _` |
| 29 | **Rings Checkpoint** | — prose with numbers and symbols |

### Grove 6 — Flow (speed & endurance)
Same key set; texts get richer, targets climb. Each trail is a WPM ladder (40/50/60/70) — ★ at the first rung, ★★★ at the last.
| # | Trail | Text source |
|---|---|---|
| 30 | Bigrams | top English bigrams/trigrams (`th he in er an re`) as rhythm |
| 31 | Common Words | top-200 English words, shuffled |
| 32 | Pangrams & Quotes | sentence bank |
| 33 | Endurance | 60 s continuous paragraph |
| 34 | **Flow Checkpoint** | — 90 s paragraph |

### Grove 7 — Code (optional side path)
Unlocks after Grove 4. `{ } [ ] < > ; = ( ) => .` — snippets in JS/TS/Python. Never required for the main path.

## Adaptive layer

- **Per-key model**: for every key keep an EMA of error rate (α = 0.2) and of inter-key latency. `heat = 0.7·errEMA + 0.3·(latency / personal median latency − 1)⁺`.
- **Weighted text generation**: word bank (≈10 k common English words) filtered to the cumulative key set; sampling weight for a word = 1 + Σ heat of its letters. Stages 1–2 (drill/mix) use pattern generators, stage 3 uses the bank.
- **Remedial drills**: after a run, if any unlocked key has heat > 0.35, the next run is offered as a 20-char micro-drill for that key's finger (this generalises today's "targeted finger practice"). Declinable; never blocks progression.
- **Review**: on session start, keys not seen in > 2 days get a warm-up run before the current trail. Skippable.

## Economy

- **XP** per run = `hits × (acc/100)² + 2·⌊maxCombo/8⌋`, ×1.5 on a first-time trail clear. (Current formula, with the accuracy term squared so sloppy speed pays less.)
- **Ranks** by total XP: Seed 0 · Sprout 500 · Sapling 2 000 · Young Tree 6 000 · Tree 15 000 · Grove 35 000 · Old Growth 80 000.
- **Streak** = consecutive calendar days with ≥ 1 run (today's "≥90 % runs in a row" counter becomes *combo streak*, shown on the result card only).

## State (v5)

```ts
interface SaveV5 {
  v: 5;
  trail: TrailId;                               // current
  trails: Record<TrailId, { stage: 0|1|2|3; stars: 0|1|2|3; bestWpm: number; bestAcc: number; fails: number }>;
  keys: Record<string, { err: number; lat: number; seen: number; last: number }>; // adaptive model
  stats: { runs; chars; attempts; bestWpm; bestAcc; xp; days: number; lastDay: string; bestCombo };
  settings: { slowMode: boolean; guideStrong: boolean; reviewOn: boolean; codeGrove: boolean };
}
```
Migration from `keygrove.v4`: `completed[]` → trails with `stage: 3, stars: 1`; `fingerStats` → seeded key heat; `stats` copied.

## Invariants (tested)

1. Every trail's stage-3 text bank ⊆ cumulative key set.
2. Cumulative key sets are monotonic along the path.
3. Every grove ends in exactly one checkpoint trail.
4. Gates are monotonic non-decreasing across groves.
5. A save round-trips `migrate(v4) → v5 → JSON → v5` losslessly.
