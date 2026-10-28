import json
from pathlib import Path

from content.dictionary import DictWord
from content.forms import lemma_forms
from content.ngsl import read_ngsl
from content.paths import DEFAULT_DATA, Paths
from content.rules import validate_card

EXAMPLES = Path(__file__).resolve().parents[1] / "prompts" / "card-examples.json"


def test_prompt_examples_pass_the_validator():
    data = json.loads(EXAMPLES.read_text(encoding="utf-8"))
    words = {i["word"].lower(): DictWord(i["word"], i["pos"], i["level"], i["freqRank"]) for i in data["input"]}
    assert set(data["output"]) == set(words)
    lemma_ids = {x.lemma.lower() for x in read_ngsl(Paths(DEFAULT_DATA).csv)}
    for item in data["input"]:
        assert item["lemmaForms"] == lemma_forms(item["word"], lemma_ids), item["word"]
    for id_, card in data["output"].items():
        assert validate_card(words[id_], card, lemma_ids) == [], id_
