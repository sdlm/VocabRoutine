import pytest
from helpers import make_csv, names

from content.classify import classify_batches, merge_pos
from content.dictionary import TOP_DROPPED
from content.files import ContentError, read_json, write_json


def ranked_csv(tmp_path, lemmas):
    """Lemmas ranked after the top 30, so merge-pos keeps the subagent's answer."""
    return make_csv(tmp_path, lemmas, first_rank=TOP_DROPPED + 1)


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
    paths = ranked_csv(tmp_path, ["the", "house", "up"])
    answer(paths, [entry("the", None, reason="article"), entry("house", "noun"),
                   entry("up", "adverb", True, "adverb or particle")])
    assert merge_pos(paths) == 1
    assert read_json(paths.pos) == {"the": None, "house": "noun", "up": "adverb"}
    text = paths.dropped.read_text(encoding="utf-8")
    assert text.index("| 33 | up | adverb | adverb or particle |") < text.index("| 31 | the | article |")
    assert "house" not in text


def test_merge_rejects_unknown_duplicate_and_missing(tmp_path):
    paths = ranked_csv(tmp_path, ["the", "house", "up"])
    answer(paths, [entry("the", None, reason="article"), entry("the", None, reason="article"), entry("cat", "noun")])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    msg = str(e.value)
    assert "the classified twice" in msg
    assert "unknown lemma 'cat'" in msg
    assert "house: not classified" in msg
    assert "up: not classified" in msg


def test_merge_checks_fields(tmp_path):
    paths = ranked_csv(tmp_path, ["the", "house", "up"])
    answer(paths, [entry("the", None), entry("house", "article"), {"lemma": "up", "pos": "adverb"}])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    msg = str(e.value)
    assert "the: reason is required" in msg
    assert "house: pos 'article'" in msg
    assert "up: doubt must be true or false" in msg


def test_merge_reports_missing_answer(tmp_path):
    paths = ranked_csv(tmp_path, ["house"])
    classify_batches(paths)
    with pytest.raises(ContentError, match="001.out.json: missing"):
        merge_pos(paths)


def test_merge_keeps_manual_edits(tmp_path):
    paths = ranked_csv(tmp_path, ["house"])
    answer(paths, [entry("house", "noun")])
    merge_pos(paths)
    with pytest.raises(ContentError, match="--force"):
        merge_pos(paths)
    assert merge_pos(paths, force=True) == 0


def test_merge_rejects_answer_that_is_not_an_array(tmp_path):
    paths = ranked_csv(tmp_path, ["the"])
    answer(paths, {"answers": []})
    with pytest.raises(ContentError, match=r"001\.out\.json: expected a JSON array"):
        merge_pos(paths)


def test_merge_rejects_malformed_entries(tmp_path):
    paths = ranked_csv(tmp_path, ["the"])
    answer(paths, ["the", {"lemma": ["x"], "pos": None}])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    msg = str(e.value)
    assert "001.out.json[0]: not an object" in msg
    assert "001.out.json[1]: lemma must be a string" in msg


def test_dropped_md_escapes_pipes_in_reason(tmp_path):
    paths = ranked_csv(tmp_path, ["the"])
    answer(paths, [entry("the", None, True, "a | b\r\nc")])
    merge_pos(paths)
    text = paths.dropped.read_text(encoding="utf-8")
    assert text.count("a \\| b c") == 1
    assert text.index("a \\| b c") < text.index("## Отброшенные")


def test_merge_missing_batch_does_not_list_its_lemmas(tmp_path):
    paths = ranked_csv(tmp_path, ["the", "house"])
    classify_batches(paths)
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    assert str(e.value) == "001.out.json: missing"


def test_merge_without_batches_says_to_run_classify_batches(tmp_path):
    paths = ranked_csv(tmp_path, ["house"])
    with pytest.raises(ContentError, match="no classification batches; run classify-batches first"):
        merge_pos(paths)


def test_string_false_doubt_gets_only_the_type_error(tmp_path):
    paths = ranked_csv(tmp_path, ["up"])
    answer(paths, [entry("up", "noun", doubt="false")])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    assert str(e.value).count("up:") == 1
    assert "up: doubt must be true or false" in str(e.value)


def test_merge_drops_the_top_30_whatever_the_answer(tmp_path):
    lemmas = names(TOP_DROPPED + 1)
    paths = make_csv(tmp_path, lemmas)
    answer(paths, [entry(x, "noun", True, "noun or verb") for x in lemmas])
    assert merge_pos(paths) == TOP_DROPPED
    pos = read_json(paths.pos)
    assert pos[lemmas[0]] is None and pos[lemmas[TOP_DROPPED - 1]] is None
    assert pos[lemmas[TOP_DROPPED]] == "noun"
    doubtful, dropped = paths.dropped.read_text(encoding="utf-8").split("## Отброшенные")
    assert f"| 1 | {lemmas[0]} | top {TOP_DROPPED} |" in dropped
    assert f"| {TOP_DROPPED} | {lemmas[TOP_DROPPED - 1]} | top {TOP_DROPPED} |" in dropped
    assert lemmas[0] not in doubtful
    assert f"| {TOP_DROPPED + 1} | {lemmas[TOP_DROPPED]} | noun | noun or verb |" in doubtful
    assert f"Отброшено {TOP_DROPPED} из {TOP_DROPPED + 1}, сомнительных 1." in doubtful


def test_merge_still_validates_top_30_answers(tmp_path):
    paths = make_csv(tmp_path, ["the", "of", "house"])
    answer(paths, [entry("the", "article"), entry("house", "noun")])
    with pytest.raises(ContentError) as e:
        merge_pos(paths)
    msg = str(e.value)
    assert "the: pos 'article'" in msg
    assert "of: not classified" in msg
