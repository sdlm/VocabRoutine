from content.forms import lemma_forms


def test_irregular_lemma_forms():
    assert lemma_forms("find", {"find", "found", "house"}) == ["found"]
    assert lemma_forms("person", {"person", "people"}) == ["people"]
    assert lemma_forms("little", {"little", "less", "least"}) == ["least", "less"]
    assert lemma_forms("far", {"far", "further"}) == ["further"]


def test_regular_lemma_forms():
    ids = {"build", "building", "study", "studies", "stop", "stopped", "make", "making", "happy", "happier"}
    assert lemma_forms("build", ids) == ["building"]
    assert lemma_forms("study", ids) == ["studies"]
    assert lemma_forms("stop", ids) == ["stopped"]
    assert lemma_forms("make", ids) == ["making"]
    assert lemma_forms("happy", ids) == ["happier"]


def test_word_is_not_its_own_lemma_form():
    assert lemma_forms("house", {"house"}) == []


def test_bare_d_r_st_only_after_final_e():
    ids = {"car", "card", "fun", "fund", "win", "wind", "use", "used", "user", "late", "latest"}
    assert lemma_forms("car", ids) == []
    assert lemma_forms("fun", ids) == []
    assert lemma_forms("win", ids) == []
    assert lemma_forms("use", ids) == ["used", "user"]
    assert lemma_forms("late", ids) == ["latest"]
