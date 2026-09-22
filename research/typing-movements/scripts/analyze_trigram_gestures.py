#!/usr/bin/env python3

import csv
import heapq
import math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw" / "norvig-books"
OUT = ROOT / "outputs"
TABLES = OUT / "tables"
TABLES.mkdir(parents=True, exist_ok=True)

TRIGRAMS = RAW / "ngrams3.tsv"
WORDS = RAW / "google-books-common-words.txt"

# ---------------------------------------------------------------------
# Keyboard / fingering model
# ---------------------------------------------------------------------

KEYS = {}

def put(chars, y, stagger):
    for i, ch in enumerate(chars):
        KEYS[ch] = {"x": i + stagger, "y": y}

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

# index -> middle -> ring -> pinky moves outward from keyboard center
OUTERNESS = {
    "index": 0,
    "middle": 1,
    "ring": 2,
    "pinky": 3,
}

def dist(a, b):
    A, B = KEYS[a], KEYS[b]
    return math.hypot(B["x"] - A["x"], B["y"] - A["y"])

def fid(ch):
    return FINGER[ch]

def finger_label(ch):
    hand, finger = fid(ch)
    return f"{hand}-{finger}"

def home_reach(ch):
    return dist(ch, HOME_KEY[fid(ch)])

def same_finger_pair(a, b):
    return a != b and fid(a) == fid(b)

def repeated_key_pair(a, b):
    return a == b

def pair_roll_direction(a, b):
    ha, fa = fid(a)
    hb, fb = fid(b)

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

# ---------------------------------------------------------------------
# Gesture classification
# ---------------------------------------------------------------------

def hand_pattern(tri):
    return "".join(fid(ch)[0] for ch in tri)

def finger_pattern(tri):
    return " → ".join(finger_label(ch) for ch in tri)

def row_pattern(tri):
    return " → ".join(str(int(KEYS[ch]["y"])) for ch in tri)

def row_changes(tri):
    return sum(
        KEYS[tri[i]]["y"] != KEYS[tri[i + 1]]["y"]
        for i in range(2)
    )

def same_finger_transition_count(tri):
    return sum(
        same_finger_pair(tri[i], tri[i + 1])
        for i in range(2)
    )

def repeated_key_transition_count(tri):
    return sum(
        repeated_key_pair(tri[i], tri[i + 1])
        for i in range(2)
    )

def same_finger_travel_total(tri):
    total = 0.0

    for i in range(2):
        a, b = tri[i], tri[i + 1]
        if same_finger_pair(a, b):
            total += dist(a, b)

    return total

def separated_finger_reuse(tri):
    # Same finger on positions 1 and 3, with another finger in between.
    return fid(tri[0]) == fid(tri[2]) and fid(tri[0]) != fid(tri[1])

def same_finger_reversal(tri):
    # All three letters typed with the same finger, where the second key
    # changes direction relative to the first/third key position.
    if not (fid(tri[0]) == fid(tri[1]) == fid(tri[2])):
        return False

    if tri[0] == tri[1] or tri[1] == tri[2]:
        return False

    A, B, C = (KEYS[ch] for ch in tri)

    v1 = (B["x"] - A["x"], B["y"] - A["y"])
    v2 = (C["x"] - B["x"], C["y"] - B["y"])

    dot = v1[0] * v2[0] + v1[1] * v2[1]

    return dot < 0

def three_finger_same_hand_shape(tri):
    hands = [fid(ch)[0] for ch in tri]
    fingers = [fid(ch)[1] for ch in tri]

    if len(set(hands)) != 1:
        return None

    if len(set(fingers)) != 3:
        return None

    vals = [OUTERNESS[f] for f in fingers]

    d1 = vals[1] - vals[0]
    d2 = vals[2] - vals[1]

    if d1 > 0 and d2 > 0:
        return "outward_roll"
    if d1 < 0 and d2 < 0:
        return "inward_roll"

    return "redirect"

def alternating_hands(tri):
    h = [fid(ch)[0] for ch in tri]
    return h[0] != h[1] and h[1] != h[2]

def gesture_tags(tri):
    tags = []

    sf = same_finger_transition_count(tri)
    rk = repeated_key_transition_count(tri)

    if sf:
        tags.append(f"same_finger_x{sf}")

    if rk:
        tags.append(f"repeat_key_x{rk}")

    if separated_finger_reuse(tri):
        tags.append("separated_finger_reuse")

    if same_finger_reversal(tri):
        tags.append("same_finger_reversal")

    shape = three_finger_same_hand_shape(tri)
    if shape:
        tags.append(shape)

    if alternating_hands(tri):
        tags.append("alternating_hands")

    rc = row_changes(tri)
    if rc == 2:
        tags.append("two_row_changes")
    elif rc == 1:
        tags.append("one_row_change")
    else:
        tags.append("no_row_change")

    return tags

# ---------------------------------------------------------------------
# Load trigram counts
# ---------------------------------------------------------------------

with TRIGRAMS.open(encoding="utf-8", newline="") as f:
    reader = csv.reader(f, delimiter="\t")
    header = next(reader)
    count_i = header.index("*/*")

    trigrams = []

    for row in reader:
        if not row:
            continue

        tri = row[0].strip().lower()

        if len(tri) != 3 or not tri.isalpha():
            continue

        trigrams.append((tri, int(row[count_i])))

trigrams.sort(key=lambda x: x[1], reverse=True)

tri_counts = dict(trigrams)
tri_rank = {tri: i for i, (tri, _) in enumerate(trigrams, 1)}
total = sum(c for _, c in trigrams)

# ---------------------------------------------------------------------
# Frequent whole-word examples containing each trigram
# ---------------------------------------------------------------------

TOP_WORDS = 10
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

        if not word.isalpha() or len(word) < 3:
            continue

        for tri in set(word[i:i+3] for i in range(len(word) - 2)):
            if tri not in tri_counts:
                continue

            item = (count, word)
            heap = heaps[tri]

            if len(heap) < TOP_WORDS:
                heapq.heappush(heap, item)
            elif item > heap[0]:
                heapq.heapreplace(heap, item)

top_words = {
    tri: sorted(heap, reverse=True)
    for tri, heap in heaps.items()
}

def examples(tri, n=6):
    return ", ".join(
        word for _, word in top_words.get(tri, [])[:n]
    ) or "—"

# ---------------------------------------------------------------------
# Aggregate taxonomy
# ---------------------------------------------------------------------

tag_mass = Counter()
hand_mass = Counter()
shape_mass = Counter()

for tri, count in trigrams:
    for tag in gesture_tags(tri):
        tag_mass[tag] += count

    hand_mass[hand_pattern(tri)] += count

    shape = three_finger_same_hand_shape(tri)
    if shape:
        shape_mass[shape] += count

# ---------------------------------------------------------------------
# Full CSV
# ---------------------------------------------------------------------

csv_path = TABLES / "trigram_gesture_atlas.csv"

with csv_path.open("w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)

    w.writerow([
        "rank",
        "trigram",
        "count",
        "share",
        "hand_pattern",
        "finger_pattern",
        "row_pattern",
        "row_changes",
        "same_finger_transition_count",
        "same_finger_travel_total",
        "repeated_key_transition_count",
        "separated_finger_reuse",
        "same_finger_reversal",
        "three_finger_same_hand_shape",
        "alternating_hands",
        "home_reach_sum",
        "home_reach_max",
        "tags",
        "top_words",
    ])

    for rank, (tri, count) in enumerate(trigrams, 1):
        reaches = [home_reach(ch) for ch in tri]
        shape = three_finger_same_hand_shape(tri)
        tags = gesture_tags(tri)

        w.writerow([
            rank,
            tri,
            count,
            count / total,
            hand_pattern(tri),
            finger_pattern(tri),
            row_pattern(tri),
            row_changes(tri),
            same_finger_transition_count(tri),
            round(same_finger_travel_total(tri), 4),
            repeated_key_transition_count(tri),
            separated_finger_reuse(tri),
            same_finger_reversal(tri),
            shape or "",
            alternating_hands(tri),
            round(sum(reaches), 4),
            round(max(reaches), 4),
            ",".join(tags),
            examples(tri, 10),
        ])

# ---------------------------------------------------------------------
# Interesting subsets
# ---------------------------------------------------------------------

def subset(predicate):
    return [
        (tri, count)
        for tri, count in trigrams
        if predicate(tri)
    ]

with_same_finger = subset(
    lambda t: same_finger_transition_count(t) >= 1
)

double_same_finger = subset(
    lambda t: same_finger_transition_count(t) == 2
)

separated_reuse = subset(separated_finger_reuse)
reversals = subset(same_finger_reversal)

redirects = subset(
    lambda t: three_finger_same_hand_shape(t) == "redirect"
)

inward_rolls = subset(
    lambda t: three_finger_same_hand_shape(t) == "inward_roll"
)

outward_rolls = subset(
    lambda t: three_finger_same_hand_shape(t) == "outward_roll"
)

two_row_changes = subset(
    lambda t: row_changes(t) == 2
)

def mass(rows):
    return sum(count for _, count in rows) / total

def markdown_table(rows, limit=25):
    out = [
        "| local rank | trigram | overall | share | hands | fingers | rows | examples |",
        "|---:|:---:|---:|---:|:---:|---|:---:|---|",
    ]

    for i, (tri, count) in enumerate(rows[:limit], 1):
        out.append(
            f"| {i} | `{tri}` | {tri_rank[tri]} | "
            f"{100 * count / total:.4f}% | "
            f"{hand_pattern(tri)} | "
            f"{finger_pattern(tri)} | "
            f"{row_pattern(tri)} | "
            f"{examples(tri)} |"
        )

    return out

# ---------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------

lines = [
    "# Trigram Gesture Atlas",
    "",
    "This treats a 3-letter sequence as a small motor gesture rather than",
    "merely three independent keys.",
    "",
    "No composite difficulty score is used.",
    "",
    "## Corpus",
    "",
    f"- observed trigrams: **{len(trigrams):,}**",
    f"- total occurrences: **{total:,}**",
    "",
    "## Gesture occurrence mass",
    "",
    "| feature | share of all trigram occurrences |",
    "|---|---:|",
    f"| contains adjacent same-finger movement | {100 * mass(with_same_finger):.3f}% |",
    f"| both adjacent moves are same-finger | {100 * mass(double_same_finger):.3f}% |",
    f"| reuses same finger at positions 1 and 3 | {100 * mass(separated_reuse):.3f}% |",
    f"| same-finger direction reversal | {100 * mass(reversals):.3f}% |",
    f"| three-finger same-hand redirect | {100 * mass(redirects):.3f}% |",
    f"| three-finger inward roll | {100 * mass(inward_rolls):.3f}% |",
    f"| three-finger outward roll | {100 * mass(outward_rolls):.3f}% |",
    f"| changes row on both transitions | {100 * mass(two_row_changes):.3f}% |",
    "",
    "## Hand-pattern occurrence mass",
    "",
    "| pattern | share |",
    "|:---:|---:|",
]

for pattern, count in hand_mass.most_common():
    lines.append(
        f"| `{pattern}` | {100 * count / total:.3f}% |"
    )

lines += [
    "",
    "## Highest-frequency trigrams containing a same-finger transition",
    "",
]
lines += markdown_table(with_same_finger)

lines += [
    "",
    "## Highest-frequency trigrams with same-finger movement twice",
    "",
]
lines += markdown_table(double_same_finger)

lines += [
    "",
    "## Highest-frequency separated finger reuse",
    "",
    "These use the same finger on letters 1 and 3 with another finger between.",
    "",
]
lines += markdown_table(separated_reuse)

lines += [
    "",
    "## Highest-frequency same-finger reversals",
    "",
    "All three letters use one finger and the movement changes physical direction.",
    "",
]
lines += markdown_table(reversals)

lines += [
    "",
    "## Highest-frequency three-finger redirects",
    "",
    "Same hand, three distinct fingers, with direction changing between",
    "inward and outward rather than continuing as a roll.",
    "",
]
lines += markdown_table(redirects)

lines += [
    "",
    "## Highest-frequency inward rolls",
    "",
]
lines += markdown_table(inward_rolls)

lines += [
    "",
    "## Highest-frequency outward rolls",
    "",
]
lines += markdown_table(outward_rolls)

lines += [
    "",
    "## Highest-frequency trigrams changing row twice",
    "",
]
lines += markdown_table(two_row_changes)

lines += [
    "",
    "## Reference: major common trigrams",
    "",
    "| trigram | rank | share | tags | examples |",
    "|:---:|---:|---:|---|---|",
]

for tri in [
    "the", "and", "ing", "ion", "tio", "ent", "ati",
    "for", "her", "ter", "hat", "tha", "ere", "ate",
]:
    if tri not in tri_counts:
        continue

    lines.append(
        f"| `{tri}` | {tri_rank[tri]} | "
        f"{100 * tri_counts[tri] / total:.4f}% | "
        f"{', '.join(gesture_tags(tri))} | "
        f"{examples(tri, 8)} |"
    )

lines += [
    "",
    "## Generated file",
    "",
    "- `outputs/tables/trigram_gesture_atlas.csv`",
    "",
    "## Interpretation boundary",
    "",
    "These categories describe **what the fingers are doing**, not how hard",
    "the movement is. The next useful step is to combine this taxonomy with",
    "frequency and redundancy to identify a compact set of candidate technical",
    "drills, while still keeping the constituent measurements visible.",
    "",
]

report = "\n".join(lines)

report_path = OUT / "trigram-gesture-atlas.md"
report_path.write_text(report, encoding="utf-8")

print(report)
