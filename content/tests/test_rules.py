import pytest
from helpers import make_card

from content.dictionary import DictWord
from content.rules import FIELDS, validate_card

HOUSE = DictWord("house", "noun", "A1", 165)
FIND = DictWord("find", "verb", "A1", 81)
FOUND = DictWord("found", "verb", "C2", 2807)
LEMMAS = {"house", "find", "found", "home"}


def house_card():
    return make_card("house", ["houses"])


def test_good_card_passes():
    assert validate_card(HOUSE, house_card(), LEMMAS) == []


def test_card_must_be_an_object():
    assert validate_card(HOUSE, [], LEMMAS) == ["card: not an object"]


CASES = [
    ("missing field", lambda c: c.pop("similar"), "card: missing similar"),
    ("extra field", lambda c: c.update(id="house"), "card: unexpected id"),
    ("form with space", lambda c: c.update(forms=["big houses"]), "forms: 'big houses' is not a plain word"),
    ("form is the word", lambda c: c.update(forms=["House"]), "forms: contains the word itself"),
    ("duplicate forms", lambda c: c.update(forms=["houses", "Houses"]), "forms: duplicates"),
    ("register", lambda c: c.update(register="casual"), "register: 'casual' is not one of"),
    ("share not int", lambda c: c["translations"][0].update(share=85.0), "translations: need 1+ items"),
    ("shares sum", lambda c: c["translations"][1].update(share=10), "translations: shares sum to 95, not 100"),
    ("shares order", lambda c: c.update(translations=[{"text": "жильё", "share": 15}, {"text": "дом", "share": 85}]),
     "translations: not sorted by share"),
    ("short definition", lambda c: c.update(definition="A house."), "definition: must be longer than 10 characters"),
    ("two examples", lambda c: c["examples"].pop(), "examples: 2 items, need 3–4"),
    ("five examples", lambda c: c["examples"].extend([{"en": "A house.", "ru": "Дом."}] * 2), "examples: 5 items"),
    ("example without word", lambda c: c["examples"][0].update(en="We live by the lake."),
     "examples[0]: no form of the word"),
    ("two collocations", lambda c: c["collocations"].pop(), "collocations: need 3+ strings"),
    ("collocation without word", lambda c: c["collocations"].__setitem__(0, "buy a flat"),
     "collocations[0]: no form of the word"),
    ("one similar", lambda c: c["similar"].pop(), "similar: 1 items, need 2+"),
    ("similar is the word", lambda c: c["similar"][1].update(word="House"), "similar[1]: is the word itself"),
    ("short note", lambda c: c["similar"][0].update(note="место"), "similar[0]: note must be longer than 10"),
    ("note starts with word", lambda c: c["similar"][0].update(note="alpha — место, где ты живёшь"),
     "similar[0]: note starts with 'alpha'"),
    ("nine cloze", lambda c: c["cloze"].pop(), "cloze: 9 sentences, need exactly 10"),
    ("two gaps", lambda c: c["cloze"][0].update(en="The {{house}} and the {{houses}}."), "cloze[0]: 2 gaps"),
    ("no gap", lambda c: c["cloze"][0].update(en="The house."), "cloze[0]: 0 gaps"),
    ("unknown form", lambda c: c["cloze"][0].update(en="Big {{homes}} here."),
     "cloze[0]: gap 'homes' is not the word or one of its forms"),
    ("repeats example", lambda c: c["cloze"][0].update(en="Example 0 with {{house}}."), "cloze[0]: repeats an example"),
    ("repeats cloze", lambda c: c["cloze"][1].update(en="sentence 0 with {{House}}."), "cloze[1]: repeats cloze[0]"),
    ("empty ru", lambda c: c["cloze"][0].update(ru=" "), "cloze[0]: ru must be a non-empty string"),
    ("two options", lambda c: c["cloze"][0]["options"].pop(), "cloze[0]: options must be 3 different strings"),
    ("same options", lambda c: c["cloze"][0].update(options=["room", "Room", "road"]),
     "cloze[0]: options must be 3 different strings"),
    ("option is answer", lambda c: c["cloze"][0].update(options=["room", "House", "road"]),
     "cloze[0]: options contain the answer 'house'"),
    ("stray braces", lambda c: c["cloze"][0].update(en="The {{house}} is {{big."),
     "cloze[0]: stray braces outside the gap"),
    ("braces in example", lambda c: c["examples"][0].update(en="A {{house}} here."),
     "examples[0]: braces are only for Cloze gaps"),
    ("padded option is answer", lambda c: c["cloze"][0].update(options=["house ", "room", "road"]),
     "cloze[0]: options contain the answer 'house'"),
    ("blank option", lambda c: c["cloze"][0].update(options=[" ", "room", "road"]),
     "cloze[0]: options must be 3 different strings"),
    ("padded same options", lambda c: c["cloze"][0].update(options=["room ", "Room", "road"]),
     "cloze[0]: options must be 3 different strings"),
]


@pytest.mark.parametrize("name, mutate, expected", CASES, ids=[case[0] for case in CASES])
def test_rule(name, mutate, expected):
    card = house_card()
    mutate(card)
    errors = validate_card(HOUSE, card, LEMMAS)
    assert any(expected in e for e in errors), errors


def test_gap_cannot_be_another_lemma_but_forms_and_examples_can():
    card = make_card("find", ["finds", "found", "finding"])
    card["examples"][0]["en"] = "She found a wallet."
    assert validate_card(FIND, card, LEMMAS) == []
    card["cloze"][2]["en"] = "We {{found}} it."
    assert validate_card(FIND, card, LEMMAS) == ["cloze[2]: gap 'found' is the lemma of another word"]


def test_own_lemma_is_a_fine_gap():
    assert validate_card(FOUND, make_card("found", ["founded"]), LEMMAS) == []


def test_missing_field_does_not_hide_other_errors():
    card = house_card()
    del card["similar"]
    card["register"] = "casual"
    errors = validate_card(HOUSE, card, LEMMAS)
    assert "card: missing similar" in errors
    assert any("register: 'casual'" in e for e in errors), errors


def test_missing_forms_still_checks_the_rest():
    card = house_card()
    del card["forms"]
    card["definition"] = "short"
    errors = validate_card(HOUSE, card, LEMMAS)
    assert "card: missing forms" in errors
    assert any(e.startswith("definition:") for e in errors), errors
    assert not any(e.startswith(("examples", "cloze")) for e in errors), errors


def test_sentence_without_gap_still_gets_ru_and_options_checked():
    card = house_card()
    card["cloze"][0].update(en="No gap here.", ru=" ", options=["room", "room", "road"])
    errors = validate_card(HOUSE, card, LEMMAS)
    assert any("cloze[0]: 0 gaps" in e for e in errors), errors
    assert any("cloze[0]: ru must be a non-empty string" in e for e in errors), errors
    assert any("cloze[0]: options must be 3 different strings" in e for e in errors), errors
    assert not any("options contain the answer" in e for e in errors), errors


def test_missing_word_message_explains_possessives():
    card = house_card()
    card["examples"][0]["en"] = "We live by the lake."
    card["collocations"][0] = "buy a flat"
    errors = validate_card(HOUSE, card, LEMMAS)
    hint = "no form of the word as a separate word in"
    assert any(e.startswith("examples[0]: " + hint) and "(possessives like house's do not count)" in e for e in errors)
    assert any(e.startswith("collocations[0]: " + hint) and "(possessives like house's do not count)" in e
               for e in errors)


BAD_VALUES = [None, 0, True, "x", [], {}, [None], [1], [{}]]


@pytest.mark.parametrize("value", BAD_VALUES, ids=repr)
@pytest.mark.parametrize("field", FIELDS)
def test_wrong_type_never_crashes(field, value):
    if field == "forms" and value == []:
        pytest.skip("an empty forms list is a valid value")
    card = house_card()
    card[field] = value
    errors = validate_card(HOUSE, card, LEMMAS)
    assert errors and all(isinstance(e, str) for e in errors)
