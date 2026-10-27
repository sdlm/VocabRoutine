"""JSON helpers and the error every pipeline step raises."""

import json
from pathlib import Path


class ContentError(Exception):
    """A step cannot go on; the CLI prints the message and exits with 1."""


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ContentError(f"{path.name}: invalid JSON: {e}") from e


def write_json(path: Path, data, indent: int | str = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=indent) + "\n", encoding="utf-8")
