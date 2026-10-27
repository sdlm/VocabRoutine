"""Step 4: card input batches — new words, failed cards with their errors, the pilot, chosen ids."""

import re
from pathlib import Path

from .dictionary import DictWord, load_dictionary
from .files import ContentError, write_json
from .forms import lemma_forms
from .paths import Paths
from .rules import validate_card
from .store import Version, in_path, input_ids, pending, versions

BATCH = 25
PILOT = 25
MAX_ATTEMPTS = 3
BATCH_FILE = re.compile(r"^(\d+)\.(?:in\.)?json$")


def pilot_words(words: list[DictWord]) -> list[DictWord]:
    """PILOT words spread evenly over the frequency list: index floor((k + 0.5) * n / PILOT)."""
    return [words[(2 * k + 1) * len(words) // (2 * PILOT)] for k in range(PILOT)]


def card_batches(
    paths: Paths, *, pilot: bool = False, ids: list[str] | None = None, limit: int | None = None
) -> list[Path]:
    """Writes new NNN.in.json files and returns them.

    By default: words without a valid latest card, in freqRank order, skipping words in pending batches;
    a word with MAX_ATTEMPTS invalid versions goes to stuck.md instead. pilot / ids pick words explicitly.
    """
    if limit is not None and limit < 1:
        raise ContentError("--limit must be at least 1")
    words = load_dictionary(paths)
    by_id = {w.id: w for w in words}
    lemma_ids = set(by_id)
    history = versions(paths)
    busy = {id_ for num in pending(paths) for id_ in input_ids(paths, num)}

    if pilot or ids:
        chosen = pilot_words(words) if pilot else [_lookup(by_id, id_) for id_ in ids]
        if taken := [w.id for w in chosen if w.id in busy]:
            raise ContentError(f"already in a pending batch: {', '.join(taken)}")
        items = [_item(w, lemma_ids, history.get(w.id, [])) for w in chosen]
    else:
        items, stuck = [], []
        for w in words:
            if w.id in busy:
                continue
            tries = history.get(w.id, [])
            item = _item(w, lemma_ids, tries)
            if tries and "errors" not in item:
                continue  # the latest version is valid
            if len(tries) >= MAX_ATTEMPTS:
                stuck.append(item)
                continue
            items.append(item)
        _write_stuck(paths, stuck)

    chunks = [items[i : i + BATCH] for i in range(0, len(items), BATCH)][:limit]
    start = _last_number(paths) + 1
    created = []
    for num, chunk in enumerate(chunks, start):
        write_json(in_path(paths, num), chunk)
        created.append(in_path(paths, num))
    return created


def _last_number(paths: Paths) -> int:
    """Highest batch number in use, counting orphan outputs without an input too."""
    if not paths.cards_dir.exists():
        return 0
    return max((int(m[1]) for p in paths.cards_dir.iterdir() if (m := BATCH_FILE.match(p.name))), default=0)


def _lookup(by_id: dict[str, DictWord], id_: str) -> DictWord:
    try:
        return by_id[id_.lower()]
    except KeyError:
        raise ContentError(f"{id_}: not in the dictionary") from None


def _item(w: DictWord, lemma_ids: set[str], tries: list[Version]) -> dict:
    """Input for one word; a failed latest version adds its errors and the card itself."""
    item = {
        "word": w.word,
        "pos": w.pos,
        "level": w.level,
        "freqRank": w.rank,
        "lemmaForms": lemma_forms(w.word, lemma_ids),
    }
    if tries and (errors := validate_card(w, tries[-1].card, lemma_ids)):
        item["errors"] = errors
        item["previous"] = tries[-1].card
    return item


def _write_stuck(paths: Paths, stuck: list[dict]) -> None:
    if not stuck:
        paths.stuck.unlink(missing_ok=True)
        return
    lines = [
        "# Застрявшие слова",
        "",
        f"Карточки не прошли валидатор за {MAX_ATTEMPTS} попытки. "
        "Исправить карточку прямо в её последнем `NNN.json` и проверить `validate`, "
        "или перегенерировать через `card-batches --ids`.",
        "",
    ]
    for item in stuck:
        lines += [f"## {item['word']} ({item['pos']}, rank {item['freqRank']})", "", *(f"- {e}" for e in item["errors"]), ""]
    paths.stuck.parent.mkdir(parents=True, exist_ok=True)
    paths.stuck.write_text("\n".join(lines), encoding="utf-8")
