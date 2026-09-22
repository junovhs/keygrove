# Trigram Gesture Atlas

This treats a 3-letter sequence as a small motor gesture rather than
merely three independent keys.

No composite difficulty score is used.

## Corpus

- observed trigrams: **8,653**
- total occurrences: **2,098,121,156,991**

## Gesture occurrence mass

| feature | share of all trigram occurrences |
|---|---:|
| contains adjacent same-finger movement | 13.528% |
| both adjacent moves are same-finger | 0.503% |
| reuses same finger at positions 1 and 3 | 13.817% |
| same-finger direction reversal | 0.493% |
| three-finger same-hand redirect | 6.579% |
| three-finger inward roll | 1.332% |
| three-finger outward roll | 1.471% |
| changes row on both transitions | 45.712% |

## Hand-pattern occurrence mass

| pattern | share |
|:---:|---:|
| `LRL` | 18.369% |
| `LLL` | 18.088% |
| `RLL` | 13.819% |
| `RRL` | 11.407% |
| `LLR` | 11.362% |
| `LRR` | 10.286% |
| `RLR` | 9.283% |
| `RRR` | 7.386% |

## Highest-frequency trigrams containing a same-finger transition

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `nce` | 21 | 0.3306% | RLL | R-index → L-middle → L-middle | 2 → 2 → 0 | since, once, experience, evidence, science, influence |
| 2 | `ted` | 24 | 0.3151% | LLL | L-index → L-middle → L-middle | 0 → 0 → 1 | united, related, wanted, associated, limited, expected |
| 3 | `ect` | 34 | 0.2685% | LLL | L-middle → L-middle → L-index | 0 → 2 → 0 | effect, subject, section, effects, object, respect |
| 4 | `der` | 54 | 0.2035% | LLL | L-middle → L-middle → L-index | 1 → 0 → 0 | under, order, considered, modern, understand, consider |
| 5 | `tra` | 59 | 0.1956% | LLL | L-index → L-index → L-pinky | 0 → 0 → 1 | trade, central, training, administration, traditional, contract |
| 6 | `str` | 62 | 0.1909% | LLL | L-ring → L-index → L-index | 1 → 0 → 0 | structure, strong, industry, street, distribution, administration |
| 7 | `ide` | 66 | 0.1867% | RLL | R-middle → L-middle → L-middle | 0 → 1 → 0 | side, evidence, considered, idea, president, provide |
| 8 | `oun` | 73 | 0.1822% | RRR | R-ring → R-index → R-index | 0 → 0 → 2 | found, country, young, around, account, amount |
| 9 | `fro` | 78 | 0.1780% | LLR | L-index → L-index → R-ring | 1 → 0 → 0 | from, front, frontier, frozen, confronted, frost |
| 10 | `art` | 79 | 0.1776% | LLL | L-pinky → L-index → L-index | 1 → 0 → 0 | part, party, particular, art, heart, parts |
| 11 | `red` | 82 | 0.1750% | LLL | L-index → L-middle → L-middle | 0 → 0 → 1 | required, considered, red, hundred, appeared, prepared |
| 12 | `und` | 91 | 0.1688% | RRL | R-index → R-index → L-middle | 0 → 2 → 1 | under, found, around, ground, hundred, understand |
| 13 | `ort` | 93 | 0.1680% | RLL | R-ring → L-index → L-index | 0 → 0 → 0 | important, support, north, short, report, importance |
| 14 | `nde` | 98 | 0.1607% | RLL | R-index → L-middle → L-middle | 2 → 1 → 0 | under, indeed, understand, understanding, independent, intended |
| 15 | `ces` | 110 | 0.1500% | LLL | L-middle → L-middle → L-ring | 2 → 0 → 1 | process, necessary, services, forces, success, resources |
| 16 | `sed` | 144 | 0.1293% | LLL | L-ring → L-middle → L-middle | 1 → 0 → 1 | used, based, increased, passed, discussed, caused |
| 17 | `rec` | 164 | 0.1204% | LLL | L-index → L-middle → L-middle | 0 → 0 → 2 | received, direct, direction, recent, directly, record |
| 18 | `den` | 172 | 0.1158% | LLR | L-middle → L-middle → R-index | 1 → 0 → 2 | evidence, students, president, independent, student, suddenly |
| 19 | `ned` | 175 | 0.1147% | RLL | R-index → L-middle → L-middle | 2 → 0 → 1 | turned, obtained, determined, mentioned, concerned, returned |
| 20 | `any` | 180 | 0.1109% | LRR | L-pinky → R-index → R-index | 1 → 2 → 0 | any, many, company, anything, germany, anyone |
| 21 | `ice` | 188 | 0.1094% | RLL | R-middle → L-middle → L-middle | 0 → 2 → 0 | service, office, practice, services, price, voice |
| 22 | `tri` | 194 | 0.1084% | LLR | L-index → L-index → R-middle | 0 → 0 → 0 | countries, distribution, industrial, tried, district, trial |
| 23 | `ntr` | 200 | 0.1051% | RLL | R-index → L-index → L-index | 2 → 0 → 0 | country, control, central, countries, introduction, contract |
| 24 | `kin` | 211 | 0.1026% | RRR | R-middle → R-middle → R-index | 1 → 0 → 2 | making, king, kind, working, taking, looking |
| 25 | `des` | 226 | 0.0985% | LLL | L-middle → L-middle → L-ring | 1 → 0 → 1 | described, design, desire, des, description, provides |

## Highest-frequency trigrams with same-finger movement twice

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `ded` | 263 | 0.0919% | LLL | L-middle → L-middle → L-middle | 1 → 0 → 1 | provided, needed, added, included, decided, intended |
| 2 | `olo` | 416 | 0.0603% | RRR | R-ring → R-ring → R-ring | 0 → 1 → 0 | technology, color, psychology, psychological, colonial, colonel |
| 3 | `ece` | 427 | 0.0589% | LLL | L-middle → L-middle → L-middle | 0 → 2 → 0 | necessary, received, recent, december, receive, piece |
| 4 | `ced` | 437 | 0.0580% | LLL | L-middle → L-middle → L-middle | 2 → 0 → 1 | produced, placed, reduced, procedure, introduced, forced |
| 5 | `dec` | 604 | 0.0441% | LLL | L-middle → L-middle → L-middle | 1 → 0 → 2 | decision, december, decided, decisions, declared, decide |
| 6 | `num` | 757 | 0.0333% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | number, numbers, numerous, numerical, monument, aluminum |
| 7 | `mun` | 892 | 0.0277% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | community, communication, communities, communist, communications, municipal |
| 8 | `ede` | 934 | 0.0263% | LLL | L-middle → L-middle → L-middle | 0 → 1 → 0 | needed, federal, succeeded, proceeded, frederick, federation |
| 9 | `hum` | 1006 | 0.0237% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | human, humanity, humans, humble, humor, thumb |
| 10 | `hun` | 1295 | 0.0155% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | hundred, hundreds, hung, hunting, hunt, hunter |
| 11 | `jun` | 1637 | 0.0095% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | june, junior, conjunction, junction, jungle, injunction |
| 12 | `nju` | 1867 | 0.0066% | RRR | R-index → R-index → R-index | 2 → 1 → 0 | injury, injuries, injured, conjunction, injustice, unjust |
| 13 | `mum` | 1947 | 0.0060% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | maximum, minimum, optimum, mum, mummy, mumbled |
| 14 | `umn` | 2110 | 0.0047% | RRR | R-index → R-index → R-index | 0 → 2 → 2 | column, columns, autumn, sumner, alumni, columnar |
| 15 | `rtr` | 2209 | 0.0040% | LLL | L-index → L-index → L-index | 0 → 0 → 0 | portrait, portraits, fortress, portrayed, gertrude, portray |
| 16 | `umu` | 2491 | 0.0026% | RRR | R-index → R-index → R-index | 0 → 2 → 0 | accumulation, accumulated, cumulative, accumulate, accumulating, tumult |
| 17 | `aza` | 2505 | 0.0026% | LLL | L-pinky → L-pinky → L-pinky | 1 → 2 → 1 | hazard, hazardous, hazards, plaza, lazarus, nazareth |
| 18 | `iki` | 2561 | 0.0024% | RRR | R-middle → R-middle → R-middle | 0 → 1 → 0 | striking, liking, strikingly, viking, hiking, vikings |
| 19 | `unu` | 2650 | 0.0021% | RRR | R-index → R-index → R-index | 0 → 2 → 0 | unusual, unusually, unused, eunuch, eunuchs, unum |
| 20 | `nym` | 2786 | 0.0017% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | anonymous, anymore, synonymous, synonyms, synonym, anonymity |
| 21 | `jum` | 2825 | 0.0016% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | jump, jumped, jumping, jumps, jumble, jumper |
| 22 | `nun` | 2861 | 0.0015% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | nuns, pronunciation, nun, renunciation, denunciation, enunciated |
| 23 | `unh` | 2878 | 0.0015% | RRR | R-index → R-index → R-index | 0 → 2 → 1 | unhappy, unhealthy, unhappiness, unheard, unhappily, unholy |
| 24 | `hym` | 2879 | 0.0015% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | hymn, hymns, rhyme, rhymes, thymus, parenchyma |
| 25 | `rgr` | 2955 | 0.0014% | LLL | L-index → L-index → L-index | 0 → 1 → 0 | underground, undergraduate, evergreen, undergraduates, overgrown, intergroup |

## Highest-frequency separated finger reuse

These use the same finger on letters 1 and 3 with another finger between.

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `for` | 8 | 0.5411% | LRL | L-index → R-ring → L-index | 1 → 0 → 0 | for, before, form, information, therefore, force |
| 2 | `ter` | 10 | 0.4908% | LLL | L-index → L-middle → L-index | 0 → 0 → 0 | after, water, later, chapter, better, interest |
| 3 | `ere` | 13 | 0.4261% | LLL | L-middle → L-index → L-middle | 0 → 0 → 0 | were, there, where, here, different, therefore |
| 4 | `ver` | 18 | 0.3534% | LLL | L-index → L-middle → L-index | 2 → 0 → 0 | very, over, however, every, government, never |
| 5 | `men` | 22 | 0.3283% | RLR | R-index → L-middle → R-index | 2 → 0 → 2 | men, government, women, development, treatment, management |
| 6 | `was` | 33 | 0.2728% | LLL | L-ring → L-pinky → L-ring | 0 → 1 → 1 | was, washington, waste, wash, washed, washing |
| 7 | `eve` | 37 | 0.2558% | LLL | L-middle → L-index → L-middle | 0 → 2 → 0 | even, however, every, never, development, several |
| 8 | `iti` | 49 | 0.2100% | RLR | R-middle → L-index → R-middle | 0 → 0 → 0 | political, position, conditions, british, condition, addition |
| 9 | `rat` | 50 | 0.2070% | LLL | L-index → L-pinky → L-index | 0 → 1 → 0 | rather, rate, temperature, operation, literature, administration |
| 10 | `man` | 56 | 0.1988% | RLR | R-index → L-pinky → R-index | 2 → 1 → 2 | many, man, human, woman, management, manner |
| 11 | `enc` | 74 | 0.1813% | LRL | L-middle → R-index → L-middle | 0 → 2 → 2 | experience, evidence, french, science, influence, difference |
| 12 | `tur` | 80 | 0.1771% | LRL | L-index → R-index → L-index | 0 → 0 → 0 | nature, century, natural, future, structure, return |
| 13 | `ght` | 88 | 0.1711% | LRL | L-index → R-index → L-index | 1 → 1 → 0 | might, right, thought, light, night, brought |
| 14 | `you` | 92 | 0.1681% | RRR | R-index → R-ring → R-index | 0 → 0 → 0 | you, your, young, yourself, youth, younger |
| 15 | `oul` | 97 | 0.1618% | RRR | R-ring → R-index → R-ring | 0 → 0 → 1 | would, could, should, soul, shoulder, shoulders |
| 16 | `hou` | 101 | 0.1593% | RRR | R-index → R-ring → R-index | 1 → 0 → 0 | should, without, house, though, thought, although |
| 17 | `but` | 103 | 0.1567% | LRL | L-index → R-index → L-index | 2 → 0 → 0 | but, distribution, contribution, distributed, contributions, contribute |
| 18 | `han` | 107 | 0.1543% | RLR | R-index → L-pinky → R-index | 1 → 1 → 2 | than, hand, change, changes, hands, exchange |
| 19 | `hin` | 108 | 0.1522% | RRR | R-index → R-middle → R-index | 1 → 0 → 2 | within, think, things, nothing, something, thing |
| 20 | `tor` | 113 | 0.1486% | LRL | L-index → R-ring → L-index | 0 → 0 → 0 | history, story, factors, historical, factor, stories |
| 21 | `ese` | 114 | 0.1469% | LLL | L-middle → L-ring → L-middle | 0 → 1 → 0 | these, present, research, presence, presented, chinese |
| 22 | `hen` | 120 | 0.1443% | RLR | R-index → L-middle → R-index | 1 → 0 → 2 | when, then, henry, hence, whenever, phenomena |
| 23 | `min` | 121 | 0.1437% | RRR | R-index → R-middle → R-index | 2 → 0 → 2 | mind, coming, determined, administration, minutes, minister |
| 24 | `end` | 128 | 0.1370% | LRL | L-middle → R-index → L-middle | 0 → 2 → 1 | end, friends, friend, independent, intended, send |
| 25 | `tiv` | 133 | 0.1346% | LRL | L-index → R-middle → L-index | 0 → 0 → 2 | activity, activities, effective, positive, active, relative |

## Highest-frequency same-finger reversals

All three letters use one finger and the movement changes physical direction.

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `ded` | 263 | 0.0919% | LLL | L-middle → L-middle → L-middle | 1 → 0 → 1 | provided, needed, added, included, decided, intended |
| 2 | `olo` | 416 | 0.0603% | RRR | R-ring → R-ring → R-ring | 0 → 1 → 0 | technology, color, psychology, psychological, colonial, colonel |
| 3 | `ece` | 427 | 0.0589% | LLL | L-middle → L-middle → L-middle | 0 → 2 → 0 | necessary, received, recent, december, receive, piece |
| 4 | `ced` | 437 | 0.0580% | LLL | L-middle → L-middle → L-middle | 2 → 0 → 1 | produced, placed, reduced, procedure, introduced, forced |
| 5 | `dec` | 604 | 0.0441% | LLL | L-middle → L-middle → L-middle | 1 → 0 → 2 | decision, december, decided, decisions, declared, decide |
| 6 | `num` | 757 | 0.0333% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | number, numbers, numerous, numerical, monument, aluminum |
| 7 | `mun` | 892 | 0.0277% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | community, communication, communities, communist, communications, municipal |
| 8 | `ede` | 934 | 0.0263% | LLL | L-middle → L-middle → L-middle | 0 → 1 → 0 | needed, federal, succeeded, proceeded, frederick, federation |
| 9 | `hum` | 1006 | 0.0237% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | human, humanity, humans, humble, humor, thumb |
| 10 | `hun` | 1295 | 0.0155% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | hundred, hundreds, hung, hunting, hunt, hunter |
| 11 | `jun` | 1637 | 0.0095% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | june, junior, conjunction, junction, jungle, injunction |
| 12 | `mum` | 1947 | 0.0060% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | maximum, minimum, optimum, mum, mummy, mumbled |
| 13 | `umn` | 2110 | 0.0047% | RRR | R-index → R-index → R-index | 0 → 2 → 2 | column, columns, autumn, sumner, alumni, columnar |
| 14 | `rtr` | 2209 | 0.0040% | LLL | L-index → L-index → L-index | 0 → 0 → 0 | portrait, portraits, fortress, portrayed, gertrude, portray |
| 15 | `umu` | 2491 | 0.0026% | RRR | R-index → R-index → R-index | 0 → 2 → 0 | accumulation, accumulated, cumulative, accumulate, accumulating, tumult |
| 16 | `aza` | 2505 | 0.0026% | LLL | L-pinky → L-pinky → L-pinky | 1 → 2 → 1 | hazard, hazardous, hazards, plaza, lazarus, nazareth |
| 17 | `iki` | 2561 | 0.0024% | RRR | R-middle → R-middle → R-middle | 0 → 1 → 0 | striking, liking, strikingly, viking, hiking, vikings |
| 18 | `unu` | 2650 | 0.0021% | RRR | R-index → R-index → R-index | 0 → 2 → 0 | unusual, unusually, unused, eunuch, eunuchs, unum |
| 19 | `nym` | 2786 | 0.0017% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | anonymous, anymore, synonymous, synonyms, synonym, anonymity |
| 20 | `jum` | 2825 | 0.0016% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | jump, jumped, jumping, jumps, jumble, jumper |
| 21 | `nun` | 2861 | 0.0015% | RRR | R-index → R-index → R-index | 2 → 0 → 2 | nuns, pronunciation, nun, renunciation, denunciation, enunciated |
| 22 | `unh` | 2878 | 0.0015% | RRR | R-index → R-index → R-index | 0 → 2 → 1 | unhappy, unhealthy, unhappiness, unheard, unhappily, unholy |
| 23 | `hym` | 2879 | 0.0015% | RRR | R-index → R-index → R-index | 1 → 0 → 2 | hymn, hymns, rhyme, rhymes, thymus, parenchyma |
| 24 | `rgr` | 2955 | 0.0014% | LLL | L-index → L-index → L-index | 0 → 1 → 0 | underground, undergraduate, evergreen, undergraduates, overgrown, intergroup |
| 25 | `unm` | 3015 | 0.0013% | RRR | R-index → R-index → R-index | 0 → 2 → 2 | unmarried, unmistakable, unmistakably, unmoved, unmarked, unmolested |

## Highest-frequency three-finger redirects

Same hand, three distinct fingers, with direction changing between
inward and outward rather than continuing as a roll.

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `ion` | 4 | 0.9747% | RRR | R-middle → R-ring → R-index | 0 → 0 → 2 | information, national, question, action, education, section |
| 2 | `ate` | 14 | 0.4174% | LLL | L-pinky → L-index → L-middle | 1 → 0 → 0 | state, states, water, later, rate, greater |
| 3 | `ers` | 25 | 0.3110% | LLL | L-middle → L-index → L-ring | 0 → 0 → 1 | others, university, person, members, personal, persons |
| 4 | `are` | 29 | 0.2884% | LLL | L-pinky → L-index → L-middle | 1 → 0 → 0 | are, area, care, areas, parents, appeared |
| 5 | `est` | 40 | 0.2427% | LLL | L-middle → L-ring → L-index | 0 → 1 → 0 | best, question, interest, west, test, questions |
| 6 | `sta` | 41 | 0.2385% | LLL | L-ring → L-index → L-pinky | 1 → 0 → 1 | state, states, established, standard, understand, stage |
| 7 | `ear` | 45 | 0.2176% | LLL | L-middle → L-pinky → L-index | 0 → 1 → 0 | years, year, early, research, heart, clear |
| 8 | `ave` | 61 | 0.1931% | LLL | L-pinky → L-index → L-middle | 1 → 2 → 0 | have, gave, leave, average, leaves, save |
| 9 | `ste` | 87 | 0.1712% | LLL | L-ring → L-index → L-middle | 1 → 0 → 0 | system, systems, instead, western, step, existence |
| 10 | `era` | 94 | 0.1653% | LLL | L-middle → L-index → L-pinky | 0 → 0 → 1 | general, several, generally, average, temperature, federal |
| 11 | `age` | 115 | 0.1468% | LLL | L-pinky → L-index → L-middle | 1 → 1 → 0 | age, language, management, average, stage, page |
| 12 | `eas` | 122 | 0.1420% | LLL | L-middle → L-pinky → L-ring | 0 → 1 → 1 | least, reason, increase, areas, east, increased |
| 13 | `eat` | 127 | 0.1392% | LLL | L-middle → L-pinky → L-index | 0 → 1 → 0 | great, death, greater, treatment, heat, created |
| 14 | `ard` | 166 | 0.1186% | LLL | L-pinky → L-index → L-middle | 1 → 0 → 1 | toward, hard, heard, board, standard, towards |
| 15 | `omp` | 190 | 0.1088% | RRR | R-ring → R-index → R-pinky | 0 → 2 → 0 | company, complete, complex, companies, computer, completely |
| 16 | `cat` | 204 | 0.1033% | LLL | L-middle → L-pinky → L-index | 2 → 1 → 0 | education, application, communication, educational, indicated, indicate |
| 17 | `mpl` | 218 | 0.1008% | RRR | R-index → R-pinky → R-ring | 2 → 0 → 1 | example, simple, complete, simply, complex, employed |
| 18 | `rac` | 256 | 0.0928% | LLL | L-index → L-pinky → L-middle | 0 → 1 → 2 | character, practice, practical, race, characteristics, contract |
| 19 | `imp` | 289 | 0.0852% | RRR | R-middle → R-index → R-pinky | 0 → 2 → 0 | important, simple, simply, importance, impossible, impact |
| 20 | `war` | 326 | 0.0755% | LLL | L-ring → L-pinky → L-index | 0 → 1 → 0 | war, toward, towards, forward, aware, edward |
| 21 | `fac` | 350 | 0.0702% | LLL | L-index → L-pinky → L-middle | 1 → 1 → 2 | fact, face, surface, factors, factor, facts |
| 22 | `car` | 356 | 0.0690% | LLL | L-middle → L-pinky → L-index | 2 → 1 → 0 | care, carried, car, carry, carefully, career |
| 23 | `ars` | 436 | 0.0580% | LLL | L-pinky → L-index → L-ring | 1 → 0 → 1 | years, appears, dollars, stars, tears, scholars |
| 24 | `iou` | 442 | 0.0576% | RRR | R-middle → R-ring → R-index | 0 → 0 → 0 | various, religious, serious, previous, obvious, previously |
| 25 | `ext` | 454 | 0.0560% | LLL | L-middle → L-ring → L-index | 0 → 2 → 0 | next, text, extent, context, external, extended |

## Highest-frequency inward rolls

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `act` | 63 | 0.1905% | LLL | L-pinky → L-middle → L-index | 1 → 2 → 0 | fact, act, action, character, practice, activity |
| 2 | `wer` | 95 | 0.1647% | LLL | L-ring → L-middle → L-index | 0 → 0 → 0 | were, power, lower, answer, powers, powerful |
| 3 | `lin` | 142 | 0.1295% | RRR | R-ring → R-middle → R-index | 1 → 0 → 2 | line, lines, feeling, feelings, clinical, willing |
| 4 | `ast` | 179 | 0.1115% | LLL | L-pinky → L-ring → L-index | 1 → 1 → 0 | last, least, past, east, master, contrast |
| 5 | `ase` | 210 | 0.1027% | LLL | L-pinky → L-ring → L-middle | 1 → 1 → 0 | case, cases, based, increase, increased, disease |
| 6 | `ser` | 240 | 0.0947% | LLL | L-ring → L-middle → L-index | 1 → 0 → 0 | service, services, series, observed, serious, serve |
| 7 | `oin` | 391 | 0.0627% | RRR | R-ring → R-middle → R-index | 0 → 0 → 2 | point, going, points, doing, joint, appointed |
| 8 | `pon` | 396 | 0.0625% | RRR | R-pinky → R-ring → R-index | 0 → 0 → 2 | upon, response, responsibility, responsible, components, corresponding |
| 9 | `pli` | 568 | 0.0469% | RRR | R-pinky → R-ring → R-middle | 0 → 1 → 0 | application, applied, replied, applications, supplies, discipline |
| 10 | `scr` | 671 | 0.0381% | LLL | L-ring → L-middle → L-index | 1 → 2 → 0 | described, description, describe, screen, describes, discrimination |
| 11 | `pin` | 681 | 0.0371% | RRR | R-pinky → R-middle → R-index | 0 → 0 → 2 | opinion, developing, keeping, happiness, opinions, helping |
| 12 | `set` | 700 | 0.0360% | LLL | L-ring → L-middle → L-index | 1 → 0 → 0 | set, setting, settlement, sets, settled, assets |
| 13 | `poi` | 720 | 0.0351% | RRR | R-pinky → R-ring → R-middle | 0 → 0 → 0 | point, points, appointed, pointed, appointment, pointing |
| 14 | `lim` | 932 | 0.0264% | RRR | R-ring → R-middle → R-index | 1 → 0 → 2 | limited, limits, limit, climate, limitations, preliminary |
| 15 | `sev` | 954 | 0.0257% | LLL | L-ring → L-middle → L-index | 1 → 0 → 2 | several, seven, severe, roosevelt, seventh, seventy |
| 16 | `adv` | 966 | 0.0252% | LLL | L-pinky → L-middle → L-index | 1 → 1 → 2 | advantage, advanced, advance, advice, advantages, advertising |
| 17 | `wev` | 976 | 0.0248% | LLL | L-ring → L-middle → L-index | 0 → 0 → 2 | however, wever |
| 18 | `ply` | 1112 | 0.0198% | RRR | R-pinky → R-ring → R-index | 0 → 1 → 0 | simply, supply, apply, deeply, reply, applying |
| 19 | `acr` | 1326 | 0.0149% | LLL | L-pinky → L-middle → L-index | 1 → 2 → 0 | across, sacred, sacrifice, acres, acre, sacrifices |
| 20 | `pou` | 1608 | 0.0099% | RRR | R-pinky → R-ring → R-index | 0 → 0 → 0 | pounds, compounds, compound, pour, pound, poured |
| 21 | `asc` | 1726 | 0.0082% | LLL | L-pinky → L-ring → L-middle | 1 → 1 → 2 | vascular, ascertain, fascinating, ascribed, masculine, ascertained |
| 22 | `xer` | 1796 | 0.0073% | LLL | L-ring → L-middle → L-index | 2 → 0 → 0 | exercise, exercises, exercised, exerted, exert, exercising |
| 23 | `plu` | 1865 | 0.0066% | RRR | R-pinky → R-ring → R-index | 0 → 1 → 0 | plus, surplus, plural, plug, plunged, plunder |
| 24 | `sef` | 2108 | 0.0047% | LLL | L-ring → L-middle → L-index | 1 → 0 → 1 | useful, usefulness, josef, purposeful, usefully, purposefully |
| 25 | `pok` | 2112 | 0.0047% | RRR | R-pinky → R-ring → R-middle | 0 → 0 → 1 | spoke, spoken, spokesman, poker, outspoken, spokesmen |

## Highest-frequency outward rolls

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `res` | 17 | 0.3573% | LLL | L-index → L-middle → L-ring | 0 → 0 → 1 | present, interest, press, research, result, results |
| 2 | `rea` | 35 | 0.2676% | LLL | L-index → L-middle → L-pinky | 0 → 0 → 1 | great, area, already, real, reason, greater |
| 3 | `tes` | 196 | 0.1074% | LLL | L-index → L-middle → L-ring | 0 → 0 → 1 | states, test, minutes, notes, rates, greatest |
| 4 | `hil` | 315 | 0.0774% | RRR | R-index → R-middle → R-ring | 1 → 0 → 1 | while, children, child, philosophy, hill, philadelphia |
| 5 | `ves` | 320 | 0.0765% | LLL | L-index → L-middle → L-ring | 2 → 0 → 1 | themselves, gives, lives, investment, leaves, ourselves |
| 6 | `mil` | 359 | 0.0686% | RRR | R-index → R-middle → R-ring | 2 → 0 → 1 | family, similar, military, miles, million, families |
| 7 | `ges` | 409 | 0.0608% | LLL | L-index → L-middle → L-ring | 1 → 0 → 1 | changes, suggested, suggest, pages, suggests, images |
| 8 | `rds` | 639 | 0.0411% | LLL | L-index → L-middle → L-ring | 0 → 1 → 1 | words, towards, records, standards, afterwards, birds |
| 9 | `exa` | 683 | 0.0369% | LLL | L-middle → L-ring → L-pinky | 0 → 2 → 1 | example, examples, examination, exactly, examined, texas |
| 10 | `hip` | 733 | 0.0343% | RRR | R-index → R-middle → R-pinky | 1 → 0 → 0 | relationship, ship, relationships, leadership, ships, worship |
| 11 | `tea` | 761 | 0.0332% | LLL | L-index → L-middle → L-pinky | 0 → 0 → 1 | instead, teacher, teachers, teaching, team, teach |
| 12 | `req` | 776 | 0.0325% | LLL | L-index → L-middle → L-pinky | 0 → 0 → 0 | required, frequently, require, requires, requirements, frequency |
| 13 | `bea` | 1000 | 0.0239% | LLL | L-index → L-middle → L-pinky | 2 → 0 → 1 | beautiful, bear, beauty, bearing, beach, beam |
| 14 | `bes` | 1026 | 0.0226% | LLL | L-index → L-middle → L-ring | 2 → 0 → 1 | best, besides, describes, beside, tribes, tubes |
| 15 | `nio` | 1055 | 0.0218% | RRR | R-index → R-middle → R-ring | 2 → 0 → 0 | union, opinion, opinions, senior, unions, companion |
| 16 | `uil` | 1064 | 0.0215% | RRR | R-index → R-middle → R-ring | 0 → 0 → 1 | building, built, build, buildings, equilibrium, guilty |
| 17 | `hop` | 1139 | 0.0190% | RRR | R-index → R-ring → R-pinky | 1 → 0 → 0 | hope, bishop, shop, hoped, hopes, bishops |
| 18 | `fea` | 1233 | 0.0168% | LLL | L-index → L-middle → L-pinky | 1 → 0 → 1 | fear, features, feature, defeat, fears, feared |
| 19 | `fes` | 1249 | 0.0165% | LLL | L-index → L-middle → L-ring | 1 → 0 → 1 | professional, professor, profession, manifest, professionals, festival |
| 20 | `few` | 1251 | 0.0164% | LLL | L-index → L-middle → L-ring | 1 → 0 → 0 | few, fewer, curfew, fewest, lifeworld, safeway |
| 21 | `tex` | 1315 | 0.0151% | LLL | L-index → L-middle → L-ring | 0 → 0 → 2 | text, context, texas, texts, contexts, cortex |
| 22 | `rew` | 1392 | 0.0137% | LLL | L-index → L-middle → L-ring | 0 → 0 → 0 | grew, drew, threw, crew, reward, andrew |
| 23 | `rsa` | 1644 | 0.0093% | LLL | L-index → L-ring → L-pinky | 0 → 1 → 1 | universal, conversation, conversations, dorsal, universally, anniversary |
| 24 | `rwa` | 1655 | 0.0092% | LLL | L-index → L-ring → L-pinky | 0 → 0 → 1 | forward, afterwards, afterward, norway, straightforward, doorway |
| 25 | `ewa` | 1903 | 0.0063% | LLL | L-middle → L-ring → L-pinky | 0 → 0 → 1 | reward, stewart, rewards, renewal, rewarded, sewage |

## Highest-frequency trigrams changing row twice

| local rank | trigram | overall | share | hands | fingers | rows | examples |
|---:|:---:|---:|---:|:---:|---|:---:|---|
| 1 | `the` | 1 | 3.2992% | LRL | L-index → R-index → L-middle | 0 → 1 → 0 | the, they, their, there, other, these |
| 2 | `and` | 2 | 1.2615% | LRL | L-pinky → R-index → L-middle | 1 → 2 → 1 | and, hand, land, england, hands, standard |
| 3 | `ing` | 3 | 1.0147% | RRL | R-middle → R-index → L-index | 0 → 2 → 1 | being, during, following, things, having, nothing |
| 4 | `ent` | 6 | 0.7394% | LRL | L-middle → R-index → L-index | 0 → 2 → 0 | government, different, present, development, went, century |
| 5 | `his` | 15 | 0.3848% | RRL | R-index → R-middle → L-ring | 1 → 0 → 1 | this, his, history, historical, historic, historian |
| 6 | `con` | 16 | 0.3846% | LRR | L-middle → R-ring → R-index | 2 → 0 → 2 | second, control, economic, conditions, considered, continued |
| 7 | `ons` | 20 | 0.3426% | RRL | R-ring → R-index → L-ring | 0 → 2 → 1 | conditions, considered, questions, persons, relationship, relations |
| 8 | `men` | 22 | 0.3283% | RLR | R-index → L-middle → R-index | 2 → 0 → 2 | men, government, women, development, treatment, management |
| 9 | `thi` | 27 | 0.3030% | LRR | L-index → R-index → R-middle | 0 → 1 → 0 | this, within, think, things, nothing, something |
| 10 | `ive` | 32 | 0.2735% | RLL | R-middle → L-index → L-middle | 0 → 2 → 0 | given, give, university, five, received, river |
| 11 | `ect` | 34 | 0.2685% | LLL | L-middle → L-middle → L-index | 0 → 2 → 0 | effect, subject, section, effects, object, respect |
| 12 | `com` | 36 | 0.2627% | LRR | L-middle → R-ring → R-index | 2 → 0 → 2 | come, become, common, company, community, complete |
| 13 | `eve` | 37 | 0.2558% | LLL | L-middle → L-index → L-middle | 0 → 2 → 0 | even, however, every, never, development, several |
| 14 | `int` | 39 | 0.2513% | RRL | R-middle → R-index → L-index | 0 → 2 → 0 | into, point, interest, international, points, interests |
| 15 | `est` | 40 | 0.2427% | LLL | L-middle → L-ring → L-index | 0 → 1 → 0 | best, question, interest, west, test, questions |
| 16 | `sta` | 41 | 0.2385% | LLL | L-ring → L-index → L-pinky | 1 → 0 → 1 | state, states, established, standard, understand, stage |
| 17 | `ica` | 43 | 0.2312% | RLL | R-middle → L-middle → L-pinky | 0 → 2 → 1 | american, political, america, physical, significant, application |
| 18 | `ist` | 44 | 0.2239% | RLL | R-middle → L-ring → L-index | 0 → 1 → 0 | history, christian, distribution, list, christ, distance |
| 19 | `ear` | 45 | 0.2176% | LLL | L-middle → L-pinky → L-index | 0 → 1 → 0 | years, year, early, research, heart, clear |
| 20 | `ain` | 46 | 0.2149% | LRR | L-pinky → R-middle → R-index | 1 → 0 → 2 | against, again, certain, main, obtained, training |
| 21 | `one` | 47 | 0.2109% | RRL | R-ring → R-index → L-middle | 0 → 2 → 0 | one, done, money, alone, mentioned, gone |
| 22 | `rat` | 50 | 0.2070% | LLL | L-index → L-pinky → L-index | 0 → 1 → 0 | rather, rate, temperature, operation, literature, administration |
| 23 | `ine` | 53 | 0.2044% | RRL | R-middle → R-index → L-middle | 0 → 2 → 0 | line, business, lines, obtained, determined, fine |
| 24 | `ome` | 55 | 0.2009% | RRL | R-ring → R-index → L-middle | 0 → 2 → 0 | some, come, women, home, become, something |
| 25 | `man` | 56 | 0.1988% | RLR | R-index → L-pinky → R-index | 2 → 1 → 2 | many, man, human, woman, management, manner |

## Reference: major common trigrams

| trigram | rank | share | tags | examples |
|:---:|---:|---:|---|---|
| `the` | 1 | 3.2992% | alternating_hands, two_row_changes | the, they, their, there, other, these, them, then |
| `and` | 2 | 1.2615% | alternating_hands, two_row_changes | and, hand, land, england, hands, standard, understand, understanding |
| `ing` | 3 | 1.0147% | two_row_changes | being, during, following, things, having, nothing, something, going |
| `ion` | 4 | 0.9747% | redirect, one_row_change | information, national, question, action, education, section, position, conditions |
| `tio` | 5 | 0.8016% | no_row_change | information, national, question, action, education, section, position, conditions |
| `ent` | 6 | 0.7394% | alternating_hands, two_row_changes | government, different, present, development, went, century, students, treatment |
| `ati` | 7 | 0.5614% | one_row_change | information, national, education, international, population, situation, organization, patient |
| `for` | 8 | 0.5411% | separated_finger_reuse, alternating_hands, one_row_change | for, before, form, information, therefore, force, foreign, forms |
| `her` | 9 | 0.5206% | one_row_change | her, there, other, where, another, here, others, rather |
| `ter` | 10 | 0.4908% | separated_finger_reuse, no_row_change | after, water, later, chapter, better, interest, matter, terms |
| `hat` | 11 | 0.4573% | one_row_change | that, what, whatever, somewhat, hath, hat, hate, hatred |
| `tha` | 12 | 0.4503% | alternating_hands, one_row_change | that, than, thank, thanks, jonathan, martha, thailand, thai |
| `ere` | 13 | 0.4261% | separated_finger_reuse, no_row_change | were, there, where, here, different, therefore, interest, considered |
| `ate` | 14 | 0.4174% | redirect, one_row_change | state, states, water, later, rate, greater, material, private |

## Generated file

- `outputs/tables/trigram_gesture_atlas.csv`

## Interpretation boundary

These categories describe **what the fingers are doing**, not how hard
the movement is. The next useful step is to combine this taxonomy with
frequency and redundancy to identify a compact set of candidate technical
drills, while still keeping the constituent measurements visible.
