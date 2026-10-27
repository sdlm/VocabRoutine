"""Where the pipeline reads and writes, relative to the data directory."""

from dataclasses import dataclass
from pathlib import Path

# content/src/content/paths.py -> repository root
DEFAULT_DATA = Path(__file__).resolve().parents[3] / "data"


@dataclass(frozen=True)
class Paths:
    data: Path

    @property
    def csv(self) -> Path:
        return self.data / "wordlists" / "NGSL_12_stats.csv"

    @property
    def gen(self) -> Path:
        return self.data / "gen"

    @property
    def classify_dir(self) -> Path:
        return self.gen / "classify"

    @property
    def cards_dir(self) -> Path:
        return self.gen / "cards"

    @property
    def pos(self) -> Path:
        return self.gen / "pos.json"

    @property
    def dropped(self) -> Path:
        return self.gen / "dropped.md"

    @property
    def report(self) -> Path:
        return self.gen / "report.json"

    @property
    def stuck(self) -> Path:
        return self.gen / "stuck.md"

    @property
    def words(self) -> Path:
        return self.data / "words.json"
