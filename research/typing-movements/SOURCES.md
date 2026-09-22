# Typing Movement Research — Sources

## Norvig / Google Books letter n-grams

Peter Norvig, "English Letter Frequency Counts: Mayzner Revisited"

https://www.norvig.com/mayzner.html

Data mirrored in Norvig's pytudes repository:

https://github.com/norvig/pytudes/tree/main/data/ngrams

We currently use:

- ngrams2.tsv
- ngrams3.tsv
- ngrams4.tsv

The `*/*` column is the total occurrence count for each n-gram.

Norvig's processing combines capitalization and restricts the source word list
to alphabetic A-Z entries, so this corpus represents within-word letter
movement, not punctuation, spaces, Shift usage, or cross-word movement.

## Norvig web corpus

Older frequency data derived from Google's Web Trillion Word Corpus:

https://www.norvig.com/ngrams/

Files:

- count_2l.txt
- count_3l.txt

Useful as an independent corpus comparison.

## Norvig Google Books word counts

https://www.norvig.com/google-books-common-words.txt

Useful for finding real words containing target movements and for constructing
frequency-weighted drills.

## SUBTLEX-US

Brysbaert & New, American English subtitle frequencies.

https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus

Approximately 51 million word tokens; useful as a conversational/everyday
English counterweight to Google Books.

The download script fetches the 74,286-word text distribution.
