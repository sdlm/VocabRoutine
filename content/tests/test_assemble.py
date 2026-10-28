import pytest
from helpers import make_card, make_data, names, write_batch

from content.assemble import assemble
from content.dictionary import POS
from content.files import ContentError, read_json

KEYS = ["id", "word", "forms", "pos", "level", "register", "freqRank",
        "translations", "definition", "examples", "collocations", "similar", "cloze"]


def mixed(n):
    return [(w, POS[i % 4]) for i, w in enumerate(names(n))]


def test_assemble_writes_valid_cards_in_rank_order(tmp_path):
    lemmas = mixed(12)
    paths = make_data(tmp_path, lemmas)
    words = [w for w, _ in lemmas]
    write_batch(paths, 1, {w: make_card(w) for w in reversed(words)})
    assert assemble(paths) == 12
    records = read_json(paths.words)
    assert [r["id"] for r in records] == words
    first = records[0]
    assert list(first) == KEYS
    assert (first["word"], first["pos"], first["level"], first["freqRank"]) == ("wordaa", "noun", "A1", 1)
    assert first["cloze"] == make_card("wordaa")["cloze"]
    assert paths.words.read_text(encoding="utf-8").startswith("[\n\t{")


def test_assemble_skips_invalid_and_missing_cards(tmp_path):
    lemmas = mixed(14)
    paths = make_data(tmp_path, lemmas)
    words = [w for w, _ in lemmas]
    bad = make_card(words[0])
    bad["cloze"].pop()
    write_batch(paths, 1, {words[0]: bad, **{w: make_card(w) for w in words[1:13]}})
    assert assemble(paths) == 12
    ids = {r["id"] for r in read_json(paths.words)}
    assert words[0] not in ids and words[13] not in ids


def test_assemble_needs_three_words_per_pos(tmp_path):
    words = names(3)
    paths = make_data(tmp_path, [(w, "noun") for w in words])
    write_batch(paths, 1, {w: make_card(w) for w in words})
    paths.words.write_text("old", encoding="utf-8")
    with pytest.raises(ContentError, match="fewer than 3 words for verb, adjective, adverb"):
        assemble(paths)
    assert paths.words.read_text(encoding="utf-8") == "old"
