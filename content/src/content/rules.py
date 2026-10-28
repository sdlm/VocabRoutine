"""Card rules from data/README.md: validate_card returns readable errors, empty when the card passes."""

import re

from .dictionary import DictWord

FIELDS = ("forms", "register", "translations", "definition", "examples", "collocations", "similar", "cloze")
REGISTERS = ("neutral", "formal", "informal", "slang")
CLOZE_COUNT = 10
ALSO_FITS_MAX = 7
FORM = re.compile(r"^[A-Za-z]+(?:'[A-Za-z]+)?$")
TOKEN = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
GAP = re.compile(r"\{\{([^}]+)\}\}")


def validate_card(word: DictWord, card: object, lemma_ids: set[str]) -> list[str]:
    """`card` holds only the generated fields; lemma_ids are the ids of all dictionary words."""
    if not isinstance(card, dict):
        return ["card: not an object"]
    errors: list[str] = []
    if missing := [k for k in FIELDS if k not in card]:
        errors.append(f"card: missing {', '.join(missing)}")
    if extra := [k for k in card if k not in FIELDS]:
        errors.append(f"card: unexpected {', '.join(extra)}")
    # Fields that are present are checked even when others are missing: one regeneration fixes more.
    allowed = {word.id}
    if "forms" in card:
        allowed |= _forms(word, card["forms"], errors)
    if "register" in card and card["register"] not in REGISTERS:
        errors.append(f"register: {card['register']!r} is not one of {', '.join(REGISTERS)}")
    if "translations" in card:
        _translations(card["translations"], errors)
    if "definition" in card and (not isinstance(card["definition"], str) or len(card["definition"]) <= 10):
        errors.append("definition: must be longer than 10 characters")
    examples = _examples(card["examples"], allowed, errors) if "examples" in card else set()
    if "collocations" in card:
        _collocations(card["collocations"], allowed, errors)
    if "similar" in card:
        _similar(word, card["similar"], errors)
    if "cloze" in card:
        _cloze(word, card["cloze"], allowed, examples, lemma_ids, errors)
    return errors


def _filled(value: object) -> bool:
    return isinstance(value, str) and value.strip() != ""


def _strings(value: object) -> bool:
    return isinstance(value, list) and all(isinstance(x, str) for x in value)


NOT_SEPARATE = "as a separate word in"
POSSESSIVE_HINT = "(possessives like house's do not count)"


def _tokens(text: str) -> set[str]:
    return {t.lower() for t in TOKEN.findall(text)}


def _plain(sentence: str) -> str:
    """Sentence text without the gap braces, lower-cased, single spaces: for repeat checks."""
    return " ".join(GAP.sub(r"\1", sentence).lower().split())


def _forms(word: DictWord, forms: object, errors: list[str]) -> set[str]:
    if not _strings(forms):
        errors.append("forms: must be a list of strings")
        return set()
    for f in forms:
        if not FORM.fullmatch(f):
            errors.append(f"forms: {f!r} is not a plain word")
    lower = [f.lower() for f in forms]
    if word.id in lower:
        errors.append("forms: contains the word itself")
    if len(set(lower)) != len(lower):
        errors.append("forms: duplicates")
    return set(lower)


def _translations(items: object, errors: list[str]) -> None:
    if not isinstance(items, list) or not items or not all(
        isinstance(t, dict) and _filled(t.get("text")) and type(t.get("share")) is int and t["share"] > 0
        for t in items
    ):
        errors.append("translations: need 1+ items of {text, share} with a positive integer share")
        return
    shares = [t["share"] for t in items]
    if sum(shares) != 100:
        errors.append(f"translations: shares sum to {sum(shares)}, not 100")
    if shares != sorted(shares, reverse=True):
        errors.append("translations: not sorted by share, largest first")


def _examples(items: object, allowed: set[str], errors: list[str]) -> set[str]:
    if not isinstance(items, list) or not all(
        isinstance(x, dict) and _filled(x.get("en")) and _filled(x.get("ru")) for x in items
    ):
        errors.append("examples: need a list of {en, ru} with non-empty strings")
        return set()
    if not 3 <= len(items) <= 4:
        errors.append(f"examples: {len(items)} items, need 3–4")
    for i, x in enumerate(items):
        if not _tokens(x["en"]) & allowed:
            errors.append(f"examples[{i}]: no form of the word {NOT_SEPARATE} {x['en']!r} {POSSESSIVE_HINT}")
        if "{" in x["en"] or "}" in x["en"]:
            errors.append(f"examples[{i}]: braces are only for Cloze gaps")
    return {_plain(x["en"]) for x in items}


def _collocations(items: object, allowed: set[str], errors: list[str]) -> None:
    if not _strings(items) or len(items) < 3:
        errors.append("collocations: need 3+ strings")
        return
    for i, c in enumerate(items):
        if not _tokens(c) & allowed:
            errors.append(f"collocations[{i}]: no form of the word {NOT_SEPARATE} {c!r} {POSSESSIVE_HINT}")


def _similar(word: DictWord, items: object, errors: list[str]) -> None:
    if not isinstance(items, list) or not all(
        isinstance(s, dict) and _filled(s.get("word")) and isinstance(s.get("note"), str) for s in items
    ):
        errors.append("similar: need a list of {word, note}")
        return
    if len(items) < 2:
        errors.append(f"similar: {len(items)} items, need 2+")
    for i, s in enumerate(items):
        if s["word"].lower() == word.id:
            errors.append(f"similar[{i}]: is the word itself")
        if len(s["note"]) <= 10:
            errors.append(f"similar[{i}]: note must be longer than 10 characters")
        # The card prints «word — note», so the note must not start with the word again.
        if s["note"].lower().startswith(s["word"].lower()):
            errors.append(f"similar[{i}]: note starts with {s['word']!r}")


def _cloze(
    word: DictWord, items: object, allowed: set[str], examples: set[str], lemma_ids: set[str], errors: list[str]
) -> None:
    if not isinstance(items, list) or not all(isinstance(c, dict) for c in items):
        errors.append("cloze: need a list of {en, ru, options, alsoFits}")
        return
    if len(items) != CLOZE_COUNT:
        errors.append(f"cloze: {len(items)} sentences, need exactly {CLOZE_COUNT}")
    seen: dict[str, int] = {}
    for i, c in enumerate(items):
        at = f"cloze[{i}]"
        answer = None  # set only when the sentence has exactly one gap
        if not _filled(c.get("en")):
            errors.append(f"{at}: en must be a non-empty string")
        elif len(gaps := GAP.findall(c["en"])) != 1:
            errors.append(f"{at}: {len(gaps)} gaps, need exactly one {{{{…}}}}")
        else:
            answer = gaps[0].lower()
            if answer not in allowed:
                errors.append(f"{at}: gap {gaps[0]!r} is not the word or one of its forms")
            elif answer != word.id and answer in lemma_ids:
                errors.append(f"{at}: gap {gaps[0]!r} is the lemma of another word")
            rest = GAP.sub("", c["en"])
            if "{" in rest or "}" in rest:
                errors.append(f"{at}: stray braces outside the gap")
            plain = _plain(c["en"])
            if plain in examples:
                errors.append(f"{at}: repeats an example")
            if plain in seen:
                errors.append(f"{at}: repeats cloze[{seen[plain]}]")
            else:
                seen[plain] = i
        if not _filled(c.get("ru")):
            errors.append(f"{at}: ru must be a non-empty string")
        options = c.get("options")
        stripped = {o.strip().lower() for o in options} if _strings(options) else set()
        if not _strings(options) or len(options) != 3 or len(stripped) != 3 or "" in stripped:
            errors.append(f"{at}: options must be 3 different strings")
        elif answer is not None and answer in stripped:
            errors.append(f"{at}: options contain the answer {gaps[0]!r}")
        if "alsoFits" not in c:
            errors.append(f"{at}: missing alsoFits")
        else:
            _also_fits(at, c["alsoFits"], allowed, stripped, errors)


def _also_fits(at: str, items: object, allowed: set[str], options: set[str], errors: list[str]) -> None:
    """Words that fit the gap as well as the answer: plain, distinct, not the word and not a wrong option."""
    if not _strings(items):
        errors.append(f"{at}: alsoFits must be a list of strings")
        return
    if len(items) > ALSO_FITS_MAX:
        errors.append(f"{at}: alsoFits has {len(items)} words, at most {ALSO_FITS_MAX}")
    for w in items:
        if not FORM.fullmatch(w):
            errors.append(f"{at}: alsoFits {w!r} is not a plain word")
    lower = [w.lower() for w in items]
    if len(set(lower)) != len(lower):
        errors.append(f"{at}: alsoFits duplicates")
    for w in items:
        if w.lower() in allowed:
            errors.append(f"{at}: alsoFits {w!r} is the word or one of its forms")
        elif w.lower() in options:
            errors.append(f"{at}: alsoFits {w!r} is also an option")
