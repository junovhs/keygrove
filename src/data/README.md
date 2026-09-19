# Data banks

- `words.json` — ~7 000 common English words (2–9 letters, a–z only), in frequency order, filtered against the SCOWL `american-english` dictionary to drop acronyms and proper nouns, then extended with every 3–6 letter SCOWL word spelled from the home row + G/H so the first grove has enough vocabulary. Derived from
  [first20hours/google-10000-english](https://github.com/first20hours/google-10000-english)
  (Google Web Trillion Word Corpus subset, cleaned by Josh Kaufman). Its README permits educational and
  personal use; **for a commercial release, replace with a permissively licensed list** (e.g. a SCOWL/wordfreq
  derivative) — the generator only needs an ordered array of lowercase words.
- `top200.json` — the first 200 entries of the same list, used by the Flow grove.
- `sentences.json`, `quotes.json`, `code.json` — hand-authored for Keygrove (public domain / pangrams).
