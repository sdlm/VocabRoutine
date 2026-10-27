"""NGSL 1.2 lemmas with their frequency ranks."""

import csv
from dataclasses import dataclass
from pathlib import Path

from .files import ContentError


@dataclass(frozen=True)
class Lemma:
    lemma: str
    rank: int


def read_ngsl(path: Path) -> list[Lemma]:
    with path.open(encoding="utf-8", newline="") as f:
        lemmas = [Lemma(row["lemma"], int(row["rank"])) for row in csv.DictReader(f)]
    upper = [x.lemma for x in lemmas if x.lemma != x.lemma.lower() and x.lemma != "I"]
    if upper:
        raise ContentError(
            f"{path.name}: upper-case lemmas {', '.join(upper)}; Excel's TRUE/FALSE must be fixed to true/false"
        )
    return sorted(lemmas, key=lambda x: x.rank)
