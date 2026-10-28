"""Step 6: the validator over one output file or over the latest version of every card."""

from pathlib import Path

from .dictionary import load_dictionary
from .files import write_json
from .paths import Paths
from .rules import validate_card
from .store import in_path_for, read_input_ids, read_output, versions


def validate_file(paths: Paths, file: Path) -> dict[str, list[str]]:
    """Errors by id for one output file, checked against its NNN.in.json when there is one."""
    words = {w.id: w for w in load_dictionary(paths)}
    cards = read_output(file)
    report: dict[str, list[str]] = {}
    in_file = in_path_for(file)
    if in_file.exists():
        expected = read_input_ids(in_file)
        for id_ in expected:
            if id_ not in cards:
                report[id_] = ["card: missing from the output"]
        for id_ in cards:
            if id_ in expected:
                continue
            if id_.lower() in expected:
                report[id_] = [f"card: ids are lower case; expected {id_.lower()!r}"]
            else:
                report[id_] = ["card: not in the input batch"]
    for id_, card in cards.items():
        if id_ in report:
            continue
        if id_ not in words:
            report[id_] = ["card: id is not in the dictionary"]
        elif errors := validate_card(words[id_], card, set(words)):
            report[id_] = errors
    return report


def file_card_count(file: Path) -> int:
    """Cards in one output file: its input ids and its keys, case-insensitively."""
    in_file = in_path_for(file)
    ids = set(read_input_ids(in_file)) if in_file.exists() else set()
    return len(ids | {id_.lower() for id_ in read_output(file)})


def validate_all(paths: Paths) -> tuple[int, dict[str, list[str]]]:
    """Checks the latest version of every card and writes report.json; returns (cards checked, report)."""
    words = {w.id: w for w in load_dictionary(paths)}
    report: dict[str, list[str]] = {}
    history = versions(paths)
    for id_, tries in history.items():
        word = words.get(id_)
        errors = validate_card(word, tries[-1].card, set(words)) if word else ["card: id is not in the dictionary"]
        if errors:
            report[id_] = errors
    report = dict(sorted(report.items(), key=lambda kv: words[kv[0]].rank if kv[0] in words else 10**9))
    write_json(paths.report, report)
    return len(history), report
