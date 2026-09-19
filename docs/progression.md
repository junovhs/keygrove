# Keygrove — Progression & Levels

Design of record for the curriculum. Ishoo ADR DEC on "progression model" points here.
Vocabulary: **Grove** = world · **Trail** = level · **Run** = one attempt at a trail's text.
Finger map: **Relaxed QWERTY 1.0** (docs/typing-method-spec.md) — Z left ring, X left middle, C left index, B right index; Traditional selectable.

## Principles

1. **Accuracy and rhythm gate; speed is a bonus.** You never advance on WPM and no star needs it. Advancement is per-key *mastery* (accuracy + steady rhythm + enough volume); stars are accuracy + run rhythm; WPM only multiplies XP.
2. **Strong fingers first, then pairs, symmetric.** Spec §22: F J → D K → E I → R U, then the rest of the home row, then the upper row, then the lower row taught with the relaxed map. Each trail adds one left-hand key and its right-hand mirror so both hands learn the same reach at once.
3. **Cumulative key set.** A trail's text may only use keys unlocked at or before it. This is a hard invariant, enforced by tests.
4. **Stages come from evidence, not a counter.** Each run's text kind is picked from the current mastery of the trail's focus keys: `drill` (< 35%) → `mix` (< 70%) → `words`. A trail is **cleared** only when: ≥ 5 runs, the last two runs passed the accuracy gate, and every focus key is ≥ 80% mastery. Focus keys = the trail's new keys (+ Space on trail 1), or the 5 weakest unlocked keys on trails that add none. With ~10 presses of a new key per run this is ≥ 5 runs for a clean typist and open-ended for a sloppy one.
5. **A coach, not a heat map.** The path is fixed and legible, but the coach watches patterns after every run and redirects: *weak key* (mastery < 50% with errors after 3+ runs) → required finger drill; *confusion pair* (typed X for Y 4+ times recently) → required alternation drill; *searching* (≥ 30% of a key's presses come after a pause ≥ 1.8× its own baseline) → reach drill offer; *rushing* (errors climb as latency drops within a run) → note + slow-mode nudge; *fatigue* (three declining runs) → note; *rusty* (a key past its review date) → review run at session start, required when 3+ keys are due or any has slipped below 50%. Required drills block the next trail run; offers are Tab. Word choice is weighted toward weak, rusty and confused keys.
6. **Failure is cheap.** Fail 3× in a row → the coach says slow right down; an even slow rhythm scores as well as a fast one. Never lock a player out.

## Gates & stars

| | Condition |
|---|---|
| **Pass** (unlock next stage/trail) | accuracy ≥ *passAcc* for the grove |
| ★ | Pass |
| ★★ | accuracy ≥ 97 % **and** run rhythm ≥ 0.6 |
| ★★★ | accuracy = 100 % **and** run rhythm ≥ 0.8 |
| swift | speed is a **bonus only**: XP × (1 + min(1, wpm / 2·reference)) — never a gate, never a star |

Grove-level defaults (each trail can override):

| Grove | passAcc | swift reference WPM |
|---|---|---|
| 1 Roots (strong fingers) | 90 % | 15 |
| 2 Home | 91 % | 18 |
| 3 Canopy | 92 % | 22 |
| 4 Undergrowth (relaxed lower row) | 94 % | 27 |
| 5 Bark (shift + punctuation) | 95 % | 32 |
| 6 Rings (numbers + symbols) | 95 % | 32 |
| 7 Flow | 96 % | ladder 40 / 50 / 60 / 70 |
| 8 Code (optional) | 96 % | 40 |

A **Grove checkpoint** is the last trail of each grove: a longer mixed-words run that must be ★★ (not just Pass) to open the next grove. Speed gates nothing anywhere; ★★ means clean *and* even.

## The trails

Keys shown as `new keys` — the cumulative set is everything above it.

### Grove 1 — Roots (strong fingers)
| # | Trail | New keys | Notes |
|---|---|---|---|
| 1 | Anchors | `f j` + space | Rhythm patterns; F and J are landmarks. |
| 2 | Inner Pair | `d k` | |
| 3 | Middle Up | `e i` | First real words: die, fee, kid. |
| 4 | Index Up | `r u` | |
| 5 | Core Words | — | |
| 6 | **Roots Checkpoint** | — | ★★ opens Home |

### Grove 2 — Home (home-row expansion)
| # | Trail | New keys |
|---|---|---|
| 7 | Ring Pair | `s l` |
| 8 | Outer Pair | `a ;` |
| 9 | Index Reach | `g h` |
| 10 | Home Words | — |
| 11 | **Home Checkpoint** | — |

### Grove 3 — Canopy (rest of the top row)
| # | Trail | New keys |
|---|---|---|
| 12 | Index Stretch Up | `t y` |
| 13 | Ring Up | `w o` |
| 14 | Pinky Up | `q p` |
| 15 | **Canopy Checkpoint** | — |

### Grove 4 — Undergrowth (lower row, relaxed map)
| # | Trail | New keys | Notes |
|---|---|---|---|
| 16 | Index Down | `v m` | |
| 17 | Index Stretch Down | `c b` | C = left index, B = right index — stated explicitly (spec §22 phase 5) |
| 18 | Middle Down | `x ,` | X = left middle |
| 19 | Ring Down | `z .` | Z = left ring |
| 22 | Last Reaches | `n /` | |
| 23 | **Undergrowth Checkpoint** | — | full alphabet, lowercase sentences |

### Grove 5 — Bark (shift & punctuation)
| # | Trail | New keys |
|---|---|---|
| 24 | Opposite Shift | `Shift` — right-shift for left-hand letters, left-shift for right |
| 23 | Sentences | `.` + capitals in real sentences |
| 24 | Quotes & Questions | `' " ? !` |
| 25 | Dashes & Colons | `- : ( )` |
| 26 | **Bark Checkpoint** | — paragraph of 2–3 full sentences |

### Grove 6 — Rings (numbers & symbols)
| # | Trail | New keys |
|---|---|---|
| 27 | Left Numbers | `1 2 3 4 5` |
| 28 | Right Numbers | `6 7 8 9 0` |
| 29 | Mixed Numbers | dates, prices, times |
| 30 | Symbols | `@ # $ % & * = + _` |
| 31 | **Rings Checkpoint** | — prose with numbers and symbols |

### Grove 7 — Flow (speed & endurance)
Same key set; texts get richer, targets climb. Each trail is a WPM ladder (40/50/60/70) — ★ at the first rung, ★★★ at the last.
| # | Trail | Text source |
|---|---|---|
| 32 | Bigrams | top English bigrams/trigrams (`th he in er an re`) as rhythm |
| 33 | Common Words | top-200 English words, shuffled |
| 34 | Pangrams & Quotes | sentence bank |
| 35 | Endurance | 60 s continuous paragraph |
| 36 | **Flow Checkpoint** | — 90 s paragraph |

### Grove 8 — Code (optional side path)
Unlocks after Grove 5 (Bark). `{ } [ ] < > ; = ( ) => .` — snippets in JS/TS/Python. Never required for the main path.

## Mastery model (per key)

- **Stats** (EMAs, α = 0.15): error rate; latency and latency² (variance); `base` — this key's own non-spike latency; spike rate — presses slower than 1.8 × `base` (a pause = searching; a consistently slow key is *not* searching); correct-press count; substitution counts wanted→typed (decay ×0.85 per run).
- **accuracy** = clamp((1 − err − 0.80) / 0.15): 80 % → 0, 95 % → 1.
- **rhythm** = ½·clamp(1 − cv/0.6) + ½·clamp(1 − spikes/0.3), cv = stdev/mean latency.
- **volume** = clamp(hits / 30).
- **mastery** = volume × (0.55·accuracy + 0.45·rhythm); Space uses rhythm = 1 (it ends words, so its timing is naturally uneven). Speed is deliberately absent. Mastered at ≥ 0.80.
- **Escape hatch**: after the 5-run minimum, three consecutive runs at ≥ 97 % accuracy with rhythm ≥ 0.6 clear the trail even if a key's stats lag.
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
| 3 fails in a row | — | 'steady' note: slow right down, even rhythm scores the same |

## Economy

- **XP** per run = `(hits × (acc/100)² + 2·⌊maxCombo/8⌋) × (1 + swift)`, ×1.5 on a first-time trail clear. `swift` = min(1, wpm / 2·reference). (Current formula, with the accuracy term squared so sloppy speed pays less.)
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

1. Every trail's generated text ⊆ cumulative key set.
2. Cumulative key sets are monotonic along the path.
3. Every grove ends in exactly one checkpoint trail.
4. Gates are monotonic non-decreasing across groves.
5. A save round-trips `migrate(v4) → v5 → JSON → v5` losslessly.
