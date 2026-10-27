from collections import Counter

import pytest
from helpers import make_csv, make_data

from content.dictionary import LEVELS, DictWord, level_of, load_dictionary
from content.files import ContentError


def test_levels_are_six_equal_bands():
    assert Counter(level_of(i, 12) for i in range(12)) == {level: 2 for level in LEVELS}
    assert Counter(level_of(i, 13) for i in range(13)) == {"A1": 3, **{level: 2 for level in LEVELS[1:]}}
    assert [level_of(i, 6) for i in range(6)] == list(LEVELS)


def test_dictionary_keeps_classified_words_with_ranks(tmp_path):
    paths = make_data(tmp_path, [("the", None), ("house", "noun"), ("of", None), ("find", "verb")])
    assert load_dictionary(paths) == [DictWord("house", "noun", "A1", 2), DictWord("find", "verb", "B2", 4)]
    assert load_dictionary(paths)[0].id == "house"


def test_dictionary_rejects_bad_pos(tmp_path):
    paths = make_data(tmp_path, [("house", "pronoun")])
    with pytest.raises(ContentError, match="house: 'pronoun'"):
        load_dictionary(paths)


def test_dictionary_needs_pos_json(tmp_path):
    paths = make_csv(tmp_path, ["house"])
    with pytest.raises(ContentError, match="run merge-pos first"):
        load_dictionary(paths)
