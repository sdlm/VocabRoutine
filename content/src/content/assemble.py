"""Step 7: data/words.json from the valid latest cards, in freqRank order."""

from collections import Counter

from .dictionary import POS, load_dictionary
from .files import ContentError, write_json
from .paths import Paths
from .rules import validate_card
from .store import versions

MIN_PER_POS = 3


def assemble(paths: Paths) -> int:
    """Writes words.json and returns the number of words in it."""
    words = load_dictionary(paths)
    lemma_ids = {w.id for w in words}
    history = versions(paths)
    records = []
    for w in words:
        tries = history.get(w.id)
        if not tries or validate_card(w, tries[-1].card, lemma_ids):
            continue
        card = tries[-1].card
        # Key order follows data/README.md.
        records.append({
            "id": w.id,
            "word": w.word,
            "forms": card["forms"],
            "pos": w.pos,
            "level": w.level,
            "register": card["register"],
            "freqRank": w.rank,
            "translations": card["translations"],
            "definition": card["definition"],
            "examples": card["examples"],
            "collocations": card["collocations"],
            "similar": card["similar"],
            "cloze": card["cloze"],
        })
    counts = Counter(r["pos"] for r in records)
    if short := [p for p in POS if counts[p] < MIN_PER_POS]:
        raise ContentError(f"fewer than {MIN_PER_POS} words for {', '.join(short)}; words.json not written")
    write_json(paths.words, records, indent="\t")
    return len(records)
