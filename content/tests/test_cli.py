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
