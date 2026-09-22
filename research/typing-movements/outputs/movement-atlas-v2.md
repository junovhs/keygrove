# Typing Movement Atlas v2

This version fixes the major geometry problem in v1.

Different fingers are no longer treated as though one finger physically
travels from the first key to the second key.

Instead:

- every key has a **home reach** from its assigned finger's resting key;
- different-finger bigrams retain those reaches separately;
- **same-finger travel** is measured directly from key to key;
- no composite difficulty score is asserted yet.

Frequency-weighted mean home reach per letter event: **0.831 key widths**.

## Highest-frequency same-finger transitions

| rank | bg | overall | share | finger | travel | home reaches | examples |
|---:|:---:|---:|---:|---|---:|---:|---|
| 1 | `ed` | 16 | 1.168% | L-middle | 1.03 | 1.03 + 0.00 | used, called, united, need, education, based |
| 2 | `de` | 34 | 0.765% | L-middle | 1.03 | 0.00 + 1.03 | made, under, de, order, development, side |
| 3 | `ce` | 42 | 0.651% | L-middle | 2.14 | 1.12 + 1.03 | place, since, once, process, certain, service |
| 4 | `ec` | 60 | 0.477% | L-middle | 2.14 | 1.03 + 1.12 | because, second, become, effect, economic, necessary |
| 5 | `tr` | 68 | 0.426% | L-index | 1.00 | 1.25 + 1.03 | country, control, true, trade, structure, treatment |
| 6 | `un` | 76 | 0.394% | R-index | 2.02 | 1.03 + 1.12 | under, found, country, united, university, until |
| 7 | `lo` | 77 | 0.387% | R-ring | 1.03 | 0.00 + 1.03 | long, development, following, love, look, london |
| 8 | `ol` | 86 | 0.365% | R-ring | 1.03 | 1.03 + 0.00 | old, school, following, political, whole, control |
| 9 | `rt` | 87 | 0.362% | L-index | 1.00 | 1.03 + 1.25 | part, important, certain, court, further, party |
| 10 | `fr` | 129 | 0.213% | L-index | 1.03 | 0.00 + 1.03 | from, free, french, friends, front, france |
| 11 | `gr` | 135 | 0.197% | L-index | 1.60 | 1.00 + 1.03 | great, group, groups, greater, growth, program |
| 12 | `um` | 169 | 0.138% | R-index | 2.14 | 1.03 + 1.12 | number, human, volume, numbers, circumstances, summer |
| 13 | `mu` | 187 | 0.115% | R-index | 2.14 | 1.12 + 1.03 | must, much, community, music, communication, maximum |
| 14 | `br` | 188 | 0.112% | L-index | 2.66 | 1.80 + 1.03 | brought, british, bring, library, brother, brown |
| 15 | `rg` | 194 | 0.100% | L-index | 1.60 | 1.03 + 1.00 | large, energy, organization, george, larger, charge |
| 16 | `ny` | 197 | 0.098% | R-index | 2.14 | 1.12 + 1.60 | any, many, company, anything, germany, anyone |
| 17 | `ki` | 198 | 0.098% | R-middle | 1.03 | 0.00 + 1.03 | making, king, kind, working, taking, looking |
| 18 | `ft` | 219 | 0.082% | L-index | 1.25 | 0.00 + 1.25 | after, often, left, fifty, soft, afterwards |
| 19 | `nu` | 221 | 0.079% | R-index | 2.02 | 1.12 + 1.03 | number, continued, numbers, minutes, january, continue |
| 20 | `hu` | 223 | 0.074% | R-index | 1.25 | 1.00 + 1.03 | thus, human, church, hundred, husband, churches |
| 21 | `rv` | 227 | 0.069% | L-index | 2.14 | 1.03 + 1.12 | service, services, observed, serve, served, survey |
| 22 | `my` | 236 | 0.062% | R-index | 2.66 | 1.12 + 1.60 | my, army, myself, economy, enemy, academy |
| 23 | `ju` | 239 | 0.059% | R-index | 1.03 | 0.00 + 1.03 | just, june, july, justice, judge, judgment |
| 24 | `hy` | 253 | 0.050% | R-index | 1.03 | 1.00 + 1.60 | why, physical, philosophy, thy, hypothesis, physician |
| 25 | `ik` | 258 | 0.043% | R-middle | 1.03 | 1.03 + 0.00 | like, likely, unlike, strike, striking, likewise |
| 26 | `ws` | 266 | 0.035% | L-ring | 1.03 | 1.03 + 0.00 | shows, laws, follows, news, views, knows |
| 27 | `rf` | 269 | 0.032% | L-index | 1.03 | 1.03 + 0.00 | surface, performance, powerful, perfect, performed, perform |
| 28 | `nm` | 275 | 0.028% | R-index | 1.00 | 1.12 + 1.12 | government, environment, environmental, governments, assignment, governmental |
| 29 | `rb` | 277 | 0.027% | L-index | 2.66 | 1.03 + 1.80 | urban, carbon, verbal, absorbed, nearby, arbitrary |
| 30 | `hn` | 284 | 0.026% | R-index | 1.12 | 1.00 + 1.12 | john, technology, technical, techniques, technique, johnson |

## High-frequency transitions with combined home reach >= 2.0

| rank | bg | overall | share | combined reach | max reach | movement | examples |
|---:|:---:|---:|---:|---:|---:|---|---|
| 1 | `th` | 1 | 3.556% | 2.25 | 1.25 | alternate_hands | the, that, with, this, they, their |
| 2 | `he` | 2 | 3.075% | 2.03 | 1.03 | alternate_hands | the, he, they, their, her, there |
| 3 | `in` | 3 | 2.433% | 2.15 | 1.12 | same_hand_different_fingers | in, into, being, during, against, since |
| 4 | `er` | 4 | 2.048% | 2.06 | 1.03 | same_hand_different_fingers | were, her, there, other, after, very |
| 5 | `re` | 6 | 1.854% | 2.06 | 1.03 | same_hand_different_fingers | are, were, there, more, where, before |
| 6 | `on` | 7 | 1.758% | 2.15 | 1.12 | same_hand_different_fingers | on, one, only, upon, long, among |
| 7 | `en` | 9 | 1.454% | 2.15 | 1.12 | alternate_hands | been, when, then, between, even, men |
| 8 | `ti` | 11 | 1.343% | 2.28 | 1.25 | alternate_hands | time, still, information, political, until, national |
| 9 | `or` | 13 | 1.277% | 2.06 | 1.03 | alternate_hands | for, or, more, work, before, world |
| 10 | `te` | 14 | 1.205% | 2.28 | 1.25 | same_hand_different_fingers | after, state, system, states, water, often |
| 11 | `it` | 18 | 1.123% | 2.28 | 1.25 | alternate_hands | it, with, its, without, little, within |
| 12 | `to` | 22 | 1.041% | 2.28 | 1.25 | alternate_hands | to, into, too, history, took, together |
| 13 | `nt` | 23 | 1.041% | 2.37 | 1.25 | alternate_hands | into, government, different, point, important, present |
| 14 | `ng` | 24 | 0.953% | 2.12 | 1.12 | alternate_hands | being, long, during, among, following, things |
| 15 | `ou` | 28 | 0.870% | 2.06 | 1.03 | same_hand_different_fingers | you, would, about, out, could, our |
| 16 | `io` | 29 | 0.835% | 2.06 | 1.03 | same_hand_different_fingers | information, national, period, question, action, education |
| 17 | `ve` | 31 | 0.825% | 2.15 | 1.12 | same_hand_different_fingers | have, very, over, even, however, every |
| 18 | `co` | 32 | 0.794% | 2.15 | 1.12 | alternate_hands | could, come, second, country, course, control |
| 19 | `me` | 33 | 0.793% | 2.15 | 1.12 | alternate_hands | some, time, me, same, men, government |
| 20 | `hi` | 35 | 0.763% | 2.03 | 1.03 | same_hand_different_fingers | this, his, which, him, while, high |
| 21 | `ri` | 36 | 0.728% | 2.06 | 1.03 | alternate_hands | during, right, american, period, various, experience |
| 22 | `ro` | 37 | 0.727% | 2.06 | 1.03 | alternate_hands | from, through, group, process, control, around |
| 23 | `ic` | 38 | 0.699% | 2.15 | 1.12 | alternate_hands | which, public, american, political, economic, service |
| 24 | `ne` | 39 | 0.692% | 2.15 | 1.12 | alternate_hands | one, new, general, never, need, line |
| 25 | `ce` | 42 | 0.651% | 2.15 | 1.12 | same_finger_different_key | place, since, once, process, certain, service |

## High-frequency same-hand outward movements

| rank | bg | overall | share | combined reach | max reach | movement | examples |
|---:|:---:|---:|---:|---:|---:|---|---|
| 1 | `re` | 6 | 1.854% | 2.06 | 1.03 | same_hand_different_fingers | are, were, there, more, where, before |
| 2 | `es` | 12 | 1.339% | 1.03 | 1.03 | same_hand_different_fingers | these, does, states, less, present, process |
| 3 | `te` | 14 | 1.205% | 2.28 | 1.25 | same_hand_different_fingers | after, state, system, states, water, often |
| 4 | `io` | 29 | 0.835% | 2.06 | 1.03 | same_hand_different_fingers | information, national, period, question, action, education |
| 5 | `ve` | 31 | 0.825% | 2.15 | 1.12 | same_hand_different_fingers | have, very, over, even, however, every |
| 6 | `hi` | 35 | 0.763% | 2.03 | 1.03 | same_hand_different_fingers | this, his, which, him, while, high |
| 7 | `ea` | 40 | 0.688% | 1.03 | 1.03 | same_hand_different_fingers | each, years, great, year, early, means |
| 8 | `ra` | 41 | 0.686% | 1.03 | 1.03 | same_hand_different_fingers | general, rather, several, rate, natural, trade |
| 9 | `be` | 46 | 0.576% | 2.83 | 1.80 | same_hand_different_fingers | be, been, between, being, because, before |
| 10 | `ca` | 51 | 0.538% | 1.12 | 1.12 | same_hand_different_fingers | can, because, case, called, american, came |
| 11 | `ta` | 53 | 0.530% | 1.25 | 1.25 | same_hand_different_fingers | state, states, take, important, certain, data |
| 12 | `ho` | 58 | 0.485% | 2.03 | 1.03 | same_hand_different_fingers | who, should, those, how, however, without |
| 13 | `no` | 62 | 0.465% | 2.15 | 1.12 | same_hand_different_fingers | not, no, now, another, know, known |
| 14 | `il` | 67 | 0.432% | 1.03 | 1.03 | same_hand_different_fingers | will, while, still, children, family, until |
| 15 | `rs` | 75 | 0.397% | 1.03 | 1.03 | same_hand_different_fingers | first, years, others, university, course, person |
| 16 | `wa` | 78 | 0.385% | 1.03 | 1.03 | same_hand_different_fingers | was, way, water, war, always, away |
| 17 | `ge` | 79 | 0.385% | 2.03 | 1.03 | same_hand_different_fingers | general, large, get, change, age, together |
| 18 | `ul` | 91 | 0.346% | 1.03 | 1.03 | same_hand_different_fingers | would, could, should, result, full, particular |
| 19 | `ni` | 92 | 0.339% | 2.15 | 1.12 | same_hand_different_fingers | united, university, night, community, union, organization |
| 20 | `ts` | 93 | 0.337% | 1.25 | 1.25 | same_hand_different_fingers | its, itself, results, students, rights, effects |
| 21 | `mo` | 94 | 0.337% | 2.15 | 1.12 | same_hand_different_fingers | more, most, among, common, almost, mother |
| 22 | `mi` | 98 | 0.318% | 2.15 | 1.12 | same_hand_different_fingers | might, family, mind, economic, similar, military |
| 23 | `mp` | 117 | 0.239% | 2.15 | 1.12 | same_hand_different_fingers | important, example, company, simple, complete, simply |
| 24 | `fe` | 118 | 0.237% | 1.03 | 1.03 | same_hand_different_fingers | life, different, few, effect, felt, effects |
| 25 | `op` | 123 | 0.224% | 2.06 | 1.03 | same_hand_different_fingers | people, development, open, population, property, developed |

## Previously discussed transitions

| bg | overall rank | share | class | same-finger travel | combined home reach | examples |
|:---:|---:|---:|---|---:|---:|---|
| `ed` | 16 | 1.168123% | same_finger_different_key | 1.03 | 1.03 | used, called, united, need, education, based, knowledge, asked |
| `ce` | 42 | 0.651417% | same_finger_different_key | 2.14 | 2.15 | place, since, once, process, certain, service, necessary, century |
| `tr` | 68 | 0.425820% | same_finger_different_key | 1.00 | 2.28 | country, control, true, trade, structure, treatment, central, countries |
| `un` | 76 | 0.394413% | same_finger_different_key | 2.02 | 2.15 | under, found, country, united, university, until, young, around |
| `lo` | 77 | 0.386884% | same_finger_different_key | 1.03 | 1.03 | long, development, following, love, look, london, local, along |
| `um` | 169 | 0.138383% | same_finger_different_key | 2.14 | 2.15 | number, human, volume, numbers, circumstances, summer, argument, numerous |
| `mu` | 187 | 0.114619% | same_finger_different_key | 2.14 | 2.15 | must, much, community, music, communication, maximum, minimum, multiple |
| `qa` | 556 | 0.000152% | same_finger_different_key | 1.03 | 1.03 | qaeda, qa, qatar, qasim, aqaba, qaddafi, qadi, qadir |

## Why this matters for the next stage

For multi-key gestures, we can now track each finger independently.
That lets a trigram model distinguish things such as:

- repeated use of the same finger;
- same-finger direction reversal;
- inward vs outward rolls;
- redirects across three fingers;
- repeated row changes;
- one finger remaining displaced while another acts;
- total and peak home-position reach.

Those are much closer to the classical-instrument notion of a
**difficult fingering or transition** than raw distance between letters.

## Generated file

- `outputs/tables/movement_atlas_v2.csv`
