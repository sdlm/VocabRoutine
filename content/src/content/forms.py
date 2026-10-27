"""Candidates for forms of a word that are lemmas of other dictionary words (find → found)."""

# Irregular pairs from data/README.md, «Форма, совпадающая с другой леммой».
IRREGULAR = {
    "find": ["found"],
    "leave": ["left"],
    "lie": ["lay"],
    "rise": ["rose"],
    "bear": ["bore"],
    "wind": ["wound"],
    "shoot": ["shot"],
    "bite": ["bit"],
    "person": ["people"],
    "many": ["more", "most"],
    "little": ["less", "least"],
    "far": ["further"],
}


def _regular(word: str) -> set[str]:
    forms = {word + end for end in ("s", "es", "ed", "ing", "er", "est")}
    if word.endswith("y"):
        forms |= {word[:-1] + end for end in ("ies", "ied", "ier", "iest")}
    if word.endswith("e"):
        forms |= {word[:-1] + "ing", word + "d", word + "r", word + "st"}
    forms |= {word + word[-1] + end for end in ("ed", "ing", "er", "est")}
    return forms


def lemma_forms(word: str, lemma_ids: set[str]) -> list[str]:
    """Dictionary lemmas that look like forms of `word`; the model must not put them in a Cloze gap."""
    w = word.lower()
    candidates = _regular(w) | set(IRREGULAR.get(w, []))
    return sorted(c for c in candidates - {w} if c in lemma_ids)
