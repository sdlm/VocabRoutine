"""JSON helpers and the error every pipeline step raises."""

import json
import os
from pathlib import Path


class ContentError(Exception):
    """A step cannot go on; the CLI prints the message and exits with 1."""


def read_json(path: Path, object_pairs_hook=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=object_pairs_hook)
    except FileNotFoundError as e:
        raise ContentError(f"{path.resolve()}: not found") from e
    except UnicodeDecodeError as e:
        raise ContentError(f"{path.name}: not UTF-8 text") from e
    except json.JSONDecodeError as e:
        raise ContentError(f"{path.name}: invalid JSON: {e}") from e


def write_json(path: Path, data, indent: int | str = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=indent) + "\n", encoding="utf-8")
    os.replace(tmp, path)  # atomic: a crash never leaves a half-written file
