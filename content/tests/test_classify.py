import pytest
from helpers import make_csv, names

from content.classify import classify_batches, merge_pos
from content.files import ContentError, read_json, write_json


def entry(lemma, pos, doubt=False, reason=""):
    return {"lemma": lemma, "pos": pos, "doubt": doubt, "reason": reason}


def answer(paths, entries):
    """One classification batch and its answer."""
    classify_batches(paths)
    write_json(paths.classify_dir / "001.out.json", entries)


def test_batches_of_200(tmp_path):
    paths = make_csv(tmp_path, names(450))
    created = classify_batches(paths)
    assert [p.name for p in created] == ["001.in.json", "002.in.json", "003.in.json"]
    assert [len(read_json(p)) for p in created] == [200, 200, 50]
    assert read_json(created[0])[0] == {"lemma": "wordaa", "rank": 1}


def test_batches_refuse_to_overwrite(tmp_path):
    paths = make_csv(tmp_path, names(3))
    classify_batches(paths)
    with pytest.raises(ContentError, match="already has batches"):
        classify_batches(paths)


def test_merge_writes_pos_and_dropped(tmp_path):
    paths = make_csv(tmp_path, ["the", "house", "up"])
    answer(paths, [entry("the", None, reason="article"), entry("house", "noun"),
                   entry("up", "adverb", True, "adverb or particle")])
    assert merge_pos(paths) == 1
    assert read_json(paths.pos) == {"the": None, "house": "noun", "up": "adverb"}
    text = paths.dropped.read_text(encoding="utf-8")
    assert text.index("| 3 | up | adverb | adverb or particle |") < text.index("| 1 | the | article |")
    assert "house" not in text


def test_merge_rejects_unknown_duplicate_and_missing(tmp_path):
    paths = make_csv(tmp_path, ["the", "house", "up"])
    answer(paths, [entry("the", None, reason="article"), entry("the", None, reason="article"), entry("cat", "noun")])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    msg = str(e.value)
    assert "the classified twice" in msg
    assert "unknown lemma 'cat'" in msg
    assert "house: not classified" in msg
    assert "up: not classified" in msg


def test_merge_checks_fields(tmp_path):
    paths = make_csv(tmp_path, ["the", "house", "up"])
    answer(paths, [entry("the", None), entry("house", "pronoun"), {"lemma": "up", "pos": "adverb"}])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    msg = str(e.value)
    assert "the: reason is required" in msg
    assert "house: pos 'pronoun'" in msg
    assert "up: doubt must be true or false" in msg


def test_merge_reports_missing_answer(tmp_path):
    paths = make_csv(tmp_path, ["house"])
    classify_batches(paths)
    with pytest.raises(ContentError, match="001.out.json: missing"):
        merge_pos(paths)


def test_merge_keeps_manual_edits(tmp_path):
    paths = make_csv(tmp_path, ["house"])
    answer(paths, [entry("house", "noun")])
    merge_pos(paths)
    with pytest.raises(ContentError, match="--force"):
        merge_pos(paths)
    assert merge_pos(paths, force=True) == 0


def test_merge_rejects_answer_that_is_not_an_array(tmp_path):
    paths = make_csv(tmp_path, ["the"])
    answer(paths, {"answers": []})
    with pytest.raises(ContentError, match=r"001\.out\.json: expected a JSON array"):
        merge_pos(paths)


def test_merge_rejects_malformed_entries(tmp_path):
    paths = make_csv(tmp_path, ["the"])
    answer(paths, ["the", {"lemma": ["x"], "pos": None}])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    msg = str(e.value)
    assert "001.out.json[0]: not an object" in msg
    assert "001.out.json[1]: lemma must be a string" in msg


def test_dropped_md_escapes_pipes_in_reason(tmp_path):
    paths = make_csv(tmp_path, ["the"])
    answer(paths, [entry("the", None, True, "a | b\r\nc")])
    merge_pos(paths)
    text = paths.dropped.read_text(encoding="utf-8")
    assert text.count("a \\| b c") == 1
    assert text.index("a \\| b c") < text.index("## Отброшенные")
