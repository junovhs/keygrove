# Cross-Corpus Stability

Do the movements that Google Books ranks highly hold their rank in other
English? DEC-16 promotes a target to curriculum candidate only when it
is stable across corpora; this report supplies that evidence.

Keyboard model: Traditional US QWERTY, B = left index. No composite
difficulty score; every class is reported side by side.

## Corpora

| corpus | source | bigram types / tokens | trigram types / tokens |
|---|---|---:|---:|
| Google Books | Norvig `ngrams2/3.tsv` (Mayzner revisited) | 669 / 2,819,662,855,499 | 8,653 / 2,098,121,156,991 |
| Norvig web | `count_2l.txt` / `count_3l.txt` (Google Web Trillion Word Corpus) | 676 / 6,670,825,274,245 | 17,576 / 6,020,871,394,290 |
| SUBTLEX-US | derived from word frequencies (see below) | 600 / 134,542,346 | 6,607 / 90,198,093 |

### SUBTLEX-US derivation and caveat

SUBTLEX-US (Brysbaert & New) distributes word frequencies from ~51M
tokens of American film and TV subtitles, not letter n-grams. The n-gram
counts here are **derived**: each word is lower-cased, kept only if it is
entirely A–Z (matching Norvig's alphabetic restriction), and every
within-word bigram and trigram it contains is counted once per token,
weighted by the word's `FREQcount`. 74,286 word entries were
kept (49,719,560 tokens); 0 non-alphabetic
entries were dropped.

**Caveat:** this is a word-list derivation, not running text. It carries
no information about spaces, punctuation, capitals or cross-word
movement, and it inherits SUBTLEX's tokenisation (contractions arrive
split at the apostrophe — `don't` counts as `don` + `t` — so their
fragments inflate short entries and `n't`/`'ll` bigrams never appear). Norvig's
Google Books tables were built the same way from the books word list, so
the two are comparable; the Norvig web counts come from a different
pipeline over the trillion-word corpus.

### Stability classes

Membership in the top-N of each corpus (bigrams N = 200, trigrams
N = 500, same-finger transitions N = 30 within the
same-finger sub-ranking of that corpus):

| class | meaning |
|---|---|
| `universal` | top-N in all three corpora — the only class DEC-16 lets us promote |
| `book-leaning` / `web-leaning` / `conversational-leaning` | top-N in exactly that one corpus |
| `unstable` | top-N in two corpora, drops out of the third (`missing_from` names it) |
| `below-cut` | top-N in none (CSV only) |

`rank_spread` = max rank − min rank across the three corpora.

## Bigram movement classes per corpus

| movement | Google Books | Norvig web | SUBTLEX-US |
|---|---:|---:|---:|
| alternate_hands | 52.867% | 50.047% | 50.888% |
| same_hand_different_fingers | 37.685% | 39.248% | 39.899% |
| same_finger_different_key | 6.940% | 7.738% | 5.763% |
| same_key | 2.508% | 2.967% | 3.450% |

## Trigram gesture features per corpus

| feature | Google Books | Norvig web | SUBTLEX-US |
|---|---:|---:|---:|
| contains_same_finger | 13.528% | 14.955% | 11.327% |
| same_finger_chain | 0.503% | 0.596% | 0.277% |
| redirect | 6.579% | 6.932% | 5.446% |
| double_row_change | 45.712% | 45.220% | 42.290% |

## How much of the Google Books ranking survives

| set | universal | book-leaning | web-leaning | conversational-leaning | unstable |
|---|---:|---:|---:|---:|---:|
| Google Books top-200 bigrams | 173 | 5 | 0 | 0 | 22 |
| Google Books top-500 trigrams | 294 | 62 | 0 | 0 | 144 |
| Google Books top-30 same-finger transitions | 25 | 1 | 0 | 0 | 4 |

## Top-30 same-finger transitions across corpora

Ranks are positions within each corpus's same-finger sub-list; overall
bigram rank in Google Books is shown for reference.

| SF rank (books) | overall (books) | bigram | finger | SF rank (web) | SF rank (subtlex) | spread | class | missing from |
|---:|---:|:---:|---|---:|---:|---:|---|---|
| 1 | 16 | `ed` | L-middle | 1 | 1 | 0 | universal | — |
| 2 | 34 | `de` | L-middle | 2 | 3 | 1 | universal | — |
| 3 | 42 | `ce` | L-middle | 4 | 4 | 1 | universal | — |
| 4 | 60 | `ec` | L-middle | 3 | 10 | 7 | universal | — |
| 5 | 68 | `tr` | L-index | 7 | 9 | 4 | universal | — |
| 6 | 76 | `un` | R-index | 9 | 5 | 4 | universal | — |
| 7 | 77 | `lo` | R-ring | 6 | 2 | 5 | universal | — |
| 8 | 86 | `ol` | R-ring | 8 | 7 | 1 | universal | — |
| 9 | 87 | `rt` | L-index | 5 | 11 | 6 | universal | — |
| 10 | 129 | `fr` | L-index | 10 | 13 | 3 | universal | — |
| 11 | 135 | `gr` | L-index | 12 | 16 | 5 | universal | — |
| 12 | 169 | `um` | R-index | 13 | 21 | 9 | universal | — |
| 13 | 187 | `mu` | R-index | 21 | 19 | 8 | universal | — |
| 14 | 188 | `br` | L-index | 15 | 17 | 3 | universal | — |
| 15 | 194 | `rg` | L-index | 20 | 23 | 8 | universal | — |
| 16 | 197 | `ny` | R-index | 18 | 14 | 4 | universal | — |
| 17 | 198 | `ki` | R-middle | 14 | 8 | 9 | universal | — |
| 18 | 219 | `ft` | L-index | 11 | 22 | 11 | universal | — |
| 19 | 221 | `nu` | R-index | 16 | 25 | 9 | universal | — |
| 20 | 223 | `hu` | R-index | 30 | 20 | 10 | universal | — |
| 21 | 227 | `rv` | L-index | 19 | 28 | 9 | universal | — |
| 22 | 236 | `my` | R-index | 27 | 6 | 21 | universal | — |
| 23 | 239 | `ju` | R-index | 28 | 12 | 16 | universal | — |
| 24 | 253 | `hy` | R-index | 37 | 18 | 19 | unstable | web |
| 25 | 258 | `ik` | R-middle | 34 | 15 | 19 | unstable | web |
| 26 | 266 | `ws` | L-ring | 22 | 29 | 7 | universal | — |
| 27 | 269 | `rf` | L-index | 26 | 30 | 4 | universal | — |
| 28 | 275 | `nm` | R-index | 24 | 39 | 15 | unstable | subtlex |
| 29 | 277 | `rb` | L-index | 29 | 35 | 6 | unstable | subtlex |
| 30 | 284 | `hn` | R-index | 36 | 33 | 6 | book-leaning | web,subtlex |

Same-finger transitions that reach the top-30 in web or
SUBTLEX-US but not in Google Books:

| bigram | finger | SF rank (books) | SF rank (web) | SF rank (subtlex) | class |
|:---:|---|---:|---:|---:|---|
| `sw` | L-ring | 33 | 17 | 27 | unstable |
| `gt` | L-index | 35 | 23 | 44 | web-leaning |
| `dc` | L-middle | 46 | 25 | 48 | web-leaning |
| `uy` | R-index | 43 | 43 | 24 | conversational-leaning |
| `uh` | R-index | 53 | 58 | 26 | conversational-leaning |

## Book-artefact bigrams

Google Books top-200 bigrams that fall outside the top-300
in either other corpus.

_none — every Google Books top-200 bigram is inside the
top-300 of both other corpora._

Largest rank spreads inside the Google Books top-200 bigrams:

| bigram | movement | rank books | rank web | rank subtlex | spread | class |
|:---:|---|---:|---:|---:|---:|---|
| `yo` | same_hand_different_fingers | 157 | 96 | 7 | 150 | universal |
| `go` | alternate_hands | 174 | 166 | 44 | 130 | universal |
| `wh` | alternate_hands | 81 | 155 | 30 | 125 | universal |
| `rc` | same_hand_different_fingers | 181 | 138 | 257 | 119 | unstable |
| `do` | alternate_hands | 140 | 111 | 34 | 106 | universal |
| `io` | same_hand_different_fingers | 29 | 35 | 129 | 100 | universal |
| `ak` | alternate_hands | 191 | 226 | 128 | 98 | unstable |
| `ht` | alternate_hands | 175 | 172 | 80 | 95 | universal |
| `du` | alternate_hands | 160 | 173 | 254 | 94 | unstable |
| `ey` | alternate_hands | 166 | 193 | 99 | 94 | universal |
| `ew` | same_hand_different_fingers | 186 | 98 | 191 | 93 | universal |
| `ia` | alternate_hands | 106 | 106 | 197 | 91 | universal |
| `va` | same_hand_different_fingers | 168 | 174 | 258 | 90 | unstable |
| `ck` | alternate_hands | 185 | 144 | 95 | 90 | universal |
| `sc` | same_hand_different_fingers | 154 | 116 | 204 | 88 | unstable |

## Book-artefact trigrams

Google Books top-200 trigrams that fall outside the top-300
in either other corpus.

| trigram | gesture tags | rank books | rank web | rank subtlex |
|:---:|---|---:|---:|---:|
| `cti` | — | 42 | 62 | 329 |
| `ica` | double_row_change | 43 | 58 | 345 |
| `iti` | — | 49 | 82 | 350 |
| `rat` | double_row_change | 50 | 78 | 330 |
| `whi` | double_row_change | 60 | 416 | 325 |
| `tic` | — | 72 | 135 | 315 |
| `enc` | — | 74 | 176 | 360 |
| `ity` | — | 77 | 86 | 413 |
| `hic` | double_row_change | 85 | 434 | 523 |
| `ies` | — | 86 | 70 | 316 |
| `ich` | double_row_change | 89 | 412 | 440 |
| `era` | redirect | 94 | 74 | 448 |
| `wer` | — | 95 | 340 | 134 |
| `oul` | — | 97 | 342 | 41 |
| `nal` | — | 102 | 88 | 460 |
| `but` | — | 103 | 375 | 49 |
| `uld` | — | 105 | 402 | 43 |
| `ces` | contains_same_finger,double_row_change | 110 | 80 | 541 |
| `lat` | — | 112 | 220 | 307 |
| `ssi` | — | 129 | 166 | 312 |
| `ial` | — | 130 | 198 | 564 |
| `tiv` | — | 133 | 268 | 684 |
| `nts` | double_row_change | 134 | 98 | 346 |
| `whe` | double_row_change | 135 | 438 | 54 |
| `tat` | double_row_change | 136 | 145 | 590 |
| `abl` | double_row_change | 137 | 219 | 335 |
| `dis` | double_row_change | 138 | 207 | 444 |
| `had` | — | 143 | 972 | 217 |
| `ont` | double_row_change | 145 | 42 | 362 |
| `ugh` | — | 147 | 552 | 93 |
| `inc` | — | 148 | 157 | 435 |
| `sio` | — | 149 | 233 | 520 |
| `ral` | — | 151 | 280 | 690 |
| `nat` | double_row_change | 154 | 245 | 558 |
| `ins` | double_row_change | 155 | 171 | 320 |
| `she` | — | 160 | 405 | 56 |
| `ose` | double_row_change | 161 | 343 | 150 |
| `lly` | — | 163 | 415 | 98 |
| `rec` | contains_same_finger | 164 | 124 | 411 |
| `lan` | — | 165 | 126 | 317 |
| `hey` | — | 167 | 590 | 38 |
| `pos` | — | 169 | 218 | 352 |
| `den` | contains_same_finger,double_row_change | 172 | 250 | 394 |
| `oug` | — | 173 | 578 | 120 |
| `ned` | contains_same_finger,double_row_change | 175 | 497 | 270 |
| `rit` | — | 176 | 248 | 462 |
| `orm` | — | 181 | 130 | 652 |
| `ndi` | double_row_change | 182 | 163 | 639 |
| `ona` | double_row_change | 183 | 79 | 631 |
| `ene` | double_row_change | 185 | 214 | 322 |
| `hei` | — | 186 | 323 | 542 |
| `ric` | — | 187 | 153 | 430 |
| `ord` | — | 189 | 199 | 308 |
| `omp` | redirect,double_row_change | 190 | 170 | 515 |
| `sen` | double_row_change | 192 | 312 | 379 |
| `tri` | contains_same_finger | 194 | 260 | 414 |
| `ern` | — | 195 | 232 | 678 |
| `tes` | — | 196 | 131 | 385 |
| `por` | — | 197 | 114 | 458 |
| `app` | — | 198 | 310 | 171 |
| `lar` | — | 199 | 356 | 621 |
| `ntr` | contains_same_finger | 200 | 265 | 600 |

## Gesture examples

The named examples from DEC-13 / the trigram gesture atlas, with rank in
each corpus and stability class (bigram examples use the bigram cut,
trigram examples the trigram cut).

| n-gram | mechanics | rank books | rank web | rank subtlex | spread | class | missing from |
|:---:|---|---:|---:|---:|---:|---|---|
| `ion` | redirect | 4 | 4 | 46 | 42 | universal | — |
| `ing` | double_row_change | 3 | 2 | 3 | 1 | universal | — |
| `nce` | contains_same_finger | 21 | 43 | 106 | 85 | universal | — |
| `ted` | contains_same_finger | 24 | 41 | 131 | 107 | universal | — |
| `ded` | contains_same_finger,same_finger_chain,double_row_change | 263 | 465 | 597 | 334 | unstable | subtlex |
| `olo` | contains_same_finger,same_finger_chain,double_row_change | 416 | 454 | 798 | 382 | unstable | subtlex |
| `mu` | same_finger_different_key | 187 | 223 | 190 | 36 | unstable | web |
| `um` | same_finger_different_key | 169 | 175 | 212 | 43 | unstable | subtlex |

## Top same finger chain trigrams across corpora

Ranked by Google Books; ranks shown are overall trigram ranks.

| trigram | rank books | rank web | rank subtlex | spread | class |
|:---:|---:|---:|---:|---:|---|
| `ded` | 263 | 465 | 597 | 334 | unstable |
| `olo` | 416 | 454 | 798 | 382 | unstable |
| `ece` | 427 | 538 | 769 | 342 | book-leaning |
| `ced` | 437 | 782 | 1025 | 588 | book-leaning |
| `dec` | 604 | 670 | 839 | 235 | below-cut |
| `num` | 757 | 1012 | 979 | 255 | below-cut |
| `mun` | 892 | 990 | 1690 | 798 | below-cut |
| `ede` | 934 | 425 | 1293 | 868 | web-leaning |
| `hum` | 1006 | 1565 | 1052 | 559 | below-cut |
| `hun` | 1295 | 1854 | 921 | 933 | below-cut |
| `jun` | 1637 | 1573 | 1659 | 86 | below-cut |
| `nju` | 1867 | 2541 | 2339 | 674 | below-cut |
| `mum` | 1947 | 2738 | 2121 | 791 | below-cut |
| `umn` | 2110 | 3046 | 2690 | 936 | below-cut |
| `rtr` | 2209 | 1897 | 2508 | 611 | below-cut |

## Top redirect trigrams across corpora

Ranked by Google Books; ranks shown are overall trigram ranks.

| trigram | rank books | rank web | rank subtlex | spread | class |
|:---:|---:|---:|---:|---:|---|
| `ion` | 4 | 4 | 46 | 42 | universal |
| `ate` | 14 | 10 | 62 | 52 | universal |
| `ers` | 25 | 11 | 88 | 77 | universal |
| `are` | 29 | 25 | 23 | 6 | universal |
| `est` | 40 | 14 | 95 | 81 | universal |
| `sta` | 41 | 31 | 64 | 33 | universal |
| `ear` | 45 | 37 | 53 | 16 | universal |
| `ave` | 61 | 96 | 21 | 75 | universal |
| `ste` | 87 | 61 | 111 | 50 | universal |
| `era` | 94 | 74 | 448 | 374 | universal |
| `age` | 115 | 39 | 279 | 240 | universal |
| `eas` | 122 | 119 | 130 | 11 | universal |
| `eat` | 127 | 158 | 121 | 37 | universal |
| `ard` | 166 | 161 | 174 | 13 | universal |
| `omp` | 190 | 170 | 515 | 345 | unstable |

## Top double row change trigrams across corpora

Ranked by Google Books; ranks shown are overall trigram ranks.

| trigram | rank books | rank web | rank subtlex | spread | class |
|:---:|---:|---:|---:|---:|---|
| `the` | 1 | 1 | 2 | 1 | universal |
| `and` | 2 | 3 | 8 | 6 | universal |
| `ing` | 3 | 2 | 3 | 1 | universal |
| `ent` | 6 | 6 | 42 | 36 | universal |
| `his` | 15 | 40 | 12 | 28 | universal |
| `con` | 16 | 24 | 144 | 128 | universal |
| `ons` | 20 | 22 | 215 | 195 | universal |
| `men` | 22 | 20 | 149 | 129 | universal |
| `thi` | 27 | 29 | 6 | 23 | universal |
| `ive` | 32 | 51 | 68 | 36 | universal |
| `ect` | 34 | 35 | 205 | 171 | universal |
| `com` | 36 | 15 | 39 | 24 | universal |
| `eve` | 37 | 76 | 29 | 47 | universal |
| `int` | 39 | 19 | 140 | 121 | universal |
| `est` | 40 | 14 | 95 | 81 | universal |

## Generated tables

- `tables/bigrams_cross_corpus.csv`
- `tables/trigrams_cross_corpus.csv`
- `tables/same_finger_cross_corpus.csv`

## Interpretation boundary

Stability says a movement is common in every register we have; it says
nothing about how hard it is. Candidate selection (RES-03) reads the
`universal` rows; `unstable` and leaning rows stay visible so that a
register-specific choice is deliberate, never accidental.
