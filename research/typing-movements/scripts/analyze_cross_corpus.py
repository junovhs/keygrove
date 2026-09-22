#!/usr/bin/env python3
"""Cross-corpus stability of within-word letter movements (DEC-16).

Ranks bigrams, same-finger transitions and trigram gestures across three
corpora and classifies each by how well its rank holds:

- Google Books (Norvig, "Mayzner revisited"): raw/norvig-books/ngrams{2,3}.tsv
- Norvig web (Google Web Trillion Word Corpus): raw/norvig-web/count_{2,3}l.txt
- SUBTLEX-US (film subtitles): raw/subtlex-us/extracted/SUBTLEXus74286wordstextversion.txt

SUBTLEX-US ships word frequencies, not letter n-grams, so its n-gram counts
are DERIVED here: every alphabetic word contributes its within-word bigrams
and trigrams, weighted by the word's token frequency (FREQcount). That is a
word-list derivation, not running text — the same shape as Norvig's Google
Books tables, which were also built from the books word list.

No composite difficulty score. Movement classes are reported side by side.
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

OUT.mkdir(parents=True, exist_ok=True)
TABLES.mkdir(parents=True, exist_ok=True)

BOOKS_2 = RAW / "norvig-books" / "ngrams2.tsv"
BOOKS_3 = RAW / "norvig-books" / "ngrams3.tsv"
WEB_2 = RAW / "norvig-web" / "count_2l.txt"
WEB_3 = RAW / "norvig-web" / "count_3l.txt"
SUBTLEX = RAW / "subtlex-us" / "extracted" / "SUBTLEXus74286wordstextversion.txt"

CORPORA = ["books", "web", "subtlex"]
CORPUS_LABEL = {
    "books": "Google Books",
    "web": "Norvig web",
    "subtlex": "SUBTLEX-US",
}
LEANING = {
    "books": "book-leaning",
    "web": "web-leaning",
    "subtlex": "conversational-leaning",
}

# Stability cut-offs (top-N membership per corpus).
BIGRAM_N = 200
TRIGRAM_N = 500
SAME_FINGER_N = 30

# Book-artefact test: Google Books top-N_IN that fall outside top-N_OUT
# in either other corpus.
ARTEFACT_IN = 200
ARTEFACT_OUT = 300

GESTURE_EXAMPLES = ["ion", "ing", "nce", "ted", "ded", "olo", "mu", "um"]


# ---------------------------------------------------------------------------
# Keyboard model — Traditional US QWERTY touch typing, B = left index
# (identical to analyze_norvig.py / analyze_trigram_gestures.py)
# ---------------------------------------------------------------------------

KEYS: dict[str, dict] = {}


def put(chars: str, y: float, stagger: float):
    for i, ch in enumerate(chars):
        KEYS[ch] = {"x": i + stagger, "y": y}


put("qwertyuiop", 0.0, 0.00)
put("asdfghjkl;", 1.0, 0.25)
put("zxcvbnm", 2.0, 0.75)

FINGER: dict[str, tuple[str, str]] = {}

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

OUTERNESS = {"index": 0, "middle": 1, "ring": 2, "pinky": 3}


def fid(ch: str) -> tuple[str, str]:
    return FINGER[ch]


def finger_label(ch: str) -> str:
    hand, finger = fid(ch)
    return f"{hand}-{finger}"


def dist(a: str, b: str) -> float:
    A, B = KEYS[a], KEYS[b]
    return math.hypot(B["x"] - A["x"], B["y"] - A["y"])


MOVEMENT_CLASSES = [
    "alternate_hands",
    "same_hand_different_fingers",
    "same_finger_different_key",
    "same_key",
]


def classify_bigram(bg: str) -> str:
    a, b = bg
    if a == b:
        return "same_key"
    if fid(a) == fid(b):
        return "same_finger_different_key"
    if fid(a)[0] != fid(b)[0]:
        return "alternate_hands"
    return "same_hand_different_fingers"


def same_finger_pair(a: str, b: str) -> bool:
    return a != b and fid(a) == fid(b)


def same_finger_transition_count(tri: str) -> int:
    return sum(same_finger_pair(tri[i], tri[i + 1]) for i in range(2))


def row_changes(tri: str) -> int:
    return sum(KEYS[tri[i]]["y"] != KEYS[tri[i + 1]]["y"] for i in range(2))


def three_finger_same_hand_shape(tri: str):
    hands = [fid(ch)[0] for ch in tri]
    fingers = [fid(ch)[1] for ch in tri]
    if len(set(hands)) != 1 or len(set(fingers)) != 3:
        return None
    vals = [OUTERNESS[f] for f in fingers]
    d1, d2 = vals[1] - vals[0], vals[2] - vals[1]
    if d1 > 0 and d2 > 0:
        return "outward_roll"
    if d1 < 0 and d2 < 0:
        return "inward_roll"
    return "redirect"


GESTURE_FEATURES = [
    ("contains_same_finger", lambda t: same_finger_transition_count(t) >= 1),
    ("same_finger_chain", lambda t: same_finger_transition_count(t) == 2),
    ("redirect", lambda t: three_finger_same_hand_shape(t) == "redirect"),
    ("double_row_change", lambda t: row_changes(t) == 2),
]


def gesture_tags(tri: str) -> str:
    return ",".join(name for name, pred in GESTURE_FEATURES if pred(tri))


# ---------------------------------------------------------------------------
# Corpus loaders — each returns {ngram: count} over lowercase A–Z only
# ---------------------------------------------------------------------------


def load_books(path: Path, n: int) -> dict[str, int]:
    counts: dict[str, int] = {}
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        header = next(reader)
        ci = header.index("*/*")
        for row in reader:
            if not row:
                continue
            gram = row[0].strip().lower()
            if len(gram) != n or not gram.isalpha() or not gram.isascii():
                continue
            counts[gram] = counts.get(gram, 0) + int(row[ci])
    return counts


def load_web(path: Path, n: int) -> dict[str, int]:
    counts: dict[str, int] = {}
    with path.open(encoding="utf-8") as f:
        for line in f:
            parts = line.split()
            if len(parts) != 2:
                continue
            gram = parts[0].lower()
            if len(gram) != n or not gram.isalpha() or not gram.isascii():
                continue
            counts[gram] = counts.get(gram, 0) + int(parts[1])
    return counts


def load_subtlex_words(path: Path) -> tuple[Counter, int, int]:
    """Token-weighted, case-folded alphabetic word counts.

    Returns (counts, words_kept, words_dropped)."""
    counts: Counter = Counter()
    kept = dropped = 0
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            word = row["Word"].strip().lower()
            if not word.isalpha() or not word.isascii():
                dropped += 1
                continue
            counts[word] += int(row["FREQcount"])
            kept += 1
    return counts, kept, dropped


def derive_ngrams(words: Counter, n: int) -> dict[str, int]:
    counts: Counter = Counter()
    for word, freq in words.items():
        for i in range(len(word) - n + 1):
            counts[word[i : i + n]] += freq
    return dict(counts)


# ---------------------------------------------------------------------------
# Ranking and stability
# ---------------------------------------------------------------------------


class Ranked:
    def __init__(self, counts: dict[str, int]):
        self.rows = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
        self.count = dict(self.rows)
        self.total = sum(counts.values())
        self.rank = {g: r for r, (g, _) in enumerate(self.rows, 1)}

    def share(self, gram: str) -> float:
        return self.count.get(gram, 0) / self.total

    def restrict(self, predicate) -> "Ranked":
        return Ranked({g: c for g, c in self.rows if predicate(g)})


def stability_class(ranks: dict[str, int | None], n: int) -> tuple[str, str]:
    """Returns (class, missing_from).

    universal              top-N in all three corpora
    <corpus>-leaning       top-N in exactly one corpus
    unstable               top-N in exactly two (missing_from names the third)
    below-cut              top-N in none
    """
    inside = [c for c in CORPORA if ranks[c] is not None and ranks[c] <= n]
    outside = [c for c in CORPORA if c not in inside]
    if len(inside) == 3:
        return "universal", ""
    if len(inside) == 1:
        return LEANING[inside[0]], ",".join(outside)
    if len(inside) == 2:
        return "unstable", outside[0]
    return "below-cut", ",".join(outside)


def spread(ranks: dict[str, int | None]) -> int | None:
    vals = [r for r in ranks.values() if r is not None]
    if len(vals) < 3:
        return None
    return max(vals) - min(vals)


def fmt_rank(r) -> str:
    return "—" if r is None else str(r)


def pct(x: float, digits: int = 3) -> str:
    return f"{100 * x:.{digits}f}%"


def sha_ok() -> bool | None:
    """Best-effort check that raw/ still matches raw/SHA256SUMS.txt.

    The manifest records paths as written by download_data.sh (absolute,
    from whichever checkout ran it); each entry is resolved by its
    raw-relative suffix so the check works from any checkout."""
    import hashlib

    sums = RAW / "SHA256SUMS.txt"
    if not sums.exists():
        return None
    for line in sums.read_text().splitlines():
        parts = line.split(maxsplit=1)
        if len(parts) != 2:
            continue
        digest, path = parts
        _, _, rel = path.replace("\\", "/").rpartition("/raw/")
        p = RAW / (rel or path)
        if not p.exists():
            return False
        h = hashlib.sha256()
        with p.open("rb") as f:
            for chunk in iter(lambda: f.read(1 << 20), b""):
                h.update(chunk)
        if h.hexdigest() != digest:
            return False
    return True


# ---------------------------------------------------------------------------
# Load everything
# ---------------------------------------------------------------------------

subtlex_words, subtlex_kept, subtlex_dropped = load_subtlex_words(SUBTLEX)
subtlex_tokens = sum(subtlex_words.values())

bigrams = {
    "books": Ranked(load_books(BOOKS_2, 2)),
    "web": Ranked(load_web(WEB_2, 2)),
    "subtlex": Ranked(derive_ngrams(subtlex_words, 2)),
}
trigrams = {
    "books": Ranked(load_books(BOOKS_3, 3)),
    "web": Ranked(load_web(WEB_3, 3)),
    "subtlex": Ranked(derive_ngrams(subtlex_words, 3)),
}
same_finger = {
    c: r.restrict(lambda g: classify_bigram(g) == "same_finger_different_key")
    for c, r in bigrams.items()
}


def ranks_for(tables: dict[str, Ranked], gram: str) -> dict[str, int | None]:
    return {c: tables[c].rank.get(gram) for c in CORPORA}


def union_grams(tables: dict[str, Ranked]) -> list[str]:
    grams = set()
    for r in tables.values():
        grams.update(r.count)
    # Order by best rank across corpora, then books rank, then alphabetically.
    return sorted(
        grams,
        key=lambda g: (
            min(r for r in ranks_for(tables, g).values() if r is not None),
            tables["books"].rank.get(g, 10**9),
            g,
        ),
    )


# ---------------------------------------------------------------------------
# Per-corpus movement-class and gesture-feature shares
# ---------------------------------------------------------------------------

movement_share = {
    c: {
        m: sum(cnt for g, cnt in r.rows if classify_bigram(g) == m) / r.total
        for m in MOVEMENT_CLASSES
    }
    for c, r in bigrams.items()
}

gesture_share = {
    c: {
        name: sum(cnt for g, cnt in r.rows if pred(g)) / r.total
        for name, pred in GESTURE_FEATURES
    }
    for c, r in trigrams.items()
}

# ---------------------------------------------------------------------------
# CSV tables
# ---------------------------------------------------------------------------


def write_cross_csv(filename: str, tables: dict[str, Ranked], n: int, extra=None):
    with (TABLES / filename).open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        header = ["ngram"]
        for c in CORPORA:
            header += [f"rank_{c}", f"share_{c}"]
        header += ["rank_spread", "stability_class", "missing_from"]
        if extra:
            header += [extra[0]]
        w.writerow(header)
        for g in union_grams(tables):
            ranks = ranks_for(tables, g)
            cls, missing = stability_class(ranks, n)
            row = [g]
            for c in CORPORA:
                row += [ranks[c] if ranks[c] is not None else "", f"{tables[c].share(g):.8f}"]
            sp = spread(ranks)
            row += [sp if sp is not None else "", cls, missing]
            if extra:
                row += [extra[1](g)]
            w.writerow(row)


write_cross_csv("bigrams_cross_corpus.csv", bigrams, BIGRAM_N, ("movement_class", classify_bigram))
write_cross_csv("trigrams_cross_corpus.csv", trigrams, TRIGRAM_N, ("gesture_tags", gesture_tags))
write_cross_csv(
    "same_finger_cross_corpus.csv",
    same_finger,
    SAME_FINGER_N,
    ("finger", lambda g: finger_label(g[0])),
)

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------


def artefact_set(tables: dict[str, Ranked]) -> list[tuple[str, dict]]:
    out = []
    for g, _ in tables["books"].rows[:ARTEFACT_IN]:
        ranks = ranks_for(tables, g)
        if any(ranks[c] is None or ranks[c] > ARTEFACT_OUT for c in ("web", "subtlex")):
            out.append((g, ranks))
    return out


def class_counts(tables: dict[str, Ranked], n: int, top_by_books: int) -> Counter:
    counter: Counter = Counter()
    for g, _ in tables["books"].rows[:top_by_books]:
        counter[stability_class(ranks_for(tables, g), n)[0]] += 1
    return counter


L: list[str] = []
add = L.append

add("# Cross-Corpus Stability")
add("")
add("Do the movements that Google Books ranks highly hold their rank in other")
add("English? DEC-16 promotes a target to curriculum candidate only when it")
add("is stable across corpora; this report supplies that evidence.")
add("")
add("Keyboard model: Traditional US QWERTY, B = left index. No composite")
add("difficulty score; every class is reported side by side.")
add("")
add("## Corpora")
add("")
add("| corpus | source | bigram types / tokens | trigram types / tokens |")
add("|---|---|---:|---:|")
add(
    "| Google Books | Norvig `ngrams2/3.tsv` (Mayzner revisited) | "
    f"{len(bigrams['books'].rows):,} / {bigrams['books'].total:,} | "
    f"{len(trigrams['books'].rows):,} / {trigrams['books'].total:,} |"
)
add(
    "| Norvig web | `count_2l.txt` / `count_3l.txt` (Google Web Trillion Word Corpus) | "
    f"{len(bigrams['web'].rows):,} / {bigrams['web'].total:,} | "
    f"{len(trigrams['web'].rows):,} / {trigrams['web'].total:,} |"
)
add(
    "| SUBTLEX-US | derived from word frequencies (see below) | "
    f"{len(bigrams['subtlex'].rows):,} / {bigrams['subtlex'].total:,} | "
    f"{len(trigrams['subtlex'].rows):,} / {trigrams['subtlex'].total:,} |"
)
add("")
add("### SUBTLEX-US derivation and caveat")
add("")
add("SUBTLEX-US (Brysbaert & New) distributes word frequencies from ~51M")
add("tokens of American film and TV subtitles, not letter n-grams. The n-gram")
add("counts here are **derived**: each word is lower-cased, kept only if it is")
add("entirely A–Z (matching Norvig's alphabetic restriction), and every")
add("within-word bigram and trigram it contains is counted once per token,")
add(f"weighted by the word's `FREQcount`. {subtlex_kept:,} word entries were")
add(f"kept ({subtlex_tokens:,} tokens); {subtlex_dropped:,} non-alphabetic")
add("entries were dropped.")
add("")
add("**Caveat:** this is a word-list derivation, not running text. It carries")
add("no information about spaces, punctuation, capitals or cross-word")
add("movement, and it inherits SUBTLEX's tokenisation (contractions arrive")
add("split at the apostrophe — `don't` counts as `don` + `t` — so their")
add("fragments inflate short entries and `n't`/`'ll` bigrams never appear). Norvig's")
add("Google Books tables were built the same way from the books word list, so")
add("the two are comparable; the Norvig web counts come from a different")
add("pipeline over the trillion-word corpus.")
add("")
add("### Stability classes")
add("")
add(f"Membership in the top-N of each corpus (bigrams N = {BIGRAM_N}, trigrams")
add(f"N = {TRIGRAM_N}, same-finger transitions N = {SAME_FINGER_N} within the")
add("same-finger sub-ranking of that corpus):")
add("")
add("| class | meaning |")
add("|---|---|")
add("| `universal` | top-N in all three corpora — the only class DEC-16 lets us promote |")
add("| `book-leaning` / `web-leaning` / `conversational-leaning` | top-N in exactly that one corpus |")
add("| `unstable` | top-N in two corpora, drops out of the third (`missing_from` names it) |")
add("| `below-cut` | top-N in none (CSV only) |")
add("")
add("`rank_spread` = max rank − min rank across the three corpora.")
add("")

# --- movement class shares ---------------------------------------------------
add("## Bigram movement classes per corpus")
add("")
add("| movement | " + " | ".join(CORPUS_LABEL[c] for c in CORPORA) + " |")
add("|---|" + "---:|" * len(CORPORA))
for m in MOVEMENT_CLASSES:
    add(f"| {m} | " + " | ".join(pct(movement_share[c][m]) for c in CORPORA) + " |")
add("")
add("## Trigram gesture features per corpus")
add("")
add("| feature | " + " | ".join(CORPUS_LABEL[c] for c in CORPORA) + " |")
add("|---|" + "---:|" * len(CORPORA))
for name, _ in GESTURE_FEATURES:
    add(f"| {name} | " + " | ".join(pct(gesture_share[c][name]) for c in CORPORA) + " |")
add("")

# --- class summary -----------------------------------------------------------
add("## How much of the Google Books ranking survives")
add("")
add("| set | universal | book-leaning | web-leaning | conversational-leaning | unstable |")
add("|---|---:|---:|---:|---:|---:|")
for label, tables, n, top in [
    (f"Google Books top-{BIGRAM_N} bigrams", bigrams, BIGRAM_N, BIGRAM_N),
    (f"Google Books top-{TRIGRAM_N} trigrams", trigrams, TRIGRAM_N, TRIGRAM_N),
    (f"Google Books top-{SAME_FINGER_N} same-finger transitions", same_finger, SAME_FINGER_N, SAME_FINGER_N),
]:
    cc = class_counts(tables, n, top)
    add(
        f"| {label} | {cc['universal']} | {cc['book-leaning']} | {cc['web-leaning']} | "
        f"{cc['conversational-leaning']} | {cc['unstable']} |"
    )
add("")

# --- same-finger table -------------------------------------------------------
add(f"## Top-{SAME_FINGER_N} same-finger transitions across corpora")
add("")
add("Ranks are positions within each corpus's same-finger sub-list; overall")
add("bigram rank in Google Books is shown for reference.")
add("")
add("| SF rank (books) | overall (books) | bigram | finger | SF rank (web) | SF rank (subtlex) | spread | class | missing from |")
add("|---:|---:|:---:|---|---:|---:|---:|---|---|")
for g, _ in same_finger["books"].rows[:SAME_FINGER_N]:
    ranks = ranks_for(same_finger, g)
    cls, missing = stability_class(ranks, SAME_FINGER_N)
    add(
        f"| {ranks['books']} | {bigrams['books'].rank[g]} | `{g}` | {finger_label(g[0])} | "
        f"{fmt_rank(ranks['web'])} | {fmt_rank(ranks['subtlex'])} | "
        f"{fmt_rank(spread(ranks))} | {cls} | {missing or '—'} |"
    )
add("")
add("Same-finger transitions that reach the top-" + str(SAME_FINGER_N) + " in web or")
add("SUBTLEX-US but not in Google Books:")
add("")
newcomers = []
for c in ("web", "subtlex"):
    for g, _ in same_finger[c].rows[:SAME_FINGER_N]:
        rb = same_finger["books"].rank.get(g)
        if (rb is None or rb > SAME_FINGER_N) and g not in [x for x, _ in newcomers]:
            newcomers.append((g, ranks_for(same_finger, g)))
if newcomers:
    add("| bigram | finger | SF rank (books) | SF rank (web) | SF rank (subtlex) | class |")
    add("|:---:|---|---:|---:|---:|---|")
    for g, ranks in newcomers:
        add(
            f"| `{g}` | {finger_label(g[0])} | {fmt_rank(ranks['books'])} | "
            f"{fmt_rank(ranks['web'])} | {fmt_rank(ranks['subtlex'])} | "
            f"{stability_class(ranks, SAME_FINGER_N)[0]} |"
        )
else:
    add("_none_")
add("")

# --- book artefact sets ------------------------------------------------------
add(f"## Book-artefact bigrams")
add("")
add(f"Google Books top-{ARTEFACT_IN} bigrams that fall outside the top-{ARTEFACT_OUT}")
add("in either other corpus.")
add("")
ba = artefact_set(bigrams)
if ba:
    add("| bigram | movement | rank books | rank web | rank subtlex |")
    add("|:---:|---|---:|---:|---:|")
    for g, ranks in ba:
        add(
            f"| `{g}` | {classify_bigram(g)} | {ranks['books']} | "
            f"{fmt_rank(ranks['web'])} | {fmt_rank(ranks['subtlex'])} |"
        )
else:
    add(f"_none — every Google Books top-{ARTEFACT_IN} bigram is inside the")
    add(f"top-{ARTEFACT_OUT} of both other corpora._")
add("")
add("Largest rank spreads inside the Google Books top-" + str(BIGRAM_N) + " bigrams:")
add("")
add("| bigram | movement | rank books | rank web | rank subtlex | spread | class |")
add("|:---:|---|---:|---:|---:|---:|---|")
top_spread = sorted(
    ((g, ranks_for(bigrams, g)) for g, _ in bigrams["books"].rows[:BIGRAM_N]),
    key=lambda gr: -(spread(gr[1]) or 0),
)[:15]
for g, ranks in top_spread:
    add(
        f"| `{g}` | {classify_bigram(g)} | {ranks['books']} | {fmt_rank(ranks['web'])} | "
        f"{fmt_rank(ranks['subtlex'])} | {fmt_rank(spread(ranks))} | "
        f"{stability_class(ranks, BIGRAM_N)[0]} |"
    )
add("")

add(f"## Book-artefact trigrams")
add("")
add(f"Google Books top-{ARTEFACT_IN} trigrams that fall outside the top-{ARTEFACT_OUT}")
add("in either other corpus.")
add("")
ta = artefact_set(trigrams)
if ta:
    add("| trigram | gesture tags | rank books | rank web | rank subtlex |")
    add("|:---:|---|---:|---:|---:|")
    for g, ranks in ta:
        add(
            f"| `{g}` | {gesture_tags(g) or '—'} | {ranks['books']} | "
            f"{fmt_rank(ranks['web'])} | {fmt_rank(ranks['subtlex'])} |"
        )
else:
    add("_none_")
add("")

# --- gesture examples --------------------------------------------------------
add("## Gesture examples")
add("")
add("The named examples from DEC-13 / the trigram gesture atlas, with rank in")
add("each corpus and stability class (bigram examples use the bigram cut,")
add("trigram examples the trigram cut).")
add("")
add("| n-gram | mechanics | rank books | rank web | rank subtlex | spread | class | missing from |")
add("|:---:|---|---:|---:|---:|---:|---|---|")
for g in GESTURE_EXAMPLES:
    if len(g) == 2:
        tables, n, mech = bigrams, BIGRAM_N, classify_bigram(g)
    else:
        tables, n, mech = trigrams, TRIGRAM_N, gesture_tags(g) or "—"
    ranks = ranks_for(tables, g)
    cls, missing = stability_class(ranks, n)
    add(
        f"| `{g}` | {mech} | {fmt_rank(ranks['books'])} | {fmt_rank(ranks['web'])} | "
        f"{fmt_rank(ranks['subtlex'])} | {fmt_rank(spread(ranks))} | {cls} | {missing or '—'} |"
    )
add("")

# --- gesture-feature top lists -----------------------------------------------
for name, pred in GESTURE_FEATURES[1:]:
    add(f"## Top {name.replace('_', ' ')} trigrams across corpora")
    add("")
    add("Ranked by Google Books; ranks shown are overall trigram ranks.")
    add("")
    add("| trigram | rank books | rank web | rank subtlex | spread | class |")
    add("|:---:|---:|---:|---:|---:|---|")
    shown = 0
    for g, _ in trigrams["books"].rows:
        if not pred(g):
            continue
        ranks = ranks_for(trigrams, g)
        add(
            f"| `{g}` | {ranks['books']} | {fmt_rank(ranks['web'])} | "
            f"{fmt_rank(ranks['subtlex'])} | {fmt_rank(spread(ranks))} | "
            f"{stability_class(ranks, TRIGRAM_N)[0]} |"
        )
        shown += 1
        if shown >= 15:
            break
    add("")

# --- integrity ---------------------------------------------------------------
add("## Generated tables")
add("")
add("- `tables/bigrams_cross_corpus.csv`")
add("- `tables/trigrams_cross_corpus.csv`")
add("- `tables/same_finger_cross_corpus.csv`")
add("")
add("## Interpretation boundary")
add("")
add("Stability says a movement is common in every register we have; it says")
add("nothing about how hard it is. Candidate selection (RES-03) reads the")
add("`universal` rows; `unstable` and leaning rows stay visible so that a")
add("register-specific choice is deliberate, never accidental.")
add("")

report_path = OUT / "cross-corpus-stability.md"
report_path.write_text("\n".join(L), encoding="utf-8")

verified = sha_ok()
print(f"Wrote {report_path}")
print(
    "raw/ checksum:",
    {True: "matches SHA256SUMS.txt", False: "MISMATCH", None: "no SHA256SUMS.txt"}[verified],
)
print()
print("Movement classes (books / web / subtlex):")
for m in MOVEMENT_CLASSES:
    print(f"  {m:28} " + "  ".join(pct(movement_share[c][m], 2) for c in CORPORA))
print()
print(f"Book-artefact bigrams:  {len(ba)}")
print(f"Book-artefact trigrams: {len(ta)}")
