#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RAW="$ROOT/raw"

mkdir -p \
  "$RAW/norvig-books" \
  "$RAW/norvig-web" \
  "$RAW/subtlex-us"

download() {
    local url="$1"
    local dest="$2"

    if [[ -s "$dest" ]]; then
        echo "exists: $dest"
        return
    fi

    echo "download: $url"
    curl \
      --fail \
      --location \
      --retry 4 \
      --retry-delay 2 \
      --output "$dest" \
      "$url"
}

BASE="https://raw.githubusercontent.com/norvig/pytudes/main/data/ngrams"

download \
  "$BASE/ngrams2.tsv" \
  "$RAW/norvig-books/ngrams2.tsv"

download \
  "$BASE/ngrams3.tsv" \
  "$RAW/norvig-books/ngrams3.tsv"

download \
  "$BASE/ngrams4.tsv" \
  "$RAW/norvig-books/ngrams4.tsv"

download \
  "https://www.norvig.com/google-books-common-words.txt" \
  "$RAW/norvig-books/google-books-common-words.txt"

download \
  "https://www.norvig.com/ngrams/count_2l.txt" \
  "$RAW/norvig-web/count_2l.txt"

download \
  "https://www.norvig.com/ngrams/count_3l.txt" \
  "$RAW/norvig-web/count_3l.txt"

SUBTLEX_ZIP="$RAW/subtlex-us/subtlexus2.zip"

download \
  "https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus/subtlexus2.zip" \
  "$SUBTLEX_ZIP"

if command -v unzip >/dev/null 2>&1; then
    mkdir -p "$RAW/subtlex-us/extracted"
    unzip -o "$SUBTLEX_ZIP" \
      -d "$RAW/subtlex-us/extracted" >/dev/null || {
        echo "warning: SUBTLEX archive extraction failed; zip retained"
    }
fi

echo
echo "SHA256:"
find "$RAW" -type f ! -name SHA256SUMS.txt -print0 \
  | sort -z \
  | xargs -0 sha256sum \
  | tee "$RAW/SHA256SUMS.txt"

echo
echo "Downloaded files:"
du -h "$RAW"/*/* 2>/dev/null | sort -h
