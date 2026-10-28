import os

import pytest

from content.files import ContentError, read_json, write_json


def test_json_roundtrip_keeps_cyrillic(tmp_path):
    path = tmp_path / "a" / "x.json"
    write_json(path, {"text": "дом"})
    assert '"дом"' in path.read_text(encoding="utf-8")
    assert read_json(path) == {"text": "дом"}


def test_tab_indent(tmp_path):
    path = tmp_path / "x.json"
    write_json(path, [{"a": 1}], indent="\t")
    assert path.read_text(encoding="utf-8") == '[\n\t{\n\t\t"a": 1\n\t}\n]\n'


def test_invalid_json_is_a_content_error(tmp_path):
    path = tmp_path / "x.json"
    path.write_text("{oops", encoding="utf-8")
    with pytest.raises(ContentError, match="x.json: invalid JSON"):
        read_json(path)


def test_missing_file_names_the_full_path(tmp_path):
    path = tmp_path / "x.json"
    with pytest.raises(ContentError, match=f"{path}: not found"):
        read_json(path)


def test_non_utf8_file_is_a_content_error(tmp_path):
    path = tmp_path / "x.json"
    path.write_bytes(b'{"a": "\xff\xfe"}')
    with pytest.raises(ContentError, match="x.json: not UTF-8 text"):
        read_json(path)


def test_write_json_replaces_file_and_leaves_no_temp(tmp_path):
    path = tmp_path / "x.json"
    path.write_text('"old"', encoding="utf-8")
    write_json(path, {"a": 1})
    assert read_json(path) == {"a": 1}
    assert [p.name for p in tmp_path.iterdir()] == ["x.json"]


def test_write_json_goes_through_a_temp_file(tmp_path, monkeypatch):
    path = tmp_path / "x.json"
    calls = []
    real_replace = os.replace
    monkeypatch.setattr(os, "replace", lambda src, dst: (calls.append((src, dst)), real_replace(src, dst)))
    write_json(path, [1])
    assert calls == [(path.with_name("x.json.tmp"), path)]
