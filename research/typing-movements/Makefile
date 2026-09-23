.RECIPEPREFIX := >

.PHONY: all download verify analyze export clean-results sources

all: download analyze

download:
>./scripts/download_data.sh

# The corpora in raw/ must match the pinned SHA256SUMS.txt; a mismatch means the sources changed upstream.
verify:
>sha256sum --check --strict --quiet SHA256SUMS.txt

# Every current analysis, in dependency order (build_candidates reads the cross-corpus tables). Idempotent: a second run
# leaves outputs/ unchanged. The archived v1 atlas (scripts/archive/) is deliberately not run.
analyze: verify
>python3 ./scripts/analyze_norvig.py
>python3 ./scripts/analyze_cross_corpus.py
>python3 ./scripts/build_movement_atlas_v2.py
>python3 ./scripts/analyze_trigram_gestures.py
>python3 ./scripts/build_candidates.py

export:
>python3 ./scripts/export_movements.py

clean-results:
>rm -rf outputs
>mkdir -p outputs/tables

sources:
>@find raw -type f -maxdepth 3 -printf '%p\n' 2>/dev/null | sort
