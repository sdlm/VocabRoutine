"""Card batch files in data/gen/cards: NNN.in.json is the input, NNN.json the subagent's output.

The latest version of a card is the one in the highest-numbered output; attempts are outputs holding the id.
"""

import re
from dataclasses import dataclass
from pathlib import Path

from .files import ContentError, read_json
from .paths import Paths

IN_NAME = re.compile(r"^(\d+)\.in\.json$")
BATCH_FILE = re.compile(r"^(\d+)\.(?:in\.)?json$")


@dataclass(frozen=True)
class Version:
    num: int
    card: object


def in_path(paths: Paths, num: int) -> Path:
    return paths.cards_dir / f"{num:03}.in.json"


def out_path(paths: Paths, num: int) -> Path:
    return paths.cards_dir / f"{num:03}.json"


def in_path_for(output: Path) -> Path:
    """The NNN.in.json next to an NNN.json output."""
    return output.with_name(output.name.removesuffix(".json") + ".in.json")


def next_number(paths: Paths) -> int:
    """First free batch number: one above the highest in use, counting orphan outputs without an input too."""
    if not paths.cards_dir.exists():
        return 1
    return max((int(m[1]) for p in paths.cards_dir.iterdir() if (m := BATCH_FILE.match(p.name))), default=0) + 1


def batch_numbers(paths: Paths) -> list[int]:
    if not paths.cards_dir.exists():
        return []
    return sorted(int(m[1]) for p in paths.cards_dir.iterdir() if (m := IN_NAME.match(p.name)))


def pending(paths: Paths) -> list[int]:
    """Batches whose output is not written yet."""
    return [n for n in batch_numbers(paths) if not out_path(paths, n).exists()]


def read_input_ids(path: Path) -> list[str]:
    return [item["word"].lower() for item in read_json(path)]


def input_ids(paths: Paths, num: int) -> list[str]:
    return read_input_ids(in_path(paths, num))


def read_output(path: Path) -> dict:
    top: list = []

    def keep_pairs(pairs):
        top[:] = pairs  # the outermost object is built last, so this ends up as the top level
        return dict(pairs)

    data = read_json(path, object_pairs_hook=keep_pairs)
    if not isinstance(data, dict):
        raise ContentError(f"{path.name}: must be an object keyed by id")
    seen: set[str] = set()
    for key, _ in top:
        if key in seen:
            raise ContentError(f"{path.name}: duplicate id {key!r}")
        seen.add(key)
    return data


def versions(paths: Paths) -> dict[str, list[Version]]:
    """Every written version of every card, oldest first; only ids the batch asked for count."""
    history: dict[str, list[Version]] = {}
    for num in batch_numbers(paths):
        path = out_path(paths, num)
        if path.exists():
            asked = set(input_ids(paths, num))
            for id_, card in read_output(path).items():
                if id_ in asked:
                    history.setdefault(id_, []).append(Version(num, card))
    return history
