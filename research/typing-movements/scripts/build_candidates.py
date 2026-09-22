#!/usr/bin/env python3
"""Provisional curriculum candidate sets (DEC-13 selection, DEC-16 evidence).

Reads the cross-corpus stability tables written by analyze_cross_corpus.py
and emits four sets under outputs/candidates/:

  core_transitions.csv       universal high-mass bigrams — learned mostly
                             incidentally; a coverage checklist, not drills
  technical_transitions.csv  universal bigrams with a mechanical reason
                             (same finger, weak-finger reach, stretch,
                             same-hand row jump) — isolated-practice targets
  gestures.csv               universal trigrams and 4-grams with a gesture
                             feature (same-finger chain, redirect, double row
                             change, roll)
  practice_words.csv         everyday words carrying each technical target
  everyday_words.csv         the whole everyday-word pool those are drawn from,
                             most frequent first — the app's vocabulary for
                             carrying any movement into words (CURR-50)

Everything here is PROVISIONAL until learner error/hesitation data exists.
No composite difficulty score is computed; the mechanical facts are listed
side by side and a target is admitted only by frequency × mechanics.

Run after analyze_cross_corpus.py (it needs outputs/tables/*_cross_corpus.csv).
"""

from __future__ import annotations

import csv
import math
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
OUT = ROOT / "outputs"
TABLES = OUT / "tables"
CAND = OUT / "candidates"
CAND.mkdir(parents=True, exist_ok=True)

WORDS = RAW / "norvig-books" / "google-books-common-words.txt"
SUBTLEX = RAW / "subtlex-us" / "extracted" / "SUBTLEXus74286wordstextversion.txt"
BOOKS_4 = RAW / "norvig-books" / "ngrams4.tsv"

CORPORA = ["books", "web", "subtlex"]

# --- selection thresholds (also written into every CSV header) ---------------
CORE_RANK = 60          # core: rank <= CORE_RANK in every corpus
BIGRAM_N = 200          # bigram stability cut used by analyze_cross_corpus
SAME_FINGER_N = 30      # same-finger sub-ranking cut
TRIGRAM_N = 500         # trigram stability cut
FOURGRAM_N = 300        # 4-gram cut — books + SUBTLEX only (no web 4-grams)
STRETCH_REACH = 1.5     # home reach (key widths) that counts as a stretch: y, b
TECHNICAL_CAP = 40
GESTURE_TRIGRAM_CAP = 30
GESTURE_FOURGRAM_CAP = 10
WORD_FLOOR = 250        # SUBTLEX-US FREQcount (~5 per million) for a practice word
WORD_CD_FLOOR = 100     # SUBTLEX-US CDcount: films the word appears in (of 8,388)
WORD_LOWER_RATIO = 0.5  # FREQlow/FREQcount: mostly lower-case in use — drops names and titles
# Contraction stems that SUBTLEX tokenises as words, and words a typing lesson
# should not put in front of a learner.
EXCLUDED_WORDS = {
    "aren", "isn", "wasn", "weren", "doesn", "didn", "don", "won", "couldn", "wouldn",
    "shouldn", "hasn", "hadn", "haven", "ain", "gonna", "gotta", "wanna", "em", "ll", "ve",
    "fuck", "fucking", "fucked", "fucker", "motherfucker", "motherfuckers", "shit", "bullshit",
    "bitch", "asshole", "damn", "goddamn", "hell", "nigger", "cunt", "dick", "piss", "pissed",
}
WORDS_PER_TARGET = 12
WORDS_MIN = 8


# ---------------------------------------------------------------------------
# Geometry and finger tables (same as movement-atlas v2 / analyze_cross_corpus)
# ---------------------------------------------------------------------------

KEYS: dict[str, dict] = {}


def put(chars: str, y: float, stagger: float):
    for i, ch in enumerate(chars):
        KEYS[ch] = {"x": i + stagger, "y": y}


put("qwertyuiop", 0.0, 0.00)
put("asdfghjkl;", 1.0, 0.25)
put("zxcvbnm", 2.0, 0.75)

ROW_NAME = {0.0: "top", 1.0: "home", 2.0: "bottom"}


def table(z: str, x: str, c: str, b: str) -> dict[str, tuple[str, str]]:
    t: dict[str, tuple[str, str]] = {}
    for ch in "qa":
        t[ch] = ("L", "pinky")
    for ch in "ws":
        t[ch] = ("L", "ring")
    for ch in "ed":
        t[ch] = ("L", "middle")
    for ch in "rtfgv":
        t[ch] = ("L", "index")
    for ch in "yuhjnm":
        t[ch] = ("R", "index")
    for ch in "ik":
        t[ch] = ("R", "middle")
    for ch in "ol":
        t[ch] = ("R", "ring")
    t["p"] = ("R", "pinky")
    t["z"], t["x"], t["c"], t["b"] = z, x, c, b  # type: ignore[assignment]
    return t


FINGERS = {
    # DEC-12: Traditional is the default table and defines mechanical class.
    "traditional": table(("L", "pinky"), ("L", "ring"), ("L", "middle"), ("L", "index")),
    # Relaxed QWERTY 1.0: Z ring, X middle, C index, B right index.
    "relaxed": table(("L", "ring"), ("L", "middle"), ("L", "index"), ("R", "index")),
}

HOME_KEY = {
    ("L", "pinky"): "a", ("L", "ring"): "s", ("L", "middle"): "d", ("L", "index"): "f",
    ("R", "index"): "j", ("R", "middle"): "k", ("R", "ring"): "l", ("R", "pinky"): ";",
}
OUTERNESS = {"index": 0, "middle": 1, "ring": 2, "pinky": 3}


def dist(a: str, b: str) -> float:
    A, B = KEYS[a], KEYS[b]
    return math.hypot(B["x"] - A["x"], B["y"] - A["y"])


def fid(ch: str, method: str = "traditional"):
    return FINGERS[method][ch]


def label(ch: str, method: str = "traditional") -> str:
    h, f = fid(ch, method)
    return f"{h}-{f}"


def home_reach(ch: str, method: str = "traditional") -> float:
    return dist(ch, HOME_KEY[fid(ch, method)])


def movement_class(bg: str, method: str = "traditional") -> str:
    a, b = bg
    if a == b:
        return "same_key"
    if fid(a, method) == fid(b, method):
        return "same_finger_different_key"
    if fid(a, method)[0] != fid(b, method)[0]:
        return "alternate_hands"
    return "same_hand_different_fingers"


def row_jump(bg: str) -> bool:
    return abs(KEYS[bg[0]]["y"] - KEYS[bg[1]]["y"]) == 2


def weak_reach(ch: str, method: str = "traditional") -> bool:
    """A pinky leaving its home key, or a ring finger reaching the bottom row."""
    h, f = fid(ch, method)
    off_home = home_reach(ch, method) > 0
    return (f == "pinky" and off_home) or (f == "ring" and KEYS[ch]["y"] == 2.0)


def mechanical_reasons(bg: str, method: str = "traditional") -> list[str]:
    a, b = bg
    reasons = []
    if movement_class(bg, method) == "same_finger_different_key":
        reasons.append("same_finger")
    if weak_reach(a, method) or weak_reach(b, method):
        reasons.append("weak_finger_reach")
    if max(home_reach(a, method), home_reach(b, method)) >= STRETCH_REACH:
        reasons.append("stretch")
    if row_jump(bg) and fid(a, method)[0] == fid(b, method)[0] and a != b:
        reasons.append("same_hand_row_jump")
    return reasons


def same_finger_pair(a: str, b: str, method: str = "traditional") -> bool:
    return a != b and fid(a, method) == fid(b, method)


def shape3(tri: str, method: str = "traditional"):
    hands = [fid(ch, method)[0] for ch in tri]
    fingers = [fid(ch, method)[1] for ch in tri]
    if len(set(hands)) != 1 or len(set(fingers)) != 3:
        return None
    v = [OUTERNESS[f] for f in fingers]
    d1, d2 = v[1] - v[0], v[2] - v[1]
    if d1 > 0 and d2 > 0:
        return "outward_roll"
    if d1 < 0 and d2 < 0:
        return "inward_roll"
    return "redirect"


def gesture_features(g: str, method: str = "traditional") -> list[str]:
    """Gesture features of a 3- or 4-letter chunk (union over 3-letter windows)."""
    feats: list[str] = []
    sf = sum(same_finger_pair(g[i], g[i + 1], method) for i in range(len(g) - 1))
    if sf >= 2:
        feats.append("same_finger_chain")
    elif sf == 1:
        feats.append("contains_same_finger")
    shapes = {shape3(g[i : i + 3], method) for i in range(len(g) - 2)}
    for s in ("redirect", "inward_roll", "outward_roll"):
        if s in shapes:
            feats.append(s)
    rc = sum(KEYS[g[i]]["y"] != KEYS[g[i + 1]]["y"] for i in range(len(g) - 1))
    if rc >= 2:
        feats.append("double_row_change")
    return feats


# ---------------------------------------------------------------------------
# Inputs
# ---------------------------------------------------------------------------


def read_cross(name: str) -> dict[str, dict]:
    rows = {}
    with (TABLES / name).open(newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            for c in CORPORA:
                r[f"rank_{c}"] = int(r[f"rank_{c}"]) if r[f"rank_{c}"] else None
                r[f"share_{c}"] = float(r[f"share_{c}"])
            rows[r["ngram"]] = r
    return rows


bigrams = read_cross("bigrams_cross_corpus.csv")
same_finger = read_cross("same_finger_cross_corpus.csv")
trigrams = read_cross("trigrams_cross_corpus.csv")


def load_subtlex() -> tuple[Counter, Counter, Counter]:
    counts: Counter = Counter()
    cd: Counter = Counter()
    low: Counter = Counter()
    with SUBTLEX.open(newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f, delimiter="\t"):
            w = r["Word"].strip().lower()
            if w.isalpha() and w.isascii():
                counts[w] += int(r["FREQcount"])
                low[w] += int(r["FREQlow"])
                cd[w] = max(cd[w], int(r["CDcount"]))
    return counts, cd, low


subtlex, subtlex_cd, subtlex_low = load_subtlex()
subtlex_tokens = sum(subtlex.values())


def load_books_words() -> dict[str, int]:
    words: dict[str, int] = {}
    with WORDS.open(encoding="utf-8", errors="replace") as f:
        for line in f:
            parts = line.split()
            if len(parts) < 2:
                continue
            w = parts[0].lower()
            if w.isalpha() and w.isascii():
                words[w] = words.get(w, 0) + int(parts[-1])
    return words


books_words = load_books_words()


def load_books_4grams() -> dict[str, int]:
    counts: dict[str, int] = {}
    with BOOKS_4.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        ci = next(reader).index("*/*")
        for row in reader:
            if not row:
                continue
            g = row[0].strip().lower()
            if len(g) == 4 and g.isalpha() and g.isascii():
                counts[g] = counts.get(g, 0) + int(row[ci])
    return counts


def rank_map(counts: dict[str, int]) -> tuple[dict[str, int], dict[str, float]]:
    total = sum(counts.values())
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return {g: i for i, (g, _) in enumerate(ordered, 1)}, {g: c / total for g, c in ordered}


books4 = load_books_4grams()
sub4: Counter = Counter()
for w, n in subtlex.items():
    for i in range(len(w) - 3):
        sub4[w[i : i + 4]] += n
rank4_books, share4_books = rank_map(books4)
rank4_sub, share4_sub = rank_map(dict(sub4))


# ---------------------------------------------------------------------------
# Set 1 — core transitions
# ---------------------------------------------------------------------------

core = [
    r for r in bigrams.values()
    if r["stability_class"] == "universal"
    and all(r[f"rank_{c}"] <= CORE_RANK for c in CORPORA)
]
core.sort(key=lambda r: r["rank_books"])
core_set = {r["ngram"] for r in core}

# ---------------------------------------------------------------------------
# Set 2 — technical transitions
# ---------------------------------------------------------------------------


def technical_stability(bg: str) -> tuple[str, str]:
    """Stability used for admission, and the justification when it is not the
    plain bigram class. Same-finger transitions compete only with each other,
    so their same-finger sub-ranking (N=30) is the relevant evidence."""
    if bg in same_finger:
        sf = same_finger[bg]["stability_class"]
        if sf == "universal":
            note = ""
            if bigrams[bg]["stability_class"] != "universal":
                note = (
                    f"bigram class {bigrams[bg]['stability_class']} at N={BIGRAM_N}; "
                    f"universal within the same-finger top-{SAME_FINGER_N}"
                )
            return "universal", note
        return sf, ""
    return bigrams[bg]["stability_class"], ""


technical_pool = []
for bg, r in bigrams.items():
    if movement_class(bg) == "same_key":
        continue
    reasons = mechanical_reasons(bg)
    if not reasons:
        continue
    stab, note = technical_stability(bg)
    if stab != "universal":
        continue
    technical_pool.append((bg, r, reasons, note))

# Same-finger transitions are the transition DEC-13 names as the unit to
# teach ("keys can be known while `mu` stays awkward"), so every universal
# one is admitted first; the remaining places go to the other reasons by
# worst-case corpus share (the mass the target keeps in every register).
technical_pool.sort(
    key=lambda t: ("same_finger" not in t[2], -min(t[1][f"share_{c}"] for c in CORPORA))
)
technical = technical_pool[:TECHNICAL_CAP]
technical_cut = technical_pool[TECHNICAL_CAP:]
technical_set = {t[0] for t in technical}

# ---------------------------------------------------------------------------
# Set 3 — gestures
# ---------------------------------------------------------------------------

gesture_tri_pool = []
for g, r in trigrams.items():
    if r["stability_class"] != "universal":
        continue
    feats = gesture_features(g)
    if not feats:
        continue
    gesture_tri_pool.append((g, r, feats))
gesture_tri_pool.sort(key=lambda t: -min(t[1][f"share_{c}"] for c in CORPORA))
gesture_tri = gesture_tri_pool[:GESTURE_TRIGRAM_CAP]

gesture_four_pool = []
for g, rb in rank4_books.items():
    rs = rank4_sub.get(g)
    if rb > FOURGRAM_N or rs is None or rs > FOURGRAM_N:
        continue
    feats = gesture_features(g)
    if not feats:
        continue
    gesture_four_pool.append((g, rb, rs, feats))
gesture_four_pool.sort(key=lambda t: -min(share4_books[t[0]], share4_sub[t[0]]))
gesture_four = gesture_four_pool[:GESTURE_FOURGRAM_CAP]

# ---------------------------------------------------------------------------
# Set 4 — practice words
# ---------------------------------------------------------------------------

everyday = {
    w: n for w, n in subtlex.items()
    if n >= WORD_FLOOR
    and subtlex_cd[w] >= WORD_CD_FLOOR
    and subtlex_low[w] / n >= WORD_LOWER_RATIO
    and w not in EXCLUDED_WORDS
    and w in books_words
}


def practice_words(target: str) -> list[tuple[str, int, float]]:
    """Up to WORDS_PER_TARGET everyday words containing the target: the most
    frequent in SUBTLEX-US, then ordered by how much of the word the target
    occupies (concentration = len(target) / len(word))."""
    pool = [(w, n) for w, n in everyday.items() if target in w]
    pool.sort(key=lambda wn: (-wn[1], wn[0]))
    chosen = pool[:WORDS_PER_TARGET]
    out = [(w, n, len(target) / len(w)) for w, n in chosen]
    out.sort(key=lambda t: (-t[2], -t[1]))
    return out


targets = [(bg, "transition") for bg, *_ in technical]
targets += [(g, "gesture") for g, *_ in gesture_tri]
targets += [(g, "gesture") for g, *_ in gesture_four]
words_by_target = {t: practice_words(t) for t, _ in targets}

# ---------------------------------------------------------------------------
# CSV writers
# ---------------------------------------------------------------------------


def write_csv(name: str, header_facts: dict, columns: list[str], rows: list[list]):
    with (CAND / name).open("w", newline="", encoding="utf-8") as f:
        f.write("# provisional=true — until learner error/hesitation data exists (DEC-16)\n")
        for k, v in header_facts.items():
            f.write(f"# {k}={v}\n")
        w = csv.writer(f)
        w.writerow(columns)
        w.writerows(rows)


def sf_travel(bg: str, method: str = "traditional") -> str:
    return f"{dist(*bg):.2f}" if movement_class(bg, method) == "same_finger_different_key" else ""


write_csv(
    "core_transitions.csv",
    {"stability": "universal", "core_rank": CORE_RANK, "purpose": "coverage check, not isolated drills"},
    ["bigram", "rank_books", "rank_web", "rank_subtlex", "share_books", "movement_class",
     "relaxed_class", "also_technical", "stability", "provisional"],
    [
        [r["ngram"], r["rank_books"], r["rank_web"], r["rank_subtlex"], f"{r['share_books']:.5f}",
         movement_class(r["ngram"]), movement_class(r["ngram"], "relaxed"),
         r["ngram"] in technical_set, "universal", True]
        for r in core
    ],
)

write_csv(
    "technical_transitions.csv",
    {"stability": "universal (same-finger rows: universal within same-finger top-N)",
     "bigram_n": BIGRAM_N, "same_finger_n": SAME_FINGER_N, "stretch_reach": STRETCH_REACH,
     "cap": TECHNICAL_CAP, "admission_order": "all same_finger first, then min share across corpora"},
    ["bigram", "reasons", "finger_from", "finger_to", "movement_class", "row_from", "row_to",
     "same_finger_travel", "reach_from", "reach_to", "relaxed_class", "relaxed_reasons",
     "rank_books", "rank_web", "rank_subtlex", "sf_rank_books", "sf_rank_web", "sf_rank_subtlex",
     "min_share", "also_core", "stability", "stability_note", "provisional"],
    [
        [bg, ";".join(reasons), label(bg[0]), label(bg[1]), movement_class(bg),
         ROW_NAME[KEYS[bg[0]]["y"]], ROW_NAME[KEYS[bg[1]]["y"]], sf_travel(bg),
         f"{home_reach(bg[0]):.2f}", f"{home_reach(bg[1]):.2f}",
         movement_class(bg, "relaxed"), ";".join(mechanical_reasons(bg, "relaxed")),
         r["rank_books"], r["rank_web"], r["rank_subtlex"],
         *(same_finger[bg][f"rank_{c}"] if bg in same_finger else "" for c in CORPORA),
         f"{min(r[f'share_{c}'] for c in CORPORA):.5f}", bg in core_set, "universal", note, True]
        for bg, r, reasons, note in technical
    ],
)

write_csv(
    "gestures.csv",
    {"stability": "universal (4-grams: top-N in Google Books and SUBTLEX-US; no web 4-gram table)",
     "trigram_n": TRIGRAM_N, "fourgram_n": FOURGRAM_N,
     "cap": f"{GESTURE_TRIGRAM_CAP} trigrams + {GESTURE_FOURGRAM_CAP} 4-grams",
     "admission_order": "min share across corpora"},
    ["gesture", "length", "features", "fingers", "rows", "relaxed_features",
     "rank_books", "rank_web", "rank_subtlex", "min_share", "stability", "provisional"],
    [
        [g, 3, ";".join(feats), " ".join(label(c) for c in g),
         " ".join(ROW_NAME[KEYS[c]["y"]] for c in g), ";".join(gesture_features(g, "relaxed")),
         r["rank_books"], r["rank_web"], r["rank_subtlex"],
         f"{min(r[f'share_{c}'] for c in CORPORA):.5f}", "universal", True]
        for g, r, feats in gesture_tri
    ] + [
        [g, 4, ";".join(feats), " ".join(label(c) for c in g),
         " ".join(ROW_NAME[KEYS[c]["y"]] for c in g), ";".join(gesture_features(g, "relaxed")),
         rb, "", rs, f"{min(share4_books[g], share4_sub[g]):.5f}", "two-corpus", True]
        for g, rb, rs, feats in gesture_four
    ],
)

write_csv(
    "practice_words.csv",
    {"word_floor_subtlex_freqcount": WORD_FLOOR, "word_floor_subtlex_cdcount": WORD_CD_FLOOR,
     "word_lower_ratio": WORD_LOWER_RATIO, "excluded_words": len(EXCLUDED_WORDS),
     "word_floor_per_million": f"{1e6 * WORD_FLOOR / subtlex_tokens:.1f}",
     "words_per_target": WORDS_PER_TARGET, "source": "Google Books word list ∩ SUBTLEX-US",
     "order": "concentration desc, then SUBTLEX-US frequency"},
    ["target", "kind", "word", "subtlex_freqcount", "subtlex_cdcount", "concentration", "provisional"],
    [
        [t, kind, w, n, subtlex_cd[w], f"{conc:.3f}", True]
        for t, kind in targets
        for w, n, conc in words_by_target[t]
    ],
)

write_csv(
    "everyday_words.csv",
    {"word_floor_subtlex_freqcount": WORD_FLOOR, "word_floor_subtlex_cdcount": WORD_CD_FLOOR,
     "word_lower_ratio": WORD_LOWER_RATIO, "excluded_words": len(EXCLUDED_WORDS),
     "word_floor_per_million": f"{1e6 * WORD_FLOOR / subtlex_tokens:.1f}",
     "source": "Google Books word list ∩ SUBTLEX-US", "order": "SUBTLEX-US frequency desc, then word"},
    ["word", "subtlex_freqcount", "subtlex_cdcount", "provisional"],
    [[w, n, subtlex_cd[w], True] for w, n in sorted(everyday.items(), key=lambda wn: (-wn[1], wn[0]))],
)

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

L: list[str] = []
add = L.append

reason_counts = Counter(r for _, _, reasons, _ in technical for r in reasons)
feat_counts = Counter(f for _, _, feats in gesture_tri for f in feats)
feat_counts4 = Counter(f for _, _, _, feats in gesture_four for f in feats)
short_words = [t for t, _ in targets if len(words_by_target[t]) < WORDS_MIN]


def qa_line() -> str:
    r = bigrams.get("qa")
    if r is None:
        return "`qa` does not occur in any corpus table."
    return (
        f"`qa` is mechanically awkward (pinky reach, same_finger under Traditional: "
        f"{movement_class('qa')}) but ranks {r['rank_books']} / {r['rank_web']} / "
        f"{r['rank_subtlex']} (books / web / subtlex), class `{r['stability_class']}` — "
        f"far outside the N={BIGRAM_N} cut, so it fails the frequency half of DEC-13."
    )


def mu_line() -> str:
    r = bigrams["mu"]
    sf = same_finger["mu"]
    return (
        f"`mu` is a same-finger (R-index) transition with {dist('m','u'):.2f} key widths of travel. "
        f"Its plain bigram rank is {r['rank_books']} / {r['rank_web']} / {r['rank_subtlex']} "
        f"(class `{r['stability_class']}` at N={BIGRAM_N}), but among same-finger transitions it is "
        f"rank {sf['rank_books']} / {sf['rank_web']} / {sf['rank_subtlex']} — universal within the "
        f"same-finger top-{SAME_FINGER_N}. Same-finger targets compete only with each other, so that "
        "is the admission evidence; the plain class is kept in `stability_note`."
    )


add("# Provisional Candidate Sets")
add("")
add("Four sets selected by corpus frequency × QWERTY mechanical class (DEC-13),")
add("admitted only when stable across corpora (DEC-16). Every set is")
add("**provisional until learner data** — no composite difficulty score is")
add("computed, and nothing here is a lesson order.")
add("")
add("Finger table: Traditional (DEC-12 default) defines class and reasons; the")
add("Relaxed QWERTY 1.0 class is carried as a second column (Z ring, X middle,")
add("C index, B right index).")
add("")
add("## Sets")
add("")
add("| set | file | size | admitted when |")
add("|---|---|---:|---|")
add(f"| core transitions | `candidates/core_transitions.csv` | {len(core)} | universal and rank ≤ {CORE_RANK} in every corpus |")
add(f"| technical transitions | `candidates/technical_transitions.csv` | {len(technical)} (cap {TECHNICAL_CAP}) | universal + a mechanical reason |")
add(f"| gestures | `candidates/gestures.csv` | {len(gesture_tri)} trigrams + {len(gesture_four)} 4-grams (cap {GESTURE_TRIGRAM_CAP} + {GESTURE_FOURGRAM_CAP}) | universal + a gesture feature |")
add(f"| practice words | `candidates/practice_words.csv` | {sum(len(v) for v in words_by_target.values())} words for {len(targets)} targets | everyday-word filter (see Practice words) |")
add("")
add("Each CSV starts with `#` header lines stating `provisional=true` and the")
add("thresholds above; every row carries `stability` and `provisional` columns.")
add("")

add("## Core transitions")
add("")
add("High-mass bigrams every learner meets constantly; they are learned inside")
add("common words and need no isolated drill. The set exists so coverage can be")
add("checked — a course that never produces one of these has a hole.")
add("")
add("`" + " ".join(r["ngram"] for r in core) + "`")
add("")
add(f"{sum(1 for r in core if r['ngram'] in technical_set)} of them also carry a")
add("mechanical reason and appear in the technical set (`also_technical`).")
add("")

add("## Technical transitions")
add("")
add("Mechanical reasons (Traditional table):")
add("")
add("| reason | meaning | rows |")
add("|---|---|---:|")
add(f"| `same_finger` | both keys on one finger; travel measured key to key | {reason_counts['same_finger']} |")
add(f"| `weak_finger_reach` | a pinky off its home key (q z p) or a ring finger on the bottom row (x) | {reason_counts['weak_finger_reach']} |")
add(f"| `stretch` | a key with home reach ≥ {STRETCH_REACH} key widths (y, b) | {reason_counts['stretch']} |")
add(f"| `same_hand_row_jump` | top ↔ bottom row on the same hand, different fingers | {reason_counts['same_hand_row_jump']} |")
add("")
add(f"{len(technical_pool)} bigrams qualify. Every universal same-finger transition")
add(f"is admitted first (DEC-13 names it as the unit to teach); the remaining places")
add(f"up to the cap of {TECHNICAL_CAP} go to the other reasons by worst-case corpus")
add("share. Cut by the cap: `"
    + " ".join(bg for bg, *_ in technical_cut) + "`.")
add("")
add("| bigram | reasons | fingers | class | travel | reach | relaxed class | rank b/w/s | SF rank b/w/s | min share |")
add("|:---:|---|---|---|---:|---:|---|---|---|---:|")
for bg, r, reasons, note in technical:
    sfr = same_finger.get(bg)
    add(
        f"| `{bg}` | {', '.join(reasons)} | {label(bg[0])} → {label(bg[1])} | {movement_class(bg)} | "
        f"{sf_travel(bg) or '—'} | {home_reach(bg[0]):.2f} + {home_reach(bg[1]):.2f} | "
        f"{movement_class(bg, 'relaxed')} | {r['rank_books']}/{r['rank_web']}/{r['rank_subtlex']} | "
        + (f"{sfr['rank_books']}/{sfr['rank_web']}/{sfr['rank_subtlex']}" if sfr else "—")
        + f" | {100 * min(r[f'share_{c}'] for c in CORPORA):.3f}% |"
    )
add("")
add("### Why `mu` is in and `qa` is out")
add("")
add(mu_line())
add("")
add(qa_line())
add("")
exceptions = [(bg, note) for bg, _, _, note in technical if note]
if exceptions:
    add("Rows admitted on same-finger evidence rather than the plain bigram class:")
    add("")
    for bg, note in exceptions:
        add(f"- `{bg}` — {note}")
    add("")
relaxed_changes = [
    bg for bg, *_ in technical if movement_class(bg) != movement_class(bg, "relaxed")
]
add("Under the Relaxed table the class changes for: `"
    + (" ".join(relaxed_changes) or "none") + "`. The set is selected on the")
add("Traditional table (DEC-12); a Relaxed-specific selection is a later step.")
add("")

add("## Gestures")
add("")
add("Features (union over the 3-letter windows of a chunk):")
add("")
add("| feature | trigram rows | 4-gram rows |")
add("|---|---:|---:|")
for f in ["same_finger_chain", "contains_same_finger", "redirect", "inward_roll", "outward_roll", "double_row_change"]:
    add(f"| `{f}` | {feat_counts[f]} | {feat_counts4[f]} |")
add("")
add(f"{len(gesture_tri_pool)} trigrams and {len(gesture_four_pool)} 4-grams qualify.")
add("4-grams have no Norvig web table, so their stability is `two-corpus`")
add(f"(top-{FOURGRAM_N} in both Google Books and SUBTLEX-US) — a stated exception,")
add("weaker than the three-corpus `universal` of the trigrams.")
add("")
add("| gesture | features | fingers | rows | relaxed features | rank b/w/s | min share |")
add("|:---:|---|---|---|---|---|---:|")
for g, r, feats in gesture_tri:
    add(
        f"| `{g}` | {', '.join(feats)} | {' '.join(label(c) for c in g)} | "
        f"{' '.join(ROW_NAME[KEYS[c]['y']] for c in g)} | {', '.join(gesture_features(g, 'relaxed')) or '—'} | "
        f"{r['rank_books']}/{r['rank_web']}/{r['rank_subtlex']} | "
        f"{100 * min(r[f'share_{c}'] for c in CORPORA):.3f}% |"
    )
for g, rb, rs, feats in gesture_four:
    add(
        f"| `{g}` | {', '.join(feats)} | {' '.join(label(c) for c in g)} | "
        f"{' '.join(ROW_NAME[KEYS[c]['y']] for c in g)} | {', '.join(gesture_features(g, 'relaxed')) or '—'} | "
        f"{rb}/—/{rs} | {100 * min(share4_books[g], share4_sub[g]):.3f}% |"
    )
add("")

add("## Practice words")
add("")
add(f"For each technical transition and gesture: the {WORDS_PER_TARGET} most frequent")
add(f"SUBTLEX-US words that contain the target and pass the everyday-word filter:")
add(f"FREQcount ≥ {WORD_FLOOR}; appears in ≥ {WORD_CD_FLOOR} of the 8,388 films; written in")
add(f"lower case ≥ {100 * WORD_LOWER_RATIO:.0f}% of the time (drops names and titles);")
add(f"not one of {len(EXCLUDED_WORDS)} excluded contraction stems and swear words; present")
add("in the Google Books word list. Ordered by concentration — the share")
add("of the word the target occupies — so short carriers come first.")
add("")
if short_words:
    add(f"Targets with fewer than {WORDS_MIN} everyday carriers: `" + " ".join(short_words) + "`.")
else:
    add(f"Every target has at least {WORDS_MIN} everyday carriers.")
add("")
add("| target | words |")
add("|:---:|---|")
for t, _ in targets:
    add(f"| `{t}` | " + ", ".join(w for w, _, _ in words_by_target[t]) + " |")
add("")

add("## Boundary")
add("")
add("Provisional until learner data. These sets say which movements are")
add("frequent everywhere and mechanically distinct; they do not say which are")
add("hard, and they do not order lessons. RES-05 exports them; lesson forms")
add("and sequencing are separate issues.")
add("")

(OUT / "candidates.md").write_bytes("\n".join(L).encode("utf-8"))  # LF on every OS

print(f"Wrote {OUT / 'candidates.md'}")
print(f"  core {len(core)}  technical {len(technical)}/{len(technical_pool)}  "
      f"gestures {len(gesture_tri)}+{len(gesture_four)}  words {sum(len(v) for v in words_by_target.values())}")
print("  technical:", " ".join(bg for bg, *_ in technical))
print("  gestures: ", " ".join(g for g, *_ in gesture_tri), "|", " ".join(g for g, *_ in gesture_four))
print("  mu words: ", ", ".join(w for w, _, _ in words_by_target.get("mu", [])))
