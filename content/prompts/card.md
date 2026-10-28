# Dictionary cards for VocabRoutine

VocabRoutine teaches English words to Russian speakers. Each card shows translations, a definition, examples, collocations and similar words, and trains the word in Cloze exercises: a sentence with a gap that the learner fills by typing or by choosing from four words.

## Input and output

- Input: the JSON file named in your task, one item per word:
  `{"word", "pos", "level", "freqRank", "lemmaForms", "errors"?, "previous"?}`.
- Output: write the JSON file named in your task: one object keyed by id (`word` in lower case). Each value has exactly these keys: `forms`, `register`, `translations`, `definition`, `examples`, `collocations`, `similar`, `cloze`. Do not write `id`, `word`, `pos`, `level` or `freqRank`.
- Write one card for every input item, and nothing else.
- Write valid JSON only: double quotes, no comments, no trailing commas.
- An item with `errors` comes back after its `previous` card failed the checks. Fix what the errors name; keep the rest of `previous` unless it is wrong too.
- Three finished cards with their input: `content/prompts/card-examples.json` (a noun, a verb and a preposition). Read it first and match its style and length.

When the file is written, run from the repository root:

```bash
uv run --project content content validate --file <output file>
```

Fix every error it prints and run it again until it prints `all N cards valid`. Reply with that last line only.

If it still prints errors after 3 rounds of fixes, or prints `error:` about anything other than your output file, stop and reply with its last line.

## Fields

- **forms**: every other form of the word for this part of speech, irregular ones included, without the word itself; `[]` when there are none. Nouns: the plural. Verbs: third person, past, past participle, -ing, each once (`find` → `finds`, `found`, `finding`). Adjectives and adverbs: comparative and superlative only when the one-word forms are common (`happy` → `happier`, `happiest`; `reliable` → `[]`). Prepositions, conjunctions and pronouns: `[]`. Letters only, at most one apostrophe.
- **register**: `neutral`, unless the word is clearly `formal` (`purchase`), `informal` (`kid`, `guy`) or `slang`.
- **translations**: 1–4 Russian translations of this part of speech, the most common first. `share` is a whole percentage of how often each meaning occurs; the shares sum to 100.
- **definition**: one English sentence in simple words; avoid the word itself.
- **examples**: 3–4 `{en, ru}`. Natural English sentences of 5–12 words with the word or one of its forms as a separate word (`house's` does not count). When `forms` is not empty, at least one example uses a form other than the word. `ru` is a natural Russian translation, not word for word.
- **collocations**: 3–5 common combinations that contain the word or a form (`buy a house`, `move house`).
- **similar**: 2–3 words that learners confuse with this one, or close synonyms; not words that merely share a topic. `note` is Russian and explains what the similar word means and when to choose which. The app prints `<similar word> — <note>`, so the note never starts with the similar word. The note is longer than 10 characters. A similar word is never the word itself.
- **cloze**: exactly 10 `{en, ru, options}`.
  - `en` has exactly one gap `{{…}}` holding the word or one of its forms. When the word has forms that are not in `lemmaForms`, at least 3 gaps hold such a form; if every form is in `lemmaForms`, all gaps hold the word itself.
  - `lemmaForms` lists other dictionary words that look like forms of this word. Never put any of them in the gap (`find` → no `{{found}}`). Put one in `forms` only if it really is a form of this word (`found` for `find`, but not `teacher` for `teach`); then it may appear in examples. No other dictionary word goes in the gap either: only the word and its own forms.
  - 10 different situations, not rewordings of one; no sentence repeats an example.
  - The context makes the word the clearly best answer: no word from `similar` and none of the options fits as well, and a learner who knows the word picks it with no doubt. Learners type the answer, so avoid sentences where a common synonym fits too.
  - `options`: 3 wrong words in the same grammatical form as the gap (`houses` → `rooms`, `gardens`, `roads`). Each one makes the sentence wrong in meaning, not merely unusual. An option is never a form of the word itself. Prefer everyday words that the context rules out over random unrelated ones. Use words from `similar` when they do not fit the sentence; no set of three repeats within the card.
  - `ru` translates the whole sentence with the gap filled.

## For every field

- Only meanings of the given part of speech: `play` as a verb has no «пьеса».
- `{` and `}` appear only around the Cloze gap; examples and other fields never contain braces.
- Words around the target word are simpler than the word itself and fit its `level`: A1 sentences use only very common words, C2 sentences may be richer.
