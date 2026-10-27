import pytest
from helpers import make_csv

from content.files import ContentError
from content.ngsl import Lemma, read_ngsl
from content.paths import DEFAULT_DATA, Paths


def test_reads_lemmas_by_rank(tmp_path):
    paths = make_csv(tmp_path, ["the", "I", "house"])
    assert read_ngsl(paths.csv) == [Lemma("the", 1), Lemma("I", 2), Lemma("house", 3)]


def test_rejects_excel_upper_case(tmp_path):
    paths = make_csv(tmp_path, ["the", "TRUE"])
    with pytest.raises(ContentError, match="upper-case lemmas TRUE"):
        read_ngsl(paths.csv)


def test_repository_csv_is_fixed():
    lemmas = read_ngsl(Paths(DEFAULT_DATA).csv)
    assert len(lemmas) == 2809
    assert Lemma("true", 478) in lemmas
    assert Lemma("false", 2098) in lemmas
