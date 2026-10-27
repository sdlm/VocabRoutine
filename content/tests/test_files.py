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
