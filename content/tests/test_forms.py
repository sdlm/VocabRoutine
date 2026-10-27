from content.forms import lemma_forms


def test_irregular_lemma_forms():
    assert lemma_forms("find", {"find", "found", "house"}) == ["found"]
    assert lemma_forms("person", {"person", "people"}) == ["people"]
    assert lemma_forms("little", {"little", "less", "least"}) == ["least", "less"]


def test_regular_lemma_forms():
    ids = {"build", "building", "study", "studies", "stop", "stopped", "make", "making", "happy", "happier"}
    assert lemma_forms("build", ids) == ["building"]
    assert lemma_forms("study", ids) == ["studies"]
    assert lemma_forms("stop", ids) == ["stopped"]
    assert lemma_forms("make", ids) == ["making"]
    assert lemma_forms("happy", ids) == ["happier"]


def test_word_is_not_its_own_lemma_form():
    assert lemma_forms("house", {"house"}) == []
