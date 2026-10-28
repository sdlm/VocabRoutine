"""The dictionary: NGSL lemmas kept by pos.json, with levels by frequency."""

from dataclasses import dataclass

from .files import ContentError, read_json
from .ngsl import read_ngsl
from .paths import Paths

POS = ("noun", "verb", "adjective", "adverb")
LEVELS = ("A1", "A2", "B1", "B2", "C1", "C2")


@dataclass(frozen=True)
class DictWord:
    word: str
    pos: str
    level: str
    rank: int

    @property
    def id(self) -> str:
        return self.word.lower()


def level_of(index: int, total: int) -> str:
    """Six equal frequency bands: the first sixth of the dictionary is A1, the last sixth C2."""
    return LEVELS[index * len(LEVELS) // total]


def load_dictionary(paths: Paths) -> list[DictWord]:
    if not paths.pos.exists():
        raise ContentError(f"{paths.pos} is missing; run merge-pos first")
    pos = read_json(paths.pos)
    lemmas = read_ngsl(paths.csv)
    errors = [f"pos.json: {x.lemma} is missing" for x in lemmas if x.lemma not in pos]
    known = {x.lemma for x in lemmas}
    errors += [f"pos.json: unknown lemma {key!r}" for key in pos if key not in known]
    errors += [
        f"pos.json: {lemma}: {value!r} is not one of {', '.join(POS)} or null"
        for lemma, value in pos.items()
        if value is not None and value not in POS
    ]
    if errors:
        raise ContentError("\n".join(errors))
    kept = [x for x in lemmas if pos[x.lemma]]
    return [DictWord(x.lemma, pos[x.lemma], level_of(i, len(kept)), x.rank) for i, x in enumerate(kept)]
