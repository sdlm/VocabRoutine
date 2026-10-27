import pytest
from helpers import make_card, make_data, names, write_batch

from content.batches import card_batches
from content.files import ContentError, read_json


def dictionary(tmp_path, n):
    words = names(n)
    return make_data(tmp_path, [(w, "noun") for w in words]), words


def bad_card(word):
    card = make_card(word)
    card["cloze"].pop()
    return card


def picked(path):
    return [item["word"] for item in read_json(path)]


def test_new_words_go_in_batches_of_25(tmp_path):
    paths, words = dictionary(tmp_path, 30)
    created = card_batches(paths)
    assert [p.name for p in created] == ["001.in.json", "002.in.json"]
    first = read_json(created[0])
    assert len(first) == 25 and len(read_json(created[1])) == 5
    assert first[0] == {"word": "wordaa", "pos": "noun", "level": "A1", "freqRank": 1, "lemmaForms": []}


def test_valid_cards_are_skipped_and_numbering_continues(tmp_path):
    paths, words = dictionary(tmp_path, 3)
    write_batch(paths, 1, {words[0]: make_card(words[0])})
    created = card_batches(paths)
    assert [p.name for p in created] == ["002.in.json"]
    assert picked(created[0]) == words[1:]


def test_invalid_card_comes_back_with_errors_and_previous(tmp_path):
    paths, words = dictionary(tmp_path, 1)
    write_batch(paths, 1, {words[0]: bad_card(words[0])})
    [item] = read_json(card_batches(paths)[0])
    assert item["errors"] == ["cloze: 9 sentences, need exactly 10"]
    assert item["previous"] == bad_card(words[0])


def test_latest_version_wins(tmp_path):
    paths, words = dictionary(tmp_path, 1)
    write_batch(paths, 1, {words[0]: bad_card(words[0])})
    write_batch(paths, 2, {words[0]: make_card(words[0])})
    assert card_batches(paths) == []


def test_pending_batches_are_not_repeated(tmp_path):
    paths, words = dictionary(tmp_path, 2)
    write_batch(paths, 1, None, words=[words[0]])
    [created] = card_batches(paths)
    assert picked(created) == [words[1]]


def test_three_failed_attempts_go_to_stuck(tmp_path):
    paths, words = dictionary(tmp_path, 2)
    for num in (1, 2, 3):
        write_batch(paths, num, {words[0]: bad_card(words[0])})
    [created] = card_batches(paths)
    assert picked(created) == [words[1]]
    stuck = paths.stuck.read_text(encoding="utf-8")
    assert "## wordaa (noun, rank 1)" in stuck
    assert "- cloze: 9 sentences, need exactly 10" in stuck
    # Fixed by hand in a later batch: nothing is stuck any more.
    write_batch(paths, 5, {words[0]: make_card(words[0])})
    card_batches(paths)
    assert not paths.stuck.exists()


def test_pilot_spreads_25_words_over_the_list(tmp_path):
    paths, words = dictionary(tmp_path, 100)
    [created] = card_batches(paths, pilot=True)
    chosen = picked(created)
    assert len(set(chosen)) == 25
    assert chosen[0] == words[2] and chosen[-1] == words[98]


def test_ids_regenerate_even_valid_cards(tmp_path):
    paths, words = dictionary(tmp_path, 2)
    write_batch(paths, 1, {words[0]: make_card(words[0])})
    [created] = card_batches(paths, ids=[words[0].upper()])
    assert read_json(created) == [{"word": words[0], "pos": "noun", "level": "A1", "freqRank": 1, "lemmaForms": []}]


def test_ids_must_be_known_and_free(tmp_path):
    paths, words = dictionary(tmp_path, 2)
    with pytest.raises(ContentError, match="nope: not in the dictionary"):
        card_batches(paths, ids=["nope"])
    write_batch(paths, 1, None, words=[words[0]])
    with pytest.raises(ContentError, match="already in a pending batch: wordaa"):
        card_batches(paths, ids=[words[0]])


def test_limit_caps_the_number_of_batches(tmp_path):
    paths, _ = dictionary(tmp_path, 60)
    assert len(card_batches(paths, limit=1)) == 1


def test_items_carry_lemma_forms(tmp_path):
    paths = make_data(tmp_path, [("find", "verb"), ("house", "noun"), ("found", "verb")])
    [created] = card_batches(paths)
    assert read_json(created)[0]["lemmaForms"] == ["found"]


def test_numbering_skips_orphan_outputs(tmp_path):
    paths, words = dictionary(tmp_path, 2)
    paths.cards_dir.mkdir(parents=True, exist_ok=True)
    (paths.cards_dir / "003.json").write_text("{}", encoding="utf-8")
    [created] = card_batches(paths)
    assert created.name == "004.in.json"


def test_stuck_says_where_to_fix(tmp_path):
    paths, words = dictionary(tmp_path, 1)
    for num in (1, 2, 3):
        write_batch(paths, num, {words[0]: bad_card(words[0])})
    card_batches(paths)
    stuck = paths.stuck.read_text(encoding="utf-8")
    assert "Исправить карточку прямо в её последнем `NNN.json` и проверить `validate`" in stuck
    assert "`card-batches --ids`" in stuck


@pytest.mark.parametrize("limit", [0, -1])
def test_limit_must_be_positive(tmp_path, limit):
    paths, _ = dictionary(tmp_path, 3)
    with pytest.raises(ContentError, match="--limit must be at least 1"):
        card_batches(paths, limit=limit)
    assert not paths.cards_dir.exists() or not list(paths.cards_dir.iterdir())


def test_pilot_refuses_words_in_pending_batches(tmp_path):
    paths, words = dictionary(tmp_path, 100)
    write_batch(paths, 1, None, words=[words[2]])
    with pytest.raises(ContentError, match="already in a pending batch: wordac"):
        card_batches(paths, pilot=True)
