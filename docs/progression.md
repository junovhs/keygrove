# Keygrove — Progression & Levels

Design of record for the curriculum. Ishoo ADR DEC on "progression model" points here.
Vocabulary: **Grove** = world · **Trail** = level · **Run** = one attempt at a trail's text.

## Principles

1. **Accuracy and rhythm gate, speed decorates.** You never advance on WPM. Advancement is per-key *mastery* (accuracy + steady rhythm + enough volume); WPM only earns stars.
2. **Introduce keys by finger, in pairs, symmetric.** Each new trail adds one left-hand key and its right-hand mirror (F+J, D+K, …), so both hands learn the same reach at once.
3. **Cumulative key set.** A trail's text may only use keys unlocked at or before it. This is a hard invariant, enforced by tests.
4. **Stages come from evidence, not a counter.** Each run's text kind is picked from the current mastery of the trail's focus keys: `drill` (< 35%) → `mix` (< 70%) → `words`. A trail is **cleared** only when: ≥ 4 runs, the last two runs passed the accuracy gate, and every focus key is ≥ 80% mastery. Focus keys = the trail's new keys (+ Space on trail 1), or the 5 weakest unlocked keys on trails that add none. With ~10 presses of a new key per run this is ≥ 5 runs for a clean typist and open-ended for a sloppy one.
5. **A coach, not a heat map.** The path is fixed and legible, but the coach watches patterns after every run and redirects: *weak key* (mastery < 50% with errors after 3+ runs) → required finger drill; *confusion pair* (typed X for Y 4+ times recently) → required alternation drill; *searching* (≥ 30% of a key's presses come after a pause ≥ 1.8× its own baseline) → reach drill offer; *rushing* (errors climb as latency drops within a run) → note + slow-mode nudge; *fatigue* (three declining runs) → note; *rusty* (a key past its review date) → review run at session start, required when 3+ keys are due or any has slipped below 50%. Required drills block the next trail run; offers are Tab. Word choice is weighted toward weak, rusty and confused keys.
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

## Mastery model (per key)

- **Stats** (EMAs, α = 0.15): error rate; latency and latency² (variance); `base` — this key's own non-spike latency; spike rate — presses slower than 1.8 × `base` (a pause = searching; a consistently slow key is *not* searching); correct-press count; substitution counts wanted→typed (decay ×0.85 per run).
- **accuracy** = clamp((1 − err − 0.88) / 0.10): 88 % → 0, 98 % → 1.
- **rhythm** = ½·clamp(1 − cv/0.6) + ½·clamp(1 − spikes/0.3), cv = stdev/mean latency.
- **volume** = clamp(hits / 50).
- **mastery** = volume × (0.55·accuracy + 0.45·rhythm). Speed is deliberately absent. Mastered at ≥ 0.80.
- **Spaced review**: each key has an interval (starts 1 day, doubles on a correct press after its due date, caps at 30 days). Past due, mastery decays (×(1 − 0.25·overdue), floor 0.4) — which is what makes the key show up as rusty and pulls it back into texts.
- The first key of a run carries no timing evidence (there is no previous key).

## Coach decisions (in priority order after a run)

| Signal | Threshold | Action |
|---|---|---|
| weak focus key | runs ≥ 3, mastery < 0.5, err > 0.15 | **required** finger drill |
| confusion pair | ≥ 4 recent wanted→typed | **required** alternation drill |
| searching | spike rate ≥ 0.3, ≥ 10 presses | reach drill offer |
| rushing | last-third errors ≥ 2× first-third and latency < 0.8× | note |
| fatigue | 3 declining run accuracies | note |
| rusty (session start) | key past due | review run; required if ≥ 3 due or any < 0.5 |
| 3 fails in a row | — | slow-mode offer (speed stars ×0.7; accuracy unchanged) |

## Economy

- **XP** per run = `hits × (acc/100)² + 2·⌊maxCombo/8⌋`, ×1.5 on a first-time trail clear. (Current formula, with the accuracy term squared so sloppy speed pays less.)
- **Ranks** by total XP: Seed 0 · Sprout 500 · Sapling 2 000 · Young Tree 6 000 · Tree 15 000 · Grove 35 000 · Old Growth 80 000.
- **Streak** = consecutive calendar days with ≥ 1 run (today's "≥90 % runs in a row" counter becomes *combo streak*, shown on the result card only).

## State (v6)

```ts
interface SaveV6 {
  v: 6;
  trail: TrailId;                               // current
  trails: Record<TrailId, { runs: number; cleared: boolean; stars: 0|1|2|3; bestWpm: number; bestAcc: number; fails: number; recent: number[] }>;
  keys: Record<string, KeyStat>;                // see Mastery model
  confusions: Record<'k>d', number>;
  stats: { runs; chars; attempts; bestWpm; bestAcc; xp; days: number; lastDay: string; bestCombo };
  settings: { slowMode: boolean; guideStrong: boolean; reviewOn: boolean; codeGrove: boolean };
}
```
Migration: v5 `stage: 3` → `cleared: true`; key stats gain review fields with defaults. v4 `completed[]` → cleared trails; `fingerStats` → seeded key error rates.

## Invariants (tested)

1. Every trail's stage-3 text bank ⊆ cumulative key set.
2. Cumulative key sets are monotonic along the path.
3. Every grove ends in exactly one checkpoint trail.
4. Gates are monotonic non-decreasing across groves.
5. A save round-trips `migrate(v4) → v5 → JSON → v5` losslessly.
