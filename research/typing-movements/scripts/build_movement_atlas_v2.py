#!/usr/bin/env python3

import csv
import heapq
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw" / "norvig-books"
OUT = ROOT / "outputs"
TABLES = OUT / "tables"
TABLES.mkdir(parents=True, exist_ok=True)

NGRAMS = RAW / "ngrams2.tsv"
WORDS = RAW / "google-books-common-words.txt"

# ---------------------------------------------------------------------
# QWERTY geometry
#
# Coordinates are approximate key-center positions in key-width units.
#
# IMPORTANT CHANGE FROM V1:
#
# We no longer treat distance between DIFFERENT fingers' keys as physical
# finger travel. "a -> l" is not an eight-key finger movement: two separate
# fingers press those keys.
#
# Instead we record:
#
#   home_reach(key)
#       Distance from that key to the assigned finger's resting/home key.
#
#   combined_home_reach(a,b)
#       Reach demanded by the two keys independently.
#
#   same_finger_travel(a,b)
#       Actual key-to-key travel only when the SAME finger types both keys.
#
# This still isn't a complete biomechanical model, but it avoids the largest
# conceptual error in v1 and gives us good primitive features for sequences.
# ---------------------------------------------------------------------

KEYS = {}

def put(chars, y, stagger):
    for i, ch in enumerate(chars):
        KEYS[ch] = {
            "x": i + stagger,
            "y": y,
        }

put("qwertyuiop", 0.0, 0.00)
put("asdfghjkl;", 1.0, 0.25)
put("zxcvbnm", 2.0, 0.75)

FINGER = {}

for ch in "qaz":
    FINGER[ch] = ("L", "pinky")
for ch in "wsx":
    FINGER[ch] = ("L", "ring")
for ch in "edc":
    FINGER[ch] = ("L", "middle")
for ch in "rtfgvb":
    FINGER[ch] = ("L", "index")

for ch in "yuhjnm":
    FINGER[ch] = ("R", "index")
for ch in "ik":
    FINGER[ch] = ("R", "middle")
for ch in "ol":
    FINGER[ch] = ("R", "ring")
for ch in "p":
    FINGER[ch] = ("R", "pinky")

HOME_KEY = {
    ("L", "pinky"): "a",
    ("L", "ring"): "s",
    ("L", "middle"): "d",
    ("L", "index"): "f",
    ("R", "index"): "j",
    ("R", "middle"): "k",
    ("R", "ring"): "l",
    ("R", "pinky"): ";",
}

OUTERNESS = {
    "index": 0,
    "middle": 1,
    "ring": 2,
    "pinky": 3,
}

def dist(a, b):
    A = KEYS[a]
    B = KEYS[b]
    return math.hypot(B["x"] - A["x"], B["y"] - A["y"])

def finger_id(ch):
    return FINGER[ch]

def home_reach(ch):
    return dist(ch, HOME_KEY[finger_id(ch)])

def movement_class(bg):
    a, b = bg
    fa = finger_id(a)
    fb = finger_id(b)

    if a == b:
        return "same_key"

    if fa == fb:
        return "same_finger_different_key"

    if fa[0] != fb[0]:
        return "alternate_hands"

    return "same_hand_different_fingers"

def same_finger_travel(bg):
    a, b = bg
    if finger_id(a) == finger_id(b) and a != b:
        return dist(a, b)
    return None

def roll_direction(bg):
    a, b = bg
    ha, fa = finger_id(a)
    hb, fb = finger_id(b)

    if ha != hb:
        return "cross_hand"

    if fa == fb:
        return "same_finger"

    oa = OUTERNESS[fa]
    ob = OUTERNESS[fb]

    if ob < oa:
        return "inward"
    if ob > oa:
        return "outward"
    return "same"

def row(ch):
    return KEYS[ch]["y"]

def features(bg):
    a, b = bg

    ha, fa = finger_id(a)
    hb, fb = finger_id(b)

    reach_a = home_reach(a)
    reach_b = home_reach(b)
    sft = same_finger_travel(bg)

    return {
        "movement_class": movement_class(bg),

        "from_hand": ha,
        "from_finger": fa,
        "to_hand": hb,
        "to_finger": fb,

        "from_home_key": HOME_KEY[(ha, fa)],
        "to_home_key": HOME_KEY[(hb, fb)],

        "from_home_reach": reach_a,
        "to_home_reach": reach_b,
        "combined_home_reach": reach_a + reach_b,
        "max_home_reach": max(reach_a, reach_b),

        "same_finger_travel": sft,

        "row_change": row(a) != row(b),
        "row_span": abs(row(a) - row(b)),

        "roll_direction": roll_direction(bg),

        "outer_finger_involved":
            fa in {"ring", "pinky"} or fb in {"ring", "pinky"},

        "pinky_involved":
            fa == "pinky" or fb == "pinky",
    }

# ---------------------------------------------------------------------
# Load bigram counts
# ---------------------------------------------------------------------

with NGRAMS.open(encoding="utf-8", newline="") as f:
    reader = csv.reader(f, delimiter="\t")
    header = next(reader)
    count_i = header.index("*/*")

    bigrams = []

    for r in reader:
        if not r:
            continue

        bg = r[0].strip().lower()

        if len(bg) != 2 or not bg.isalpha():
            continue

        bigrams.append((bg, int(r[count_i])))

bigrams.sort(key=lambda x: x[1], reverse=True)

bigram_counts = dict(bigrams)
bigram_rank = {bg: i for i, (bg, _) in enumerate(bigrams, 1)}
total = sum(c for _, c in bigrams)

# ---------------------------------------------------------------------
# Frequent example words
# ---------------------------------------------------------------------

TOP_WORDS = 12
heaps = defaultdict(list)

with WORDS.open(encoding="utf-8", errors="replace") as f:
    for line in f:
        parts = line.strip().split()

        if len(parts) < 2:
            continue

        word = parts[0].lower()

        try:
            count = int(parts[-1])
        except ValueError:
            continue

        if not word.isalpha() or len(word) < 2:
            continue

        for bg in set(word[i:i+2] for i in range(len(word) - 1)):
            if bg not in bigram_counts:
                continue

            item = (count, word)
            heap = heaps[bg]

            if len(heap) < TOP_WORDS:
                heapq.heappush(heap, item)
            elif item > heap[0]:
                heapq.heapreplace(heap, item)

top_words = {
    bg: sorted(heap, reverse=True)
    for bg, heap in heaps.items()
}

def examples(bg, n=6):
    words = top_words.get(bg, [])[:n]
    return ", ".join(word for _, word in words) if words else "—"

# ---------------------------------------------------------------------
# Full atlas
# ---------------------------------------------------------------------

atlas = TABLES / "movement_atlas_v2.csv"

with atlas.open("w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)

    w.writerow([
        "rank",
        "bigram",
        "count",
        "share",

        "movement_class",

        "from_hand",
        "from_finger",
        "from_home_key",
        "from_home_reach",

        "to_hand",
        "to_finger",
        "to_home_key",
        "to_home_reach",

        "combined_home_reach",
        "max_home_reach",
        "same_finger_travel",

        "row_change",
        "row_span",
        "roll_direction",
        "outer_finger_involved",
        "pinky_involved",

        "top_words",
    ])

    for rank, (bg, count) in enumerate(bigrams, 1):
        x = features(bg)

        w.writerow([
            rank,
            bg,
            count,
            count / total,

            x["movement_class"],

            x["from_hand"],
            x["from_finger"],
            x["from_home_key"],
            round(x["from_home_reach"], 4),

            x["to_hand"],
            x["to_finger"],
            x["to_home_key"],
            round(x["to_home_reach"], 4),

            round(x["combined_home_reach"], 4),
            round(x["max_home_reach"], 4),

            (
                round(x["same_finger_travel"], 4)
                if x["same_finger_travel"] is not None
                else ""
            ),

            x["row_change"],
            x["row_span"],
            x["roll_direction"],
            x["outer_finger_involved"],
            x["pinky_involved"],

            examples(bg, 12),
        ])

# ---------------------------------------------------------------------
# Aggregate key-frequency burden
# ---------------------------------------------------------------------

letter_counts = defaultdict(int)

for bg, count in bigrams:
    letter_counts[bg[0]] += count
    letter_counts[bg[1]] += count

weighted_home_reach = (
    sum(
        count * (home_reach(bg[0]) + home_reach(bg[1]))
        for bg, count in bigrams
    )
    / (2 * total)
)

same_finger = [
    (bg, count)
    for bg, count in bigrams
    if movement_class(bg) == "same_finger_different_key"
]

# High-frequency transitions where one/both keys demand substantial reach.
reach_heavy = [
    (bg, count)
    for bg, count in bigrams
    if features(bg)["combined_home_reach"] >= 2.0
]

same_hand_outward = [
    (bg, count)
    for bg, count in bigrams
    if features(bg)["roll_direction"] == "outward"
]

def same_finger_table(rows, limit=30):
    out = [
        "| rank | bg | overall | share | finger | travel | home reaches | examples |",
        "|---:|:---:|---:|---:|---|---:|---:|---|",
    ]

    for i, (bg, count) in enumerate(rows[:limit], 1):
        x = features(bg)

        out.append(
            f"| {i} | `{bg}` | {bigram_rank[bg]} | "
            f"{100 * count / total:.3f}% | "
            f"{x['from_hand']}-{x['from_finger']} | "
            f"{x['same_finger_travel']:.2f} | "
            f"{x['from_home_reach']:.2f} + {x['to_home_reach']:.2f} | "
            f"{examples(bg)} |"
        )

    return out

def reach_table(rows, limit=25):
    out = [
        "| rank | bg | overall | share | combined reach | max reach | movement | examples |",
        "|---:|:---:|---:|---:|---:|---:|---|---|",
    ]

    for i, (bg, count) in enumerate(rows[:limit], 1):
        x = features(bg)

        out.append(
            f"| {i} | `{bg}` | {bigram_rank[bg]} | "
            f"{100 * count / total:.3f}% | "
            f"{x['combined_home_reach']:.2f} | "
            f"{x['max_home_reach']:.2f} | "
            f"{x['movement_class']} | "
            f"{examples(bg)} |"
        )

    return out

# ---------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------

lines = [
    "# Typing Movement Atlas v2",
    "",
    "This version fixes the major geometry problem in v1.",
    "",
    "Different fingers are no longer treated as though one finger physically",
    "travels from the first key to the second key.",
    "",
    "Instead:",
    "",
    "- every key has a **home reach** from its assigned finger's resting key;",
    "- different-finger bigrams retain those reaches separately;",
    "- **same-finger travel** is measured directly from key to key;",
    "- no composite difficulty score is asserted yet.",
    "",
    f"Frequency-weighted mean home reach per letter event: "
    f"**{weighted_home_reach:.3f} key widths**.",
    "",
    "## Highest-frequency same-finger transitions",
    "",
]

lines += same_finger_table(same_finger)

lines += [
    "",
    "## High-frequency transitions with combined home reach >= 2.0",
    "",
]

lines += reach_table(reach_heavy)

lines += [
    "",
    "## High-frequency same-hand outward movements",
    "",
]

lines += reach_table(same_hand_outward)

lines += [
    "",
    "## Previously discussed transitions",
    "",
    "| bg | overall rank | share | class | same-finger travel | combined home reach | examples |",
    "|:---:|---:|---:|---|---:|---:|---|",
]

for bg in ["ed", "ce", "tr", "un", "lo", "um", "mu", "qa"]:
    count = bigram_counts[bg]
    x = features(bg)

    sft = (
        f"{x['same_finger_travel']:.2f}"
        if x["same_finger_travel"] is not None
        else "—"
    )

    lines.append(
        f"| `{bg}` | {bigram_rank[bg]} | "
        f"{100 * count / total:.6f}% | "
        f"{x['movement_class']} | "
        f"{sft} | "
        f"{x['combined_home_reach']:.2f} | "
        f"{examples(bg, 8)} |"
    )

lines += [
    "",
    "## Why this matters for the next stage",
    "",
    "For multi-key gestures, we can now track each finger independently.",
    "That lets a trigram model distinguish things such as:",
    "",
    "- repeated use of the same finger;",
    "- same-finger direction reversal;",
    "- inward vs outward rolls;",
    "- redirects across three fingers;",
    "- repeated row changes;",
    "- one finger remaining displaced while another acts;",
    "- total and peak home-position reach.",
    "",
    "Those are much closer to the classical-instrument notion of a",
    "**difficult fingering or transition** than raw distance between letters.",
    "",
    "## Generated file",
    "",
    "- `outputs/tables/movement_atlas_v2.csv`",
    "",
]

report = "\n".join(lines)

path = OUT / "movement-atlas-v2.md"
path.write_text(report, encoding="utf-8")

print(report)
