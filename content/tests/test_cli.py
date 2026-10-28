import pytest
from helpers import make_card, make_csv, make_data, names, write_batch

from content.cli import main
from content.dictionary import POS
from content.files import read_json, write_json


def test_validate_file_prints_errors_and_fails(tmp_path, capsys):
    a, b = names(2)
    paths = make_data(tmp_path, [(a, "noun"), (b, "noun")])
    bad = make_card(a)
    bad["cloze"].pop()
    write_batch(paths, 1, {a: bad, b: make_card(b)})
    code = main(["--data", str(tmp_path), "validate", "--file", str(paths.cards_dir / "001.json")])
    out = capsys.readouterr().out
    assert code == 1
    assert f"{a}:\n  cloze: 9 sentences, need exactly 10\n" in out
    assert "1 of 2 cards invalid" in out


def test_validate_file_passes(tmp_path, capsys):
    a = names(1)[0]
    paths = make_data(tmp_path, [(a, "noun")])
    write_batch(paths, 1, {a: make_card(a)})
    assert main(["--data", str(tmp_path), "validate", "--file", str(paths.cards_dir / "001.json")]) == 0
    assert "all 1 cards valid" in capsys.readouterr().out


def test_content_errors_go_to_stderr(tmp_path, capsys):
    make_csv(tmp_path, ["house"])
    assert main(["--data", str(tmp_path), "card-batches"]) == 1
    assert "run merge-pos first" in capsys.readouterr().err


def test_pipeline_end_to_end(tmp_path, capsys):
    words = names(12)
    lemmas = ["the", *words]
    paths = make_csv(tmp_path, lemmas)
    pos = {"the": None, **{w: POS[i % 4] for i, w in enumerate(words)}}

    def run(*args):
        return main(["--data", str(tmp_path), *args])

    assert run("classify-batches") == 0
    write_json(paths.classify_dir / "001.out.json", [
        {"lemma": x, "pos": pos[x], "doubt": False, "reason": "article" if pos[x] is None else ""} for x in lemmas
    ])
    assert run("merge-pos") == 0
    assert run("card-batches") == 0
    batch = read_json(paths.cards_dir / "001.in.json")
    write_json(paths.cards_dir / "001.json", {item["word"]: make_card(item["word"]) for item in batch})
    assert run("validate", "--file", str(paths.cards_dir / "001.json")) == 0
    assert run("validate") == 0
    assert run("card-batches") == 0
    assert run("assemble") == 0
    assert [r["id"] for r in read_json(paths.words)] == words
    out = capsys.readouterr().out
    assert "12 valid, 0 invalid" in out
    assert "0 new batches" in out
    assert "12 words in" in out


@pytest.mark.parametrize("value", [",", ""])
def test_empty_ids_is_a_usage_error(tmp_path, capsys, value):
    make_data(tmp_path, [(names(1)[0], "noun")])
    with pytest.raises(SystemExit) as e:
        main(["--data", str(tmp_path), "card-batches", "--ids", value])
    assert e.value.code == 2
    assert "no ids given" in capsys.readouterr().err


def test_ids_are_deduplicated_in_order(tmp_path, capsys):
    a, b = names(2)
    paths = make_data(tmp_path, [(a, "noun"), (b, "noun")])
    assert main(["--data", str(tmp_path), "card-batches", "--ids", f"{b},{a},{b}"]) == 0
    assert [x["word"] for x in read_json(paths.cards_dir / "001.in.json")] == [b, a]


def test_waiting_line_lists_only_earlier_batches(tmp_path, capsys):
    a, b = names(2)
    paths = make_data(tmp_path, [(a, "noun"), (b, "noun")])
    write_batch(paths, 5, None, [a])
    assert main(["--data", str(tmp_path), "card-batches"]) == 0
    out = capsys.readouterr().out
    assert "1 new batches" in out
    assert "waiting for output (earlier batches): 005\n" in out
    assert "006" not in out.split("waiting for output")[1]


def test_no_waiting_line_when_only_new_batches(tmp_path, capsys):
    paths = make_data(tmp_path, [(names(1)[0], "noun")])
    assert main(["--data", str(tmp_path), "card-batches"]) == 0
    assert "waiting for output" not in capsys.readouterr().out


def test_stuck_line_only_in_default_mode(tmp_path, capsys):
    a, b = names(2)
    paths = make_data(tmp_path, [(a, "noun"), (b, "noun")])
    paths.stuck.parent.mkdir(parents=True, exist_ok=True)
    paths.stuck.write_text("old\n", encoding="utf-8")
    assert main(["--data", str(tmp_path), "card-batches", "--ids", a]) == 0
    assert "stuck words" not in capsys.readouterr().out


def test_os_errors_go_to_stderr(tmp_path, capsys):
    make_data(tmp_path, [(names(1)[0], "noun")])
    assert main(["--data", str(tmp_path), "validate", "--file", str(tmp_path)]) == 1
    assert capsys.readouterr().err.startswith("error: ")


def test_validate_file_with_no_cards_fails(tmp_path, capsys):
    a = names(1)[0]
    paths = make_data(tmp_path, [(a, "noun")])
    paths.cards_dir.mkdir(parents=True)
    (paths.cards_dir / "001.json").write_text("{}", encoding="utf-8")
    assert main(["--data", str(tmp_path), "validate", "--file", str(paths.cards_dir / "001.json")]) == 1
    assert "no cards in the file" in capsys.readouterr().out
