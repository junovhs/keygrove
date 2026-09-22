# Provisional Candidate Sets

Four sets selected by corpus frequency × QWERTY mechanical class (DEC-13),
admitted only when stable across corpora (DEC-16). Every set is
**provisional until learner data** — no composite difficulty score is
computed, and nothing here is a lesson order.

Finger table: Traditional (DEC-12 default) defines class and reasons; the
Relaxed QWERTY 1.0 class is carried as a second column (Z ring, X middle,
C index, B right index).

## Sets

| set | file | size | admitted when |
|---|---|---:|---|
| core transitions | `candidates/core_transitions.csv` | 43 | universal and rank ≤ 60 in every corpus |
| technical transitions | `candidates/technical_transitions.csv` | 40 (cap 40) | universal + a mechanical reason |
| gestures | `candidates/gestures.csv` | 30 trigrams + 10 4-grams (cap 30 + 10) | universal + a gesture feature |
| practice words | `candidates/practice_words.csv` | 914 words for 80 targets | everyday-word filter (see Practice words) |

Each CSV starts with `#` header lines stating `provisional=true` and the
thresholds above; every row carries `stability` and `provisional` columns.

## Core transitions

High-mass bigrams every learner meets constantly; they are learned inside
common words and need no isolated drill. The set exists so coverage can be
checked — a course that never produces one of these has a hole.

`th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng se ha as ou le ve co me hi ri ne ea li ll om ur ca el ho`

5 of them also carry a
mechanical reason and appear in the technical set (`also_technical`).

## Technical transitions

Mechanical reasons (Traditional table):

| reason | meaning | rows |
|---|---|---:|
| `same_finger` | both keys on one finger; travel measured key to key | 25 |
| `weak_finger_reach` | a pinky off its home key (q z p) or a ring finger on the bottom row (x) | 2 |
| `stretch` | a key with home reach ≥ 1.5 key widths (y, b) | 7 |
| `same_hand_row_jump` | top ↔ bottom row on the same hand, different fingers | 20 |

65 bigrams qualify. Every universal same-finger transition
is admitted first (DEC-13 names it as the unit to teach); the remaining places
up to the cap of 40 go to the other reasons by worst-case corpus
share. Cut by the cap: `ev ay pr pa bo op ct po bu ap bl yo ba up ey ep ex pi sp ty cr bi mp ys by`.

| bigram | reasons | fingers | class | travel | reach | relaxed class | rank b/w/s | SF rank b/w/s | min share |
|:---:|---|---|---|---:|---:|---|---|---|---:|
| `ed` | same_finger | L-middle → L-middle | same_finger_different_key | 1.03 | 1.03 + 0.00 | same_finger_different_key | 16/22/37 | 1/1/1 | 0.703% |
| `de` | same_finger | L-middle → L-middle | same_finger_different_key | 1.03 | 0.00 + 1.03 | same_finger_different_key | 34/33/67 | 2/2/3 | 0.439% |
| `lo` | same_finger | R-ring → R-ring | same_finger_different_key | 1.03 | 0.00 + 1.03 | same_finger_different_key | 77/76/64 | 7/6/2 | 0.387% |
| `ce` | same_finger, same_hand_row_jump | L-middle → L-middle | same_finger_different_key | 2.14 | 1.12 + 1.03 | same_hand_different_fingers | 42/48/78 | 3/4/4 | 0.354% |
| `un` | same_finger, same_hand_row_jump | R-index → R-index | same_finger_different_key | 2.02 | 1.03 + 1.12 | same_finger_different_key | 76/90/89 | 6/9/5 | 0.330% |
| `ol` | same_finger | R-ring → R-ring | same_finger_different_key | 1.03 | 1.03 + 0.00 | same_finger_different_key | 86/86/104 | 8/8/7 | 0.274% |
| `tr` | same_finger | L-index → L-index | same_finger_different_key | 1.00 | 1.25 + 1.03 | same_finger_different_key | 68/79/115 | 5/7/9 | 0.253% |
| `ec` | same_finger, same_hand_row_jump | L-middle → L-middle | same_finger_different_key | 2.14 | 1.03 + 1.12 | same_hand_different_fingers | 60/46/121 | 4/3/10 | 0.243% |
| `rt` | same_finger | L-index → L-index | same_finger_different_key | 1.00 | 1.03 + 1.25 | same_finger_different_key | 87/66/127 | 9/5/11 | 0.234% |
| `fr` | same_finger | L-index → L-index | same_finger_different_key | 1.03 | 0.00 + 1.03 | same_finger_different_key | 129/135/140 | 10/10/13 | 0.181% |
| `gr` | same_finger | L-index → L-index | same_finger_different_key | 1.60 | 1.00 + 1.03 | same_finger_different_key | 135/157/168 | 11/12/16 | 0.122% |
| `br` | same_finger, stretch, same_hand_row_jump | L-index → L-index | same_finger_different_key | 2.66 | 1.80 + 1.03 | alternate_hands | 188/206/176 | 14/15/17 | 0.112% |
| `mu` | same_finger, same_hand_row_jump | R-index → R-index | same_finger_different_key | 2.14 | 1.12 + 1.03 | same_finger_different_key | 187/223/190 | 13/21/19 | 0.100% |
| `ny` | same_finger, stretch, same_hand_row_jump | R-index → R-index | same_finger_different_key | 2.14 | 1.12 + 1.60 | same_finger_different_key | 197/211/147 | 16/18/14 | 0.098% |
| `ki` | same_finger | R-middle → R-middle | same_finger_different_key | 1.03 | 0.00 + 1.03 | same_finger_different_key | 198/186/114 | 17/14/8 | 0.098% |
| `um` | same_finger, same_hand_row_jump | R-index → R-index | same_finger_different_key | 2.14 | 1.03 + 1.12 | same_finger_different_key | 169/175/212 | 12/13/21 | 0.080% |
| `ft` | same_finger | L-index → L-index | same_finger_different_key | 1.25 | 0.00 + 1.25 | same_finger_different_key | 219/151/220 | 18/11/22 | 0.067% |
| `rg` | same_finger | L-index → L-index | same_finger_different_key | 1.60 | 1.03 + 1.00 | same_finger_different_key | 194/219/223 | 15/20/23 | 0.065% |
| `my` | same_finger, stretch, same_hand_row_jump | R-index → R-index | same_finger_different_key | 2.66 | 1.12 + 1.60 | same_finger_different_key | 236/268/100 | 22/27/6 | 0.062% |
| `ju` | same_finger | R-index → R-index | same_finger_different_key | 1.03 | 0.00 + 1.03 | same_finger_different_key | 239/273/133 | 23/28/12 | 0.059% |
| `nu` | same_finger, same_hand_row_jump | R-index → R-index | same_finger_different_key | 2.02 | 1.12 + 1.03 | same_finger_different_key | 221/207/231 | 19/16/25 | 0.058% |
| `hu` | same_finger | R-index → R-index | same_finger_different_key | 1.25 | 1.00 + 1.03 | same_finger_different_key | 223/280/193 | 20/30/20 | 0.057% |
| `rv` | same_finger, same_hand_row_jump | L-index → L-index | same_finger_different_key | 2.14 | 1.03 + 1.12 | same_finger_different_key | 227/213/271 | 21/19/28 | 0.029% |
| `ws` | same_finger | L-ring → L-ring | same_finger_different_key | 1.03 | 1.03 + 0.00 | same_finger_different_key | 266/234/272 | 26/22/29 | 0.029% |
| `rf` | same_finger | L-index → L-index | same_finger_different_key | 1.03 | 1.03 + 0.00 | same_finger_different_key | 269/261/279 | 27/26/30 | 0.027% |
| `in` | same_hand_row_jump | R-middle → R-index | same_hand_different_fingers | — | 1.03 + 1.12 | same_hand_different_fingers | 3/1/4 | — | 2.021% |
| `on` | same_hand_row_jump | R-ring → R-index | same_hand_different_fingers | — | 1.03 + 1.12 | same_hand_different_fingers | 7/7/11 | — | 1.506% |
| `ve` | same_hand_row_jump | L-index → L-middle | same_hand_different_fingers | — | 1.12 + 1.03 | same_hand_different_fingers | 31/41/22 | — | 0.635% |
| `om` | same_hand_row_jump | R-ring → R-index | same_hand_different_fingers | — | 1.03 + 1.12 | same_hand_different_fingers | 49/47/46 | — | 0.546% |
| `no` | same_hand_row_jump | R-index → R-ring | same_hand_different_fingers | — | 1.12 + 1.03 | same_hand_different_fingers | 62/70/24 | — | 0.459% |
| `be` | stretch, same_hand_row_jump | L-index → L-middle | same_hand_different_fingers | — | 1.80 + 1.03 | alternate_hands | 46/78/40 | — | 0.408% |
| `pe` | weak_finger_reach | R-pinky → L-middle | alternate_hands | — | 1.03 + 1.03 | alternate_hands | 59/81/83 | — | 0.344% |
| `mo` | same_hand_row_jump | R-index → R-ring | same_hand_different_fingers | — | 1.12 + 1.03 | same_hand_different_fingers | 94/94/96 | — | 0.316% |
| `mi` | same_hand_row_jump | R-index → R-middle | same_hand_different_fingers | — | 1.12 + 1.03 | same_hand_different_fingers | 98/104/105 | — | 0.273% |
| `ni` | same_hand_row_jump | R-index → R-middle | same_hand_different_fingers | — | 1.12 + 1.03 | same_hand_different_fingers | 92/80/118 | — | 0.247% |
| `ry` | stretch | L-index → R-index | alternate_hands | — | 1.03 + 1.60 | alternate_hands | 116/121/92 | — | 0.241% |
| `ly` | stretch | R-ring → R-index | same_hand_different_fingers | — | 0.00 + 1.60 | same_hand_different_fingers | 69/122/94 | — | 0.241% |
| `pl` | weak_finger_reach | R-pinky → R-ring | same_hand_different_fingers | — | 1.03 + 0.00 | same_hand_different_fingers | 111/115/126 | — | 0.236% |
| `im` | same_hand_row_jump | R-middle → R-index | same_hand_different_fingers | — | 1.03 + 1.12 | same_hand_different_fingers | 97/126/93 | — | 0.232% |
| `ab` | stretch | L-pinky → L-index | same_hand_different_fingers | — | 0.00 + 1.80 | alternate_hands | 120/127/119 | — | 0.230% |

### Why `mu` is in and `qa` is out

`mu` is a same-finger (R-index) transition with 2.14 key widths of travel. Its plain bigram rank is 187 / 223 / 190 (class `unstable` at N=200), but among same-finger transitions it is rank 13 / 21 / 19 — universal within the same-finger top-30. Same-finger targets compete only with each other, so that is the admission evidence; the plain class is kept in `stability_note`.

`qa` is mechanically awkward (pinky reach, same_finger under Traditional: same_finger_different_key) but ranks 556 / 574 / 586 (books / web / subtlex), class `below-cut` — far outside the N=200 cut, so it fails the frequency half of DEC-13.

Rows admitted on same-finger evidence rather than the plain bigram class:

- `br` — bigram class unstable at N=200; universal within the same-finger top-30
- `mu` — bigram class unstable at N=200; universal within the same-finger top-30
- `ny` — bigram class unstable at N=200; universal within the same-finger top-30
- `um` — bigram class unstable at N=200; universal within the same-finger top-30
- `ft` — bigram class web-leaning at N=200; universal within the same-finger top-30
- `rg` — bigram class book-leaning at N=200; universal within the same-finger top-30
- `my` — bigram class conversational-leaning at N=200; universal within the same-finger top-30
- `ju` — bigram class conversational-leaning at N=200; universal within the same-finger top-30
- `nu` — bigram class below-cut at N=200; universal within the same-finger top-30
- `hu` — bigram class conversational-leaning at N=200; universal within the same-finger top-30
- `rv` — bigram class below-cut at N=200; universal within the same-finger top-30
- `ws` — bigram class below-cut at N=200; universal within the same-finger top-30
- `rf` — bigram class below-cut at N=200; universal within the same-finger top-30

Under the Relaxed table the class changes for: `ce ec br be ab`. The set is selected on the
Traditional table (DEC-12); a Relaxed-specific selection is a later step.

## Gestures

Features (union over the 3-letter windows of a chunk):

| feature | trigram rows | 4-gram rows |
|---|---:|---:|
| `same_finger_chain` | 0 | 0 |
| `contains_same_finger` | 4 | 1 |
| `redirect` | 8 | 2 |
| `inward_roll` | 0 | 0 |
| `outward_roll` | 2 | 0 |
| `double_row_change` | 20 | 9 |

156 trigrams and 109 4-grams qualify.
4-grams have no Norvig web table, so their stability is `two-corpus`
(top-300 in both Google Books and SUBTLEX-US) — a stated exception,
weaker than the three-corpus `universal` of the trigrams.

| gesture | features | fingers | rows | relaxed features | rank b/w/s | min share |
|:---:|---|---|---|---|---|---:|
| `the` | double_row_change | L-index R-index L-middle | top home top | double_row_change | 1/1/2 | 1.364% |
| `ing` | double_row_change | R-middle R-index L-index | top bottom home | double_row_change | 3/2/3 | 0.726% |
| `and` | double_row_change | L-pinky R-index L-middle | home bottom home | double_row_change | 2/3/8 | 0.722% |
| `ent` | double_row_change | L-middle R-index L-index | top bottom top | double_row_change | 6/6/42 | 0.315% |
| `ion` | redirect | R-middle R-ring R-index | top top bottom | redirect | 4/4/46 | 0.274% |
| `com` | double_row_change | L-middle R-ring R-index | bottom top bottom | double_row_change | 36/15/39 | 0.263% |
| `are` | redirect | L-pinky L-index L-middle | home top top | redirect | 29/25/23 | 0.235% |
| `ate` | redirect | L-pinky L-index L-middle | home top top | redirect | 14/10/62 | 0.227% |
| `thi` | double_row_change | L-index R-index R-middle | top home top | double_row_change | 27/29/6 | 0.222% |
| `rea` | outward_roll | L-index L-middle L-pinky | top top home | outward_roll | 35/30/33 | 0.221% |
| `sta` | redirect, double_row_change | L-ring L-index L-pinky | home top home | redirect, double_row_change | 41/31/64 | 0.215% |
| `ear` | redirect, double_row_change | L-middle L-pinky L-index | top home top | redirect, double_row_change | 45/37/53 | 0.200% |
| `his` | double_row_change | R-index R-middle L-ring | home top home | double_row_change | 15/40/12 | 0.194% |
| `ers` | redirect | L-middle L-index L-ring | top top home | redirect | 25/11/88 | 0.188% |
| `est` | redirect, double_row_change | L-middle L-ring L-index | top home top | redirect, double_row_change | 40/14/95 | 0.184% |
| `ive` | double_row_change | R-middle L-index L-middle | top bottom top | double_row_change | 32/51/68 | 0.174% |
| `nce` | contains_same_finger | R-index L-middle L-middle | bottom bottom top | — | 21/43/106 | 0.167% |
| `ine` | double_row_change | R-middle R-index L-middle | top bottom top | double_row_change | 53/38/108 | 0.163% |
| `res` | outward_roll | L-index L-middle L-ring | top top home | outward_roll | 17/12/109 | 0.163% |
| `ome` | double_row_change | R-ring R-index L-middle | top bottom top | double_row_change | 55/57/15 | 0.163% |
| `art` | contains_same_finger | L-pinky L-index L-index | home top top | contains_same_finger | 79/60/114 | 0.159% |
| `ste` | redirect | L-ring L-index L-middle | home top top | redirect | 87/61/111 | 0.159% |
| `ted` | contains_same_finger | L-index L-middle L-middle | top top home | contains_same_finger | 24/41/131 | 0.146% |
| `ide` | contains_same_finger, double_row_change | R-middle L-middle L-middle | top home top | contains_same_finger, double_row_change | 66/68/125 | 0.146% |
| `one` | double_row_change | R-ring R-index L-middle | top bottom top | double_row_change | 47/71/24 | 0.145% |
| `eve` | double_row_change | L-middle L-index L-middle | top bottom top | double_row_change | 37/76/29 | 0.141% |
| `ist` | double_row_change | R-middle L-ring L-index | top home top | double_row_change | 44/34/136 | 0.141% |
| `int` | double_row_change | R-middle R-index L-index | top bottom top | double_row_change | 39/19/140 | 0.136% |
| `con` | double_row_change | L-middle R-ring R-index | bottom top bottom | double_row_change | 16/24/144 | 0.135% |
| `men` | double_row_change | R-index L-middle R-index | bottom top bottom | double_row_change | 22/20/149 | 0.133% |
| `that` | double_row_change | L-index R-index L-pinky L-index | top home home top | double_row_change | 3/—/1 | 0.531% |
| `ther` | double_row_change | L-index R-index L-middle L-index | top home top top | double_row_change | 4/—/5 | 0.445% |
| `tion` | redirect | L-index R-middle R-ring R-index | top top top bottom | redirect | 1/—/23 | 0.338% |
| `this` | double_row_change | L-index R-index R-middle L-ring | top home top home | double_row_change | 8/—/6 | 0.254% |
| `ting` | double_row_change | L-index R-middle R-index L-index | top top bottom home | double_row_change | 12/—/32 | 0.213% |
| `from` | contains_same_finger, double_row_change | L-index L-index R-ring R-index | home top top bottom | contains_same_finger, double_row_change | 10/—/48 | 0.189% |
| `have` | redirect, double_row_change | R-index L-pinky L-index L-middle | home home bottom top | redirect, double_row_change | 17/—/9 | 0.187% |
| `othe` | double_row_change | R-ring L-index R-index L-middle | top top home top | double_row_change | 18/—/36 | 0.179% |
| `ight` | double_row_change | R-middle L-index R-index L-index | top home home top | double_row_change | 19/—/7 | 0.177% |
| `ever` | double_row_change | L-middle L-index L-middle L-index | top bottom top top | double_row_change | 21/—/15 | 0.166% |

## Practice words

For each technical transition and gesture: the 12 most frequent
SUBTLEX-US words that contain the target and pass the everyday-word filter:
FREQcount ≥ 250; appears in ≥ 100 of the 8,388 films; written in
lower case ≥ 50% of the time (drops names and titles);
not one of 39 excluded contraction stems and swear words; present
in the Google Books word list. Ordered by concentration — the share
of the word the target occupies — so short carriers come first.

Targets with fewer than 8 everyday carriers: `that this from have`.

| target | words |
|:---:|---|
| `ed` | bed, need, used, asked, tried, wanted, called, killed, married, started, happened, supposed |
| `de` | made, dead, idea, deal, dear, side, under, death, inside, outside, wonderful, understand |
| `lo` | lot, look, love, long, lost, lose, looks, alone, close, blood, along, looking |
| `ce` | nice, once, face, place, since, dance, piece, chance, police, office, except, certainly |
| `un` | run, fun, gun, found, until, under, young, funny, around, country, running, understand |
| `ol` | old, told, hold, cool, cold, fool, whole, school, police, follow, control, absolutely |
| `tr` | try, true, truth, tried, trust, train, trying, street, trouble, country, control, straight |
| `ec` | check, piece, second, become, secret, expect, because, perfect, special, decided, security, appreciate |
| `rt` | part, hurt, sort, start, heart, party, worth, court, report, started, important, certainly |
| `fr` | from, free, front, fresh, freak, friend, afraid, friends, freedom, friendly, boyfriend, girlfriend |
| `gr` | grab, grow, great, group, green, agree, grand, angry, hungry, ground, program, greatest |
| `br` | bring, break, broke, brain, broken, bridge, breath, brother, brought, breathe, brothers, breakfast |
| `mu` | mud, much, must, music, murder, museum, muscle, murders, musical, murdered, murderer, community |
| `ny` | any, many, tiny, funny, anyone, anyway, anybody, anymore, company, anytime, anything, anywhere |
| `ki` | kid, kind, kill, kids, killed, taking, making, talking, looking, working, kidding, thinking |
| `um` | jump, dumb, dump, human, number, summer, assume, jumped, museum, dumped, numbers, circumstances |
| `ft` | left, gift, lift, soft, after, often, shift, fifth, fifty, gifts, afternoon, afterwards |
| `rg` | large, forget, forgot, charge, target, energy, forgive, surgery, charges, gorgeous, emergency, forgotten |
| `my` | my, army, myth, enemy, dummy, myself, mystery, economy, mysterious |
| `ju` | just, jump, jury, junk, judge, juice, jungle, jumped, justice, jumping, injured, judgment |
| `nu` | nut, nuts, nurse, minute, number, nurses, minutes, numbers, unusual, nuclear, continue, continues |
| `hu` | huh, hurt, huge, hung, hunt, human, hurts, hungry, church, husband, hundred, hundreds |
| `rv` | serve, nerve, served, service, nervous, deserve, survive, services, starving, deserves, interview, surveillance |
| `ws` | news, laws, cows, knows, shows, blows, grows, windows, fellows, shadows, newspaper, newspapers |
| `rf` | surf, perfect, surface, perform, perfume, powerful, wonderful, perfectly, interfere, performed, performing, performance |
| `in` | in, into, find, think, going, thing, doing, again, things, nothing, anything, something |
| `on` | on, one, son, only, long, done, once, money, wrong, alone, someone, tonight |
| `ve` | have, over, very, give, love, even, ever, never, leave, every, believe, everything |
| `om` | from, some, home, room, woman, comes, women, coming, someone, somebody, tomorrow, something |
| `no` | not, now, know, none, knows, known, honor, enough, normal, nothing, another, afternoon |
| `be` | be, been, best, being, before, better, number, behind, because, believe, remember, beautiful |
| `pe` | hope, open, speak, paper, people, happen, person, expect, perfect, special, happens, happened |
| `mo` | more, move, most, money, movie, mother, almost, moment, months, morning, anymore, tomorrow |
| `mi` | mind, mine, might, coming, minute, family, missed, middle, minutes, promise, million, mistake |
| `ni` | nice, nine, night, finish, morning, tonight, running, evening, finished, happening, beginning, definitely |
| `ry` | try, very, sorry, every, worry, story, marry, trying, country, everyone, everybody, everything |
| `ly` | only, early, lying, really, family, lovely, exactly, finally, actually, probably, certainly, absolutely |
| `pl` | play, plan, place, plane, people, please, couple, simple, playing, explain, pleasure, completely |
| `im` | him, time, times, crime, simple, victim, himself, imagine, important, sometimes, impossible, immediately |
| `ab` | lab, cab, baby, able, grab, babe, about, table, above, probably, absolutely, comfortable |
| `the` | the, they, them, then, there, these, other, their, father, mother, another, together |
| `ing` | going, thing, doing, being, things, coming, nothing, talking, getting, anything, something, everything |
| `and` | and, hand, land, band, hands, stand, grand, handle, husband, standing, thousand, understand |
| `ent` | went, sent, spent, moment, entire, parents, present, accident, different, gentlemen, attention, apartment |
| `ion` | action, million, station, mention, question, position, decision, questions, attention, situation, information, relationship |
| `com` | com, comes, coming, become, common, welcome, company, command, computer, complete, completely, comfortable |
| `are` | are, care, area, dare, share, cares, aware, scared, career, parents, careful, prepared |
| `ate` | late, hate, date, later, water, state, lately, private, whatever, greatest, appreciate, immediately |
| `thi` | this, think, thing, third, things, thinks, within, nothing, anything, thinking, something, everything |
| `rea` | real, read, area, great, ready, break, dream, really, reason, already, realize, breakfast |
| `sta` | stay, star, start, stand, state, started, mistake, station, standing, upstairs, starting, understand |
| `ear` | hear, year, dear, wear, years, heard, heart, clear, learn, early, earth, swear |
| `his` | his, this, history, whiskey, whistle, whisper, whispers, whistling, whispering, historical, sophisticated |
| `ers` | person, others, orders, papers, herself, flowers, numbers, letters, personal, brothers, understand, conversation |
| `est` | best, rest, test, honest, arrest, question, interest, greatest, questions, yesterday, interested, interesting |
| `ive` | give, live, five, alive, drive, lives, given, lived, gives, river, driver, forgive |
| `nce` | once, since, dance, chance, science, chances, evidence, princess, concerned, insurance, difference, experience |
| `ine` | fine, mine, line, nine, wine, lines, engine, imagine, machine, business, medicine, magazine |
| `res` | rest, dress, press, fresh, arrest, present, respect, address, pictures, pressure, interested, interesting |
| `ome` | some, home, comes, women, moment, become, someone, welcome, somebody, something, sometimes, somewhere |
| `art` | art, part, start, heart, party, earth, smart, started, partner, starting, apartment, sweetheart |
| `ste` | step, steal, waste, taste, sister, system, master, mister, instead, yesterday, listening, interested |
| `ted` | hated, wanted, waited, started, excited, invited, treated, arrested, expected, committed, interested, complicated |
| `ide` | idea, side, ride, hide, video, inside, decide, outside, decided, evidence, accident, consider |
| `one` | one, done, gone, none, ones, money, alone, honey, phone, anyone, someone, everyone |
| `eve` | even, ever, never, every, seven, believe, evening, forever, whatever, everyone, everybody, everything |
| `ist` | list, exist, sister, mister, artist, mistake, history, sisters, distance, mistakes, listening, assistant |
| `int` | into, point, paint, joint, points, interest, painting, introduce, interview, interested, interesting, appointment |
| `con` | second, control, seconds, contact, consider, continue, confused, contract, concerned, condition, connection, conversation |
| `men` | men, women, moment, mention, gentlemen, apartment, mentioned, statement, equipment, government, department, appointment |
| `that` | that |
| `ther` | there, other, father, mother, either, rather, others, bother, another, brother, neither, together |
| `tion` | action, station, mention, question, position, questions, attention, situation, operation, information, relationship, conversation |
| `this` | this |
| `ting` | eating, acting, getting, waiting, meeting, sitting, putting, writing, fighting, starting, shooting, interesting |
| `from` | from |
| `have` | have, shave, behave |
| `othe` | other, mother, others, bother, another, brother, clothes, mothers, brothers, bothered, bothering, grandmother |
| `ight` | right, night, might, fight, light, eight, tight, flight, lights, tonight, straight, fighting |
| `ever` | ever, never, every, forever, whoever, several, whatever, everyone, whenever, everybody, everything, everywhere |

## Boundary

Provisional until learner data. These sets say which movements are
frequent everywhere and mechanically distinct; they do not say which are
hard, and they do not order lessons. RES-05 exports them; lesson forms
and sequencing are separate issues.
