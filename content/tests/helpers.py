"""Builders for a throwaway data directory and cards that pass the validator."""

from content.files import write_json
from content.paths import Paths


def make_csv(tmp_path, lemmas: list[str]) -> Paths:
    """NGSL CSV with the lemmas ranked 1..n in the given order."""
    paths = Paths(tmp_path)
    paths.csv.parent.mkdir(parents=True, exist_ok=True)
    rows = ["lemma,rank,sfi,u", *(f"{lemma},{rank},50.0,10.0" for rank, lemma in enumerate(lemmas, 1))]
    paths.csv.write_text("\n".join(rows) + "\n", encoding="utf-8")
    return paths


def make_data(tmp_path, lemmas: list[tuple[str, str | None]]) -> Paths:
    """CSV plus pos.json: lemmas are [(lemma, pos or None)], ranked 1..n."""
    paths = make_csv(tmp_path, [lemma for lemma, _ in lemmas])
    write_json(paths.pos, dict(lemmas))
    return paths


def names(n: int) -> list[str]:
    """n distinct letter-only lemmas: wordaa, wordab, …"""
    return ["word" + chr(97 + i // 26) + chr(97 + i % 26) for i in range(n)]


def make_card(word: str, forms: list[str] = ()) -> dict:
    """A card for `word` that passes validate_card."""
    return {
        "forms": list(forms),
        "register": "neutral",
        "translations": [{"text": "перевод", "share": 85}, {"text": "другой", "share": 15}],
        "definition": f"A test definition for {word}.",
        "examples": [{"en": f"Example {i} with {word}.", "ru": "Пример."} for i in range(3)],
        "collocations": [f"{word} one", f"{word} two", f"{word} three"],
        "similar": [
            {"word": "alpha", "note": "первое близкое слово"},
            {"word": "beta", "note": "второе близкое слово"},
        ],
        "cloze": [
            {"en": f"Sentence {i} with {{{{{word}}}}}.", "ru": "Перевод.", "options": ["room", "garden", "road"]}
            for i in range(10)
        ],
    }


def write_batch(paths: Paths, num: int, cards: dict | None, words: list[str] | None = None) -> None:
    """Card batch `num`: an input listing `words` (default: the card ids) and, unless cards is None, its output."""
    listed = words if words is not None else list(cards)
    write_json(paths.cards_dir / f"{num:03}.in.json", [{"word": w} for w in listed])
    if cards is not None:
        write_json(paths.cards_dir / f"{num:03}.json", cards)
