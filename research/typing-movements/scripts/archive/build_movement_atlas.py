#!/usr/bin/env python3
"""ARCHIVED (RES-02): the v1 movement atlas, superseded by build_movement_atlas_v2.py (DEC-16). Kept only so the
archived outputs under outputs/archive/ stay reproducible; `make analyze` does not run it."""

import csv
import heapq
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "raw" / "norvig-books"
OUT = ROOT / "outputs" / "archive"
TABLES = OUT / "tables"
TABLES.mkdir(parents=True, exist_ok=True)

NGRAMS = RAW / "ngrams2.tsv"
WORDS = RAW / "google-books-common-words.txt"

if not NGRAMS.exists():
    raise SystemExit(f"Missing {NGRAMS}")
if not WORDS.exists():
    raise SystemExit(f"Missing {WORDS}")

# ---------------------------------------------------------------------
# Approximate ANSI/QWERTY geometry, measured in key-width units.
#
# This is NOT a difficulty model. It gives us inspectable mechanical
# features that can later be combined with frequency and learner data.
# ---------------------------------------------------------------------

KEYS = {}

def add_row(chars, y, stagger, finger_map):
    for i, ch in enumerate(chars):
        KEYS[ch] = {
            "x": i + stagger,
            "y": y,
            "row": y,
            "hand": finger_map[ch][0],
            "finger": finger_map[ch][1],
            "finger_id": finger_map[ch],
        }

finger_map = {}

for ch in "qaz":
    finger_map[ch] = ("L", "pinky")
for ch in "wsx":
    finger_map[ch] = ("L", "ring")
for ch in "edc":
    finger_map[ch] = ("L", "middle")
for ch in "rtfgvb":
    finger_map[ch] = ("L", "index")

for ch in "yuhjnm":
    finger_map[ch] = ("R", "index")
for ch in "ik":
    finger_map[ch] = ("R", "middle")
for ch in "ol":
    finger_map[ch] = ("R", "ring")
for ch in "p":
    finger_map[ch] = ("R", "pinky")

add_row("qwertyuiop", 0, 0.00, finger_map)
add_row("asdfghjkl",  1, 0.25, finger_map)
add_row("zxcvbnm",    2, 0.75, finger_map)

OUTERNESS = {
    "index": 0,
    "middle": 1,
    "ring": 2,
    "pinky": 3,
}

def movement_class(bg):
    a, b = bg
    A, B = KEYS[a], KEYS[b]

    if a == b:
        return "same_key"
    if A["finger_id"] == B["finger_id"]:
        return "same_finger_different_key"
    if A["hand"] != B["hand"]:
        return "alternate_hands"
    return "same_hand_different_fingers"

def roll_direction(bg):
    a, b = bg
    A, B = KEYS[a], KEYS[b]

    if A["hand"] != B["hand"]:
        return "cross_hand"

    if A["finger"] == B["finger"]:
        return "same_finger"

    fa = OUTERNESS[A["finger"]]
    fb = OUTERNESS[B["finger"]]

    if fb < fa:
        return "inward"
    if fb > fa:
        return "outward"
    return "same"

def features(bg):
    a, b = bg
    A, B = KEYS[a], KEYS[b]

    dx = B["x"] - A["x"]
    dy = B["y"] - A["y"]

    return {
        "movement_class": movement_class(bg),
        "distance": math.hypot(dx, dy),
        "dx": dx,
        "dy": dy,
        "row_change": A["row"] != B["row"],
        "row_span": abs(A["row"] - B["row"]),
        "roll_direction": roll_direction(bg),
        "outer_finger_involved":
            A["finger"] in {"ring", "pinky"}
            or B["finger"] in {"ring", "pinky"},
        "pinky_involved":
            A["finger"] == "pinky"
            or B["finger"] == "pinky",
        "from_hand": A["hand"],
        "from_finger": A["finger"],
        "from_row": A["row"],
        "to_hand": B["hand"],
        "to_finger": B["finger"],
        "to_row": B["row"],
    }

# ---------------------------------------------------------------------
# Load Norvig bigrams
# ---------------------------------------------------------------------

with NGRAMS.open(encoding="utf-8", newline="") as f:
    reader = csv.reader(f, delimiter="\t")
    header = next(reader)
    count_i = header.index("*/*")

    bigrams = []

    for row in reader:
        if not row:
            continue

        bg = row[0].strip().lower()

        if len(bg) != 2 or not bg.isalpha():
            continue

        bigrams.append((bg, int(row[count_i])))

bigrams.sort(key=lambda x: x[1], reverse=True)

bigram_counts = dict(bigrams)
bigram_rank = {bg: i for i, (bg, _) in enumerate(bigrams, 1)}
total_count = sum(c for _, c in bigrams)

# ---------------------------------------------------------------------
# Find frequent real words containing every transition.
#
# Only the top 12 words per bigram are retained, so memory stays tiny.
# ---------------------------------------------------------------------

TOP_WORDS = 12
word_heaps = defaultdict(list)

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

            heap = word_heaps[bg]
            item = (count, word)

            if len(heap) < TOP_WORDS:
                heapq.heappush(heap, item)
            elif item > heap[0]:
                heapq.heapreplace(heap, item)

top_words = {
    bg: sorted(heap, reverse=True)
    for bg, heap in word_heaps.items()
}

# ---------------------------------------------------------------------
# Enriched atlas CSV
# ---------------------------------------------------------------------

atlas_path = TABLES / "movement_atlas.csv"

with atlas_path.open("w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)

    w.writerow([
        "rank",
        "bigram",
        "count",
        "share",
        "movement_class",
        "distance_key_units",
        "dx",
        "dy",
        "row_change",
        "row_span",
        "roll_direction",
        "outer_finger_involved",
        "pinky_involved",
        "from_hand",
        "from_finger",
        "from_row",
        "to_hand",
        "to_finger",
        "to_row",
        "top_words",
    ])

    for rank, (bg, count) in enumerate(bigrams, 1):
        x = features(bg)
        words = ", ".join(word for _, word in top_words.get(bg, []))

        w.writerow([
            rank,
            bg,
            count,
            count / total_count,
            x["movement_class"],
            round(x["distance"], 4),
            round(x["dx"], 4),
            round(x["dy"], 4),
            x["row_change"],
            x["row_span"],
            x["roll_direction"],
            x["outer_finger_involved"],
            x["pinky_involved"],
            x["from_hand"],
            x["from_finger"],
            x["from_row"],
            x["to_hand"],
            x["to_finger"],
            x["to_row"],
            words,
        ])

# Long-form word mapping

words_path = TABLES / "transition_words.csv"

with words_path.open("w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow([
        "bigram",
        "bigram_rank",
        "word_rank",
        "word",
        "word_count",
    ])

    for bg, _ in bigrams:
        for rank, (count, word) in enumerate(top_words.get(bg, []), 1):
            w.writerow([
                bg,
                bigram_rank[bg],
                rank,
                word,
                count,
            ])

# ---------------------------------------------------------------------
# Summary calculations
# ---------------------------------------------------------------------

weighted_distance = (
    sum(features(bg)["distance"] * count for bg, count in bigrams)
    / total_count
)

same_finger = [
    (bg, count)
    for bg, count in bigrams
    if features(bg)["movement_class"] == "same_finger_different_key"
]

long_distance = [
    (bg, count)
    for bg, count in bigrams
    if features(bg)["distance"] >= 2.0
]

outer_row_change = [
    (bg, count)
    for bg, count in bigrams
    if features(bg)["row_change"]
    and features(bg)["outer_finger_involved"]
]

def word_examples(bg, n=6):
    return ", ".join(
        word for _, word in top_words.get(bg, [])[:n]
    ) or "—"

def table(rows, limit=25):
    result = [
        "| rank | bg | overall | freq share | dist | movement | examples |",
        "|---:|:---:|---:|---:|---:|---|---|",
    ]

    for local_rank, (bg, count) in enumerate(rows[:limit], 1):
        x = features(bg)

        result.append(
            f"| {local_rank} | `{bg}` | {bigram_rank[bg]} | "
            f"{100 * count / total_count:.3f}% | "
            f"{x['distance']:.2f} | "
            f"{x['from_hand']}-{x['from_finger']} → "
            f"{x['to_hand']}-{x['to_finger']} | "
            f"{word_examples(bg)} |"
        )

    return result

lines = []

lines += [
    "> **ARCHIVED (RES-02).** Superseded by `outputs/movement-atlas-v2.md` (per-finger reach model, DEC-16). Do not use its",
    "> distance figures as a difficulty measure; kept for history only.",
    "",
    "# Typing Movement Atlas",
    "",
    "This extends the frequency baseline with approximate physical QWERTY geometry.",
    "",
    "**Important:** distance and movement descriptors are raw mechanical features,",
    "not a claim that a transition is objectively difficult.",
    "",
    "Geometry uses approximate row staggers:",
    "",
    "- top row: 0.00 key",
    "- home row: +0.25 key",
    "- bottom row: +0.75 key",
    "",
    f"Frequency-weighted mean letter-to-letter travel: "
    f"**{weighted_distance:.3f} key widths**.",
    "",
    "## High-frequency same-finger transitions",
    "",
]

lines += table(same_finger)

lines += [
    "",
    "## High-frequency transitions traveling at least 2 key widths",
    "",
]

lines += table(long_distance)

lines += [
    "",
    "## High-frequency row changes involving ring or pinky",
    "",
]

lines += table(outer_row_change)

# A few transitions we have explicitly discussed
lines += [
    "",
    "## Previously discussed transitions",
    "",
    "| bg | overall rank | share | distance | class | examples |",
    "|:---:|---:|---:|---:|---|---|",
]

for bg in ["ed", "ce", "tr", "un", "lo", "um", "mu", "qa"]:
    if bg not in bigram_counts:
        continue

    count = bigram_counts[bg]
    x = features(bg)

    lines.append(
        f"| `{bg}` | {bigram_rank[bg]} | "
        f"{100 * count / total_count:.6f}% | "
        f"{x['distance']:.2f} | "
        f"{x['movement_class']} | "
        f"{word_examples(bg, 8)} |"
    )

lines += [
    "",
    "## Files",
    "",
    "- `outputs/archive/tables/movement_atlas.csv` — one row per observed bigram",
    "- `outputs/archive/tables/transition_words.csv` — frequent real words for each transition",
    "",
    "## Next research question",
    "",
    "Use these raw mechanical features to study **multi-keystroke gestures**:",
    "rolls, redirects, repeated fingers, direction changes, and awkward trigrams.",
    "Only after that should we experiment with a composite pedagogical-value score.",
    "",
]

report = "\n".join(lines)
report_path = OUT / "movement-atlas.md"
report_path.write_text(report, encoding="utf-8")

print(report)
