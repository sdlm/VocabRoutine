# Part-of-speech triage for NGSL lemmas

VocabRoutine teaches English words to Russian speakers. Its dictionary keeps only nouns, verbs, adjectives and adverbs from the NGSL 1.2 list. You decide which lemmas stay and with which part of speech.

## Input and output

- Input: the JSON file named in your task, `[{"lemma": "...", "rank": N}]`.
- Output: write the JSON file named in your task: `[{"lemma": "...", "pos": ..., "doubt": ..., "reason": "..."}]`, one entry per input lemma, in the same order, `lemma` exactly as given.
- Write valid JSON only: double quotes, no comments, no trailing commas.
- Reply with one line: `<N> lemmas, <M> dropped, <K> doubtful`.

## Rules

- `pos` is the word's most frequent use in general modern English: `"noun"`, `"verb"`, `"adjective"`, `"adverb"`, or `null`.
- `null` when the most frequent use is anything else: article, determiner, pronoun, preposition, conjunction, modal verb, number, interjection, discourse marker. So `the`, `of`, `that`, `one`, `can`, `will`, `must`, `I`, `yeah`, `hello`, `please` are `null`, even when a rare noun or verb use exists (`can` = tin, `will` = testament).
- `be`, `have`, `do`, `get` and other verbs that also work as auxiliaries are verbs.
- `doubt` is `true` when two readings are close in frequency or the choice is debatable (`up`, `out`, `so`, `still`, `well`, `right`, `like`); otherwise `false`.
- `reason` is a short English explanation. It is required when `pos` is `null` or `doubt` is `true`; otherwise it is `""`.

## Example

```json
[
  { "lemma": "the", "pos": null, "doubt": false, "reason": "article" },
  { "lemma": "house", "pos": "noun", "doubt": false, "reason": "" },
  { "lemma": "up", "pos": "adverb", "doubt": true, "reason": "mostly an adverb particle, also a preposition" }
]
```
