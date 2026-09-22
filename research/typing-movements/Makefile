.RECIPEPREFIX := >

.PHONY: all download analyze clean-results sources

all: download analyze

download:
>./scripts/download_data.sh

analyze:
>python3 ./scripts/analyze_norvig.py
>python3 ./scripts/analyze_cross_corpus.py

clean-results:
>rm -rf outputs
>mkdir -p outputs/tables

sources:
>@find raw -type f -maxdepth 3 -printf '%p\n' 2>/dev/null | sort
