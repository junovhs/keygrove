# Typing Movement Baseline

Source: Peter Norvig Google Books-derived letter n-gram tables.

Keyboard model: conventional US QWERTY; B = left index.

## Corpus totals

| n | observed types | total occurrences |
|---:|---:|---:|
| 2 | 669 | 2,819,662,855,499 |
| 3 | 8,653 | 2,098,121,156,991 |
| 4 | 42,171 | 1,507,873,312,542 |

## Number of n-grams needed for cumulative occurrence coverage

| coverage | bigrams | trigrams | 4-grams |
|---:|---:|---:|---:|
| 50% | 41 | 263 | 936 |
| 75% | 97 | 707 | 2,626 |
| 90% | 168 | 1,345 | 5,672 |
| 95% | 214 | 1,826 | 8,692 |
| 99% | 300 | 3,046 | 17,958 |

## Top-N occurrence coverage

| top N | bigrams | trigrams | 4-grams |
|---:|---:|---:|---:|
| 10 | 21.003% | 10.205% | 4.424% |
| 25 | 37.944% | 15.736% | 7.193% |
| 50 | 55.665% | 22.048% | 10.696% |
| 100 | 76.066% | 31.101% | 15.779% |
| 200 | 93.783% | 43.869% | 22.806% |
| 500 | 99.980% | 65.955% | 36.920% |
| 1,000 | — | 83.626% | 51.526% |

## Bigram movement classes

| movement | occurrence share |
|---|---:|
| alternate_hands | 52.867% |
| same_hand_different_fingers | 37.685% |
| same_finger_different_key | 6.940% |
| same_key | 2.508% |

Cross-row bigrams: **67.807%**

## Highest-frequency same-finger / different-key transitions

| SF rank | overall rank | bigram | finger | share of same-finger mass | share of all bigram mass |
|---:|---:|:---:|---|---:|---:|
| 1 | 16 | `ed` | L-middle | 16.832% | 1.168% |
| 2 | 34 | `de` | L-middle | 11.020% | 0.765% |
| 3 | 42 | `ce` | L-middle | 9.386% | 0.651% |
| 4 | 60 | `ec` | L-middle | 6.877% | 0.477% |
| 5 | 68 | `tr` | L-index | 6.136% | 0.426% |
| 6 | 76 | `un` | R-index | 5.683% | 0.394% |
| 7 | 77 | `lo` | R-ring | 5.575% | 0.387% |
| 8 | 86 | `ol` | R-ring | 5.266% | 0.365% |
| 9 | 87 | `rt` | L-index | 5.211% | 0.362% |
| 10 | 129 | `fr` | L-index | 3.072% | 0.213% |
| 11 | 135 | `gr` | L-index | 2.835% | 0.197% |
| 12 | 169 | `um` | R-index | 1.994% | 0.138% |
| 13 | 187 | `mu` | R-index | 1.652% | 0.115% |
| 14 | 188 | `br` | L-index | 1.607% | 0.112% |
| 15 | 194 | `rg` | L-index | 1.438% | 0.100% |
| 16 | 197 | `ny` | R-index | 1.411% | 0.098% |
| 17 | 198 | `ki` | R-middle | 1.410% | 0.098% |
| 18 | 219 | `ft` | L-index | 1.177% | 0.082% |
| 19 | 221 | `nu` | R-index | 1.133% | 0.079% |
| 20 | 223 | `hu` | R-index | 1.062% | 0.074% |
| 21 | 227 | `rv` | L-index | 0.998% | 0.069% |
| 22 | 236 | `my` | R-index | 0.896% | 0.062% |
| 23 | 239 | `ju` | R-index | 0.846% | 0.059% |
| 24 | 253 | `hy` | R-index | 0.722% | 0.050% |
| 25 | 258 | `ik` | R-middle | 0.618% | 0.043% |
| 26 | 266 | `ws` | L-ring | 0.506% | 0.035% |
| 27 | 269 | `rf` | L-index | 0.465% | 0.032% |
| 28 | 275 | `nm` | R-index | 0.400% | 0.028% |
| 29 | 277 | `rb` | L-index | 0.385% | 0.027% |
| 30 | 284 | `hn` | R-index | 0.371% | 0.026% |

## Bigram movement represented by common longer chunks

This measures the union of adjacent bigram transition TYPES appearing inside the most frequent longer chunks, then sums the real-world bigram occurrence mass represented by those transition types.

| source chunks | top N | unique transitions | bigram mass represented |
|---|---:|---:|---:|
| trigrams | 100 | 85 | 65.579% |
| trigrams | 250 | 139 | 82.750% |
| trigrams | 500 | 199 | 92.472% |
| trigrams | 1,000 | 268 | 97.755% |
| 4-grams | 100 | 107 | 70.752% |
| 4-grams | 250 | 165 | 85.944% |
| 4-grams | 500 | 221 | 93.210% |
| 4-grams | 1,000 | 260 | 97.205% |

## Top trigrams

| rank | trigram | share |
|---:|:---:|---:|
| 1 | `the` | 3.299% |
| 2 | `and` | 1.262% |
| 3 | `ing` | 1.015% |
| 4 | `ion` | 0.975% |
| 5 | `tio` | 0.802% |
| 6 | `ent` | 0.739% |
| 7 | `ati` | 0.561% |
| 8 | `for` | 0.541% |
| 9 | `her` | 0.521% |
| 10 | `ter` | 0.491% |
| 11 | `hat` | 0.457% |
| 12 | `tha` | 0.450% |
| 13 | `ere` | 0.426% |
| 14 | `ate` | 0.417% |
| 15 | `his` | 0.385% |
| 16 | `con` | 0.385% |
| 17 | `res` | 0.357% |
| 18 | `ver` | 0.353% |
| 19 | `all` | 0.349% |
| 20 | `ons` | 0.343% |
| 21 | `nce` | 0.331% |
| 22 | `men` | 0.328% |
| 23 | `ith` | 0.324% |
| 24 | `ted` | 0.315% |
| 25 | `ers` | 0.311% |

## Top 4-grams

| rank | 4-gram | share |
|---:|:---:|---:|
| 1 | `tion` | 1.105% |
| 2 | `atio` | 0.584% |
| 3 | `that` | 0.531% |
| 4 | `ther` | 0.445% |
| 5 | `with` | 0.404% |
| 6 | `ment` | 0.360% |
| 7 | `ions` | 0.272% |
| 8 | `this` | 0.254% |
| 9 | `here` | 0.238% |
| 10 | `from` | 0.230% |
| 11 | `ould` | 0.216% |
| 12 | `ting` | 0.213% |
| 13 | `hich` | 0.209% |
| 14 | `whic` | 0.209% |
| 15 | `ctio` | 0.202% |
| 16 | `ence` | 0.190% |
| 17 | `have` | 0.187% |
| 18 | `othe` | 0.179% |
| 19 | `ight` | 0.177% |
| 20 | `sion` | 0.173% |
| 21 | `ever` | 0.166% |
| 22 | `ical` | 0.165% |
| 23 | `they` | 0.163% |
| 24 | `inte` | 0.163% |
| 25 | `ough` | 0.159% |

## Generated tables

- `tables/bigrams_enriched.csv`
- `tables/same_finger_transitions.csv`
- `tables/top_bigrams.csv`
- `tables/top_trigrams.csv`
- `tables/top_4grams.csv`
