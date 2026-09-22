#!/usr/bin/env python3

from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "raw" / "norvig-books"
OUT = ROOT / "outputs"
TABLES = OUT / "tables"

OUT.mkdir(parents=True, exist_ok=True)
TABLES.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Conventional US-QWERTY touch-typing model
#
# B is intentionally LEFT INDEX.
# ---------------------------------------------------------------------------

KEYS = {}


def add(chars: str, hand: str, finger: str, row: str):
    for char in chars:
        KEYS[char] = {
            "hand": hand,
            "finger": finger,
            "row": row,
        }


add("q", "L", "pinky", "top")
add("a", "L", "pinky", "home")
add("z", "L", "pinky", "bottom")

add("w", "L", "ring", "top")
add("s", "L", "ring", "home")
add("x", "L", "ring", "bottom")

add("e", "L", "middle", "top")
add("d", "L", "middle", "home")
add("c", "L", "middle", "bottom")

add("rt", "L", "index", "top")
add("fg", "L", "index", "home")
add("vb", "L", "index", "bottom")

add("yu", "R", "index", "top")
add("hj", "R", "index", "home")
add("nm", "R", "index", "bottom")

add("i", "R", "middle", "top")
add("k", "R", "middle", "home")

add("o", "R", "ring", "top")
add("l", "R", "ring", "home")

add("p", "R", "pinky", "top")


def finger_id(char: str) -> str:
    k = KEYS[char]
    return f"{k['hand']}-{k['finger']}"


def classify_bigram(bg: str) -> str:
    a, b = bg

    if a == b:
        return "same_key"

    ka = KEYS[a]
    kb = KEYS[b]

    if finger_id(a) == finger_id(b):
        return "same_finger_different_key"

    if ka["hand"] != kb["hand"]:
        return "alternate_hands"

    return "same_hand_different_fingers"


def is_row_change(bg: str) -> bool:
    a, b = bg
    return KEYS[a]["row"] != KEYS[b]["row"]


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------


def read_norvig(path: Path):
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader)

        count_index = header.index("*/*")

        rows = []
        for row in reader:
            if not row:
                continue

            gram = row[0].strip().lower()

            # This first analysis is alphabetic English only.
            if not gram.isalpha():
                continue

            count = int(row[count_index])
            rows.append((gram, count))

    rows.sort(key=lambda x: x[1], reverse=True)
    return rows


bigrams = read_norvig(DATA / "ngrams2.tsv")
trigrams = read_norvig(DATA / "ngrams3.tsv")
fourgrams = read_norvig(DATA / "ngrams4.tsv")

datasets = {
    2: bigrams,
    3: trigrams,
    4: fourgrams,
}


# ---------------------------------------------------------------------------
# Generic frequency statistics
# ---------------------------------------------------------------------------


def total(rows):
    return sum(count for _, count in rows)


def coverage_count(rows, target: float):
    grand_total = total(rows)
    running = 0

    for rank, (_, count) in enumerate(rows, 1):
        running += count
        if running / grand_total >= target:
            return rank, running / grand_total

    return len(rows), 1.0


def top_n_share(rows, n):
    return sum(count for _, count in rows[:n]) / total(rows)


def pct(x):
    return f"{100 * x:.3f}%"


# ---------------------------------------------------------------------------
# Bigram mechanical enrichment
# ---------------------------------------------------------------------------

bigram_total = total(bigrams)
bigram_rank = {
    bg: rank
    for rank, (bg, _) in enumerate(bigrams, 1)
}

movement_counts = Counter()

for bg, count in bigrams:
    movement_counts[classify_bigram(bg)] += count

row_change_count = sum(
    count
    for bg, count in bigrams
    if is_row_change(bg)
)

same_finger = [
    (bg, count)
    for bg, count in bigrams
    if classify_bigram(bg) == "same_finger_different_key"
]

same_finger.sort(key=lambda x: x[1], reverse=True)
same_finger_total = sum(c for _, c in same_finger)


# ---------------------------------------------------------------------------
# How much bigram movement mass is represented by common longer chunks?
# ---------------------------------------------------------------------------

bigram_counts = dict(bigrams)


def transition_types_in_chunk(chunk: str):
    return {
        chunk[i : i + 2]
        for i in range(len(chunk) - 1)
    }


def chunk_transition_coverage(rows, top_n: int):
    transitions = set()

    for chunk, _ in rows[:top_n]:
        transitions.update(transition_types_in_chunk(chunk))

    represented = sum(
        bigram_counts.get(bg, 0)
        for bg in transitions
    )

    return len(transitions), represented / bigram_total


# ---------------------------------------------------------------------------
# CSV outputs
# ---------------------------------------------------------------------------

with (TABLES / "bigrams_enriched.csv").open(
    "w", newline="", encoding="utf-8"
) as f:
    w = csv.writer(f)

    w.writerow([
        "rank",
        "bigram",
        "count",
        "share_of_all_bigrams",
        "movement_class",
        "row_change",
        "from_hand",
        "from_finger",
        "from_row",
        "to_hand",
        "to_finger",
        "to_row",
    ])

    for rank, (bg, count) in enumerate(bigrams, 1):
        a, b = bg
        ka = KEYS[a]
        kb = KEYS[b]

        w.writerow([
            rank,
            bg,
            count,
            count / bigram_total,
            classify_bigram(bg),
            is_row_change(bg),
            ka["hand"],
            ka["finger"],
            ka["row"],
            kb["hand"],
            kb["finger"],
            kb["row"],
        ])


with (TABLES / "same_finger_transitions.csv").open(
    "w", newline="", encoding="utf-8"
) as f:
    w = csv.writer(f)

    w.writerow([
        "same_finger_rank",
        "overall_bigram_rank",
        "bigram",
        "count",
        "share_of_same_finger_mass",
        "share_of_all_bigram_mass",
        "finger",
    ])

    for rank, (bg, count) in enumerate(same_finger, 1):
        w.writerow([
            rank,
            bigram_rank[bg],
            bg,
            count,
            count / same_finger_total,
            count / bigram_total,
            finger_id(bg[0]),
        ])


def write_top_table(filename: str, rows, n=500):
    grand_total = total(rows)

    with (TABLES / filename).open(
        "w", newline="", encoding="utf-8"
    ) as f:
        w = csv.writer(f)
        w.writerow([
            "rank",
            "ngram",
            "count",
            "share",
            "cumulative_share",
        ])

        cumulative = 0

        for rank, (gram, count) in enumerate(rows[:n], 1):
            cumulative += count
            w.writerow([
                rank,
                gram,
                count,
                count / grand_total,
                cumulative / grand_total,
            ])


write_top_table("top_bigrams.csv", bigrams)
write_top_table("top_trigrams.csv", trigrams)
write_top_table("top_4grams.csv", fourgrams)


# ---------------------------------------------------------------------------
# Compact Markdown report
# ---------------------------------------------------------------------------

lines = []

lines.append("# Typing Movement Baseline")
lines.append("")
lines.append("Source: Peter Norvig Google Books-derived letter n-gram tables.")
lines.append("")
lines.append("Keyboard model: conventional US QWERTY; B = left index.")
lines.append("")

lines.append("## Corpus totals")
lines.append("")
lines.append("| n | observed types | total occurrences |")
lines.append("|---:|---:|---:|")

for n, rows in datasets.items():
    lines.append(
        f"| {n} | {len(rows):,} | {total(rows):,} |"
    )

lines.append("")
lines.append("## Number of n-grams needed for cumulative occurrence coverage")
lines.append("")
lines.append("| coverage | bigrams | trigrams | 4-grams |")
lines.append("|---:|---:|---:|---:|")

for threshold in [0.50, 0.75, 0.90, 0.95, 0.99]:
    values = [
        coverage_count(datasets[n], threshold)[0]
        for n in [2, 3, 4]
    ]

    lines.append(
        f"| {threshold:.0%} | "
        f"{values[0]:,} | {values[1]:,} | {values[2]:,} |"
    )

lines.append("")
lines.append("## Top-N occurrence coverage")
lines.append("")
lines.append("| top N | bigrams | trigrams | 4-grams |")
lines.append("|---:|---:|---:|---:|")

for n_top in [10, 25, 50, 100, 200, 500, 1000]:
    vals = []

    for gram_size in [2, 3, 4]:
        rows = datasets[gram_size]
        if n_top <= len(rows):
            vals.append(pct(top_n_share(rows, n_top)))
        else:
            vals.append("—")

    lines.append(
        f"| {n_top:,} | {vals[0]} | {vals[1]} | {vals[2]} |"
    )

lines.append("")
lines.append("## Bigram movement classes")
lines.append("")
lines.append("| movement | occurrence share |")
lines.append("|---|---:|")

movement_order = [
    "alternate_hands",
    "same_hand_different_fingers",
    "same_finger_different_key",
    "same_key",
]

for movement in movement_order:
    lines.append(
        f"| {movement} | "
        f"{pct(movement_counts[movement] / bigram_total)} |"
    )

lines.append("")
lines.append(
    f"Cross-row bigrams: **{pct(row_change_count / bigram_total)}**"
)
lines.append("")

lines.append("## Highest-frequency same-finger / different-key transitions")
lines.append("")
lines.append(
    "| SF rank | overall rank | bigram | finger | "
    "share of same-finger mass | share of all bigram mass |"
)
lines.append("|---:|---:|:---:|---|---:|---:|")

for rank, (bg, count) in enumerate(same_finger[:30], 1):
    lines.append(
        f"| {rank} | {bigram_rank[bg]} | `{bg}` | "
        f"{finger_id(bg[0])} | "
        f"{pct(count / same_finger_total)} | "
        f"{pct(count / bigram_total)} |"
    )

lines.append("")
lines.append("## Bigram movement represented by common longer chunks")
lines.append("")
lines.append(
    "This measures the union of adjacent bigram transition TYPES appearing "
    "inside the most frequent longer chunks, then sums the real-world "
    "bigram occurrence mass represented by those transition types."
)
lines.append("")
lines.append("| source chunks | top N | unique transitions | bigram mass represented |")
lines.append("|---|---:|---:|---:|")

for label, rows in [
    ("trigrams", trigrams),
    ("4-grams", fourgrams),
]:
    for n_top in [100, 250, 500, 1000]:
        types, share = chunk_transition_coverage(rows, n_top)

        lines.append(
            f"| {label} | {n_top:,} | "
            f"{types:,} | {pct(share)} |"
        )

lines.append("")
lines.append("## Top trigrams")
lines.append("")
lines.append("| rank | trigram | share |")
lines.append("|---:|:---:|---:|")

tri_total = total(trigrams)

for rank, (gram, count) in enumerate(trigrams[:25], 1):
    lines.append(
        f"| {rank} | `{gram}` | {pct(count / tri_total)} |"
    )

lines.append("")
lines.append("## Top 4-grams")
lines.append("")
lines.append("| rank | 4-gram | share |")
lines.append("|---:|:---:|---:|")

four_total = total(fourgrams)

for rank, (gram, count) in enumerate(fourgrams[:25], 1):
    lines.append(
        f"| {rank} | `{gram}` | {pct(count / four_total)} |"
    )

lines.append("")
lines.append("## Generated tables")
lines.append("")
lines.append("- `tables/bigrams_enriched.csv`")
lines.append("- `tables/same_finger_transitions.csv`")
lines.append("- `tables/top_bigrams.csv`")
lines.append("- `tables/top_trigrams.csv`")
lines.append("- `tables/top_4grams.csv`")
lines.append("")

report_path = OUT / "report.md"
report_path.write_text("\n".join(lines), encoding="utf-8")

print(f"Wrote {report_path}")
print()
print("Corpus totals:")
for n, rows in datasets.items():
    print(
        f"  {n}-grams: "
        f"{len(rows):,} types / "
        f"{total(rows):,} occurrences"
    )

print()
print("Same-finger/different-key share:",
      pct(same_finger_total / bigram_total))

print("Cross-row share:",
      pct(row_change_count / bigram_total))

print()
print("Top 15 same-finger transitions:")
for rank, (bg, count) in enumerate(same_finger[:15], 1):
    print(
        f"  {rank:2}. {bg} "
        f"overall=#{bigram_rank[bg]:3} "
        f"same-finger={pct(count / same_finger_total)}"
    )

print()
print(f"Full report: {report_path}")
