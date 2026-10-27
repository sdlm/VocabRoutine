import pytest
from helpers import make_card, make_data, names, write_batch

from content.files import ContentError, read_json, write_json
from content.store import pending, read_output, versions
from content.validate import validate_all, validate_file

NINE = "cloze: 9 sentences, need exactly 10"


def bad_card(word):
    card = make_card(word)
    card["cloze"].pop()
    return card


def test_versions_follow_batch_numbers_and_pending_has_no_output(tmp_path):
    a, b = names(2)
    paths = make_data(tmp_path, [(a, "noun"), (b, "noun")])
    write_batch(paths, 2, {a: make_card(a)})
    write_batch(paths, 1, {a: bad_card(a)})
    write_batch(paths, 3, None, words=[b])
    assert [v.num for v in versions(paths)[a]] == [1, 2]
    assert pending(paths) == [3]


def test_validate_file_reports_errors_and_batch_mismatch(tmp_path):
    a, b, c = names(3)
    paths = make_data(tmp_path, [(a, "noun"), (b, "noun"), (c, "noun")])
    write_batch(paths, 1, {a: bad_card(a), c: make_card(c), "zzz": make_card("zzz")}, words=[a, b])
    report = validate_file(paths, paths.cards_dir / "001.json")
    assert report == {
        b: ["card: missing from the output"],
        c: ["card: not in the input batch"],
        "zzz": ["card: not in the input batch"],
        a: [NINE],
    }


def test_validate_file_without_input_checks_ids(tmp_path):
    a = names(1)[0]
    paths = make_data(tmp_path, [(a, "noun")])
    path = paths.cards_dir / "x.json"
    write_json(path, {a: make_card(a), "zzz": make_card("zzz")})
    assert validate_file(paths, path) == {"zzz": ["card: id is not in the dictionary"]}


def test_validate_file_rejects_non_object(tmp_path):
    a = names(1)[0]
    paths = make_data(tmp_path, [(a, "noun")])
    path = paths.cards_dir / "001.json"
    path.parent.mkdir(parents=True)
    path.write_text("[]", encoding="utf-8")
    with pytest.raises(ContentError, match="must be an object keyed by id"):
        validate_file(paths, path)


def test_validate_all_checks_latest_versions_in_rank_order(tmp_path):
    a, b, c = names(3)
    paths = make_data(tmp_path, [(a, "noun"), (b, "noun"), (c, "noun")])
    write_batch(paths, 1, {a: make_card(a), b: bad_card(b), c: make_card(c)})
    write_batch(paths, 2, {a: bad_card(a)})
    checked, report = validate_all(paths)
    assert checked == 3
    assert list(report) == [a, b]
    assert read_json(paths.report) == {a: [NINE], b: [NINE]}


def test_validate_file_flags_upper_case_ids(tmp_path):
    a = names(1)[0]
    paths = make_data(tmp_path, [(a, "noun")])
    write_batch(paths, 1, {a.upper(): make_card(a)}, words=[a])
    assert validate_file(paths, paths.cards_dir / "001.json") == {
        a: ["card: missing from the output"],
        a.upper(): [f"card: ids are lower case; expected {a!r}"],
    }


def test_read_output_rejects_duplicate_ids(tmp_path):
    path = tmp_path / "001.json"
    path.write_text('{"wordaa": {}, "wordaa": {}}', encoding="utf-8")
    with pytest.raises(ContentError, match=r"001.json: duplicate id 'wordaa'"):
        read_output(path)


def test_read_output_allows_repeated_keys_inside_cards(tmp_path):
    path = tmp_path / "001.json"
    path.write_text('{"wordaa": {"a": 1, "a": 2}}', encoding="utf-8")
    assert read_output(path) == {"wordaa": {"a": 2}}
