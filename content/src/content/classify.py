"""Steps 1 and 3: part-of-speech triage batches and their merge into pos.json and dropped.md."""

from pathlib import Path

from .dictionary import POS
from .files import ContentError, read_json, write_json
from .ngsl import Lemma, read_ngsl
from .paths import Paths

BATCH = 200


def classify_batches(paths: Paths) -> list[Path]:
    lemmas = read_ngsl(paths.csv)
    if paths.classify_dir.exists() and any(paths.classify_dir.glob("*.in.json")):
        raise ContentError(f"{paths.classify_dir} already has batches")
    created = []
    for num, start in enumerate(range(0, len(lemmas), BATCH), 1):
        path = paths.classify_dir / f"{num:03}.in.json"
        write_json(path, [{"lemma": x.lemma, "rank": x.rank} for x in lemmas[start : start + BATCH]])
        created.append(path)
    return created


def merge_pos(paths: Paths, force: bool = False) -> int:
    """Writes pos.json and dropped.md; returns how many lemmas were dropped."""
    if paths.pos.exists() and not force:
        raise ContentError(f"{paths.pos} exists and may hold manual edits; pass --force to overwrite")
    lemmas = read_ngsl(paths.csv)
    known = {x.lemma for x in lemmas}
    seen: dict[str, dict] = {}
    errors: list[str] = []
    for in_path in sorted(paths.classify_dir.glob("*.in.json")):
        out_path = in_path.with_name(in_path.name.replace(".in.json", ".out.json"))
        if not out_path.exists():
            errors.append(f"{out_path.name}: missing")
            continue
        answers = read_json(out_path)
        if not isinstance(answers, list):
            errors.append(f"{out_path.name}: expected a JSON array")
            continue
        for i, entry in enumerate(answers):
            errors += _check(out_path.name, f"{out_path.name}[{i}]", entry, known, seen)
    errors += [f"{x.lemma}: not classified" for x in lemmas if x.lemma not in seen]
    if errors:
        raise ContentError("\n".join(errors))
    write_json(paths.pos, {x.lemma: seen[x.lemma]["pos"] for x in lemmas})
    paths.dropped.write_text(_dropped_md(lemmas, seen), encoding="utf-8")
    return sum(1 for x in lemmas if seen[x.lemma]["pos"] is None)


def _check(source: str, at: str, entry: object, known: set[str], seen: dict[str, dict]) -> list[str]:
    if not isinstance(entry, dict):
        return [f"{at}: not an object"]
    lemma = entry.get("lemma")
    if not isinstance(lemma, str):
        return [f"{at}: lemma must be a string"]
    if lemma not in known:
        return [f"{source}: unknown lemma {lemma!r}"]
    if lemma in seen:
        return [f"{source}: {lemma} classified twice"]
    seen[lemma] = entry
    errors = []
    if "pos" not in entry:
        errors.append(f"{source}: {lemma}: pos is missing")
    elif entry["pos"] is not None and entry["pos"] not in POS:
        errors.append(f"{source}: {lemma}: pos {entry['pos']!r} is not one of {', '.join(POS)} or null")
    if not isinstance(entry.get("doubt"), bool):
        errors.append(f"{source}: {lemma}: doubt must be true or false")
    if (entry.get("pos") is None or entry.get("doubt")) and not str(entry.get("reason") or "").strip():
        errors.append(f"{source}: {lemma}: reason is required when pos is null or doubt is true")
    return errors


def _cell(text: object) -> str:
    """Text safe inside a Markdown table cell."""
    return " ".join(str(text).split()).replace("|", "\\|")


def _dropped_md(lemmas: list[Lemma], seen: dict[str, dict]) -> str:
    doubt = [x for x in lemmas if seen[x.lemma]["doubt"]]
    dropped = [x for x in lemmas if seen[x.lemma]["pos"] is None]
    plain_dropped = [x for x in dropped if not seen[x.lemma]["doubt"]]
    lines = [
        "# Классификация NGSL",
        "",
        f"Отброшено {len(dropped)} из {len(lemmas)}, сомнительных {len(doubt)}. Правки вносятся в `data/gen/pos.json`.",
        "",
        "## Сомнительные",
        "",
        "| rank | lemma | pos | reason |",
        "|---|---|---|---|",
        *(f"| {x.rank} | {x.lemma} | {seen[x.lemma]['pos'] or '—'} | {_cell(seen[x.lemma]['reason'])} |" for x in doubt),
        "",
        "## Отброшенные",
        "",
        "| rank | lemma | reason |",
        "|---|---|---|",
        *(f"| {x.rank} | {x.lemma} | {_cell(seen[x.lemma]['reason'])} |" for x in plain_dropped),
    ]
    return "\n".join(lines) + "\n"
