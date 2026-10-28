# Part-of-speech triage for NGSL lemmas

VocabRoutine teaches English words to Russian speakers. Its dictionary keeps content words, prepositions, subordinating conjunctions and some pronouns from the NGSL 1.2 list. You decide which lemmas stay and with which part of speech.

## Input and output

- Input: the JSON file named in your task, `[{"lemma": "...", "rank": N}]`.
- Output: write the JSON file named in your task: `[{"lemma": "...", "pos": ..., "doubt": ..., "reason": "..."}]`, one entry per input lemma, in the same order, `lemma` exactly as given.
- Write valid JSON only: double quotes, no comments, no trailing commas.
- Reply with one line: `<N> lemmas, <M> dropped, <K> doubtful`.

## Rules

- `pos` is the word's most frequent use in general modern English: `"noun"`, `"verb"`, `"adjective"`, `"adverb"`, `"preposition"`, `"conjunction"`, `"pronoun"`, or `null`.
- The 30 most frequent lemmas are dropped by a script whatever you answer. Classify them anyway.

### Dropped: `pos` is `null`

The most frequent use of the word belongs to one of these groups, even when a rarer content use exists:

| Group | Examples |
|---|---|
| articles | `the`, `a` |
| modal verbs | `can`, `will`, `would`, `could`, `must`, `should`, `may`, `might`, `shall`, `ought` (`can` = tin and `will` = testament are rare) |
| numbers, cardinal and ordinal | `one`, `hundred`, `first`, `second`, `last`, `next` (`second` = unit of time and `last` = continue are less frequent) |
| interjections and politeness words | `yes`, `yeah`, `oh`, `hi`, `hello`, `please`, `sorry`, `okay`, `alright`, `thank`, `welcome` |
| personal and possessive pronouns | `I`, `you`, `he`, `she`, `it`, `we`, `they`, `mine` |
| reflexive pronouns | `myself`, `yourself`, `himself`, `herself`, `itself`, `ourselves`, `themselves` |
| demonstratives | `this`, `that` |
| question and relative words | `what`, `who`, `which`, `when`, `where`, `why`, `how`, `whatever`, `whenever`, `wherever` |
| coordinating conjunctions | `and`, `but`, `or`, `nor` |
| existential `there` | `there` (`there is`) |

### Kept

| Group | `pos` | Examples |
|---|---|---|
| prepositions | `preposition` | `between`, `under`, `during`, `across`, `against`, `despite`, `throughout`, `beside`, `among`, `within`, `without`, `beyond`, `via`, `per` |
| subordinating conjunctions | `conjunction` | `although`, `unless`, `whether`, `because`, `if`, `since`, `until`, `whereas`, `while`, `though`, `once`, `than` |
| indefinite pronouns | `pronoun` | `everybody`, `somebody`, `anyone`, `something`, `nothing`, `none` |
| quantifiers and determiners | `pronoun` | `all`, `some`, `any`, `no`, `each`, `every`, `both`, `either`, `neither`, `another`, `such`, `few`, `many`, `much`, `several`, `enough` |
| quantity nouns | `noun` | `dozen`, `half`, `couple` |
| linking and sentence adverbs | `adverb` | `however`, `moreover`, `furthermore`, `nevertheless`, `anyway`, `hopefully` |
| adverb particles | `adverb` or `preposition`, whichever use is more frequent | `up`, `out`, `down`, `off`, `back`, `around`, `over`, `about` |
| everything else | `noun`, `verb`, `adjective` or `adverb` | `house`, `find`, `happy`, `quickly` |

- `when` and `where` are question words even when they join clauses: `null`.
- `more`, `most`, `less`, `least` take their most frequent use: `pronoun` or `adverb`.
- `be`, `have`, `do`, `get` and other verbs that also work as auxiliaries are verbs.
- A frequent discourse-marker use does not drop a word that also has a common content use: `like` → verb, `well` → adverb, `right` → adjective, `so` → adverb.
- When unsure whether to keep or drop a word, keep it with its likeliest part of speech and set `doubt: true`.
- `doubt` is `true` when keeping or dropping the word is debatable, or when two of the seven parts of speech are about equally frequent (`up`, `out`, `so`, `still`, `well`, `right`, `like`, `more`). An ordinary noun/verb word such as `work` or `change` is not doubtful: pick the more frequent use. Otherwise `false`.
- `reason` is a short English explanation. It is required when `pos` is `null` or `doubt` is `true`; otherwise it is `""`.

## Example

```json
[
  { "lemma": "the", "pos": null, "doubt": false, "reason": "article" },
  { "lemma": "house", "pos": "noun", "doubt": false, "reason": "" },
  { "lemma": "between", "pos": "preposition", "doubt": false, "reason": "" },
  { "lemma": "everybody", "pos": "pronoun", "doubt": false, "reason": "" },
  { "lemma": "up", "pos": "adverb", "doubt": true, "reason": "mostly an adverb particle, also a preposition" }
]
```
