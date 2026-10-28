"""`uv run --project content content <step>`: the NGSL card pipeline (see the generation spec)."""

import argparse
import sys
from pathlib import Path

from .assemble import assemble
from .batches import card_batches
from .classify import classify_batches, merge_pos
from .files import ContentError
from .paths import DEFAULT_DATA, Paths
from .store import pending
from .validate import file_card_count, validate_all, validate_file


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        return args.run(Paths(args.data), args)
    except (ContentError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="content", description="NGSL card generation pipeline")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="data directory (default: the repository's data/)")
    sub = parser.add_subparsers(required=True)

    sub.add_parser("classify-batches", help="step 1: NGSL in batches of 200").set_defaults(run=_classify_batches)

    p = sub.add_parser("merge-pos", help="step 3: pos.json and dropped.md")
    p.add_argument("--force", action="store_true", help="overwrite pos.json with its manual edits")
    p.set_defaults(run=_merge_pos)

    p = sub.add_parser("card-batches", help="step 4: card input batches of 25")
    choice = p.add_mutually_exclusive_group()
    choice.add_argument("--pilot", action="store_true", help="25 words spread over the frequency list")
    choice.add_argument("--ids", type=_id_list, help="comma-separated ids, even if their cards are valid")
    p.add_argument("--limit", type=int, help="at most this many batches")
    p.set_defaults(run=_card_batches)

    p = sub.add_parser("validate", help="step 6: check cards")
    p.add_argument("--file", type=Path, help="check one output file instead of every latest card")
    p.set_defaults(run=_validate)

    sub.add_parser("assemble", help="step 7: data/words.json").set_defaults(run=_assemble)
    return parser


def _id_list(value: str) -> list[str]:
    ids = list(dict.fromkeys(x.strip().lower() for x in value.split(",") if x.strip()))
    if not ids:
        raise argparse.ArgumentTypeError("no ids given")
    return ids


def _classify_batches(paths: Paths, args) -> int:
    created = classify_batches(paths)
    print(f"{len(created)} batches in {paths.classify_dir}")
    return 0


def _merge_pos(paths: Paths, args) -> int:
    dropped = merge_pos(paths, force=args.force)
    print(f"dropped {dropped}; review {paths.dropped}")
    return 0


def _card_batches(paths: Paths, args) -> int:
    earlier = pending(paths)  # before this run adds new batches
    created = card_batches(paths, pilot=args.pilot, ids=args.ids, limit=args.limit)
    for path in created:
        print(path)
    print(f"{len(created)} new batches")
    if earlier:
        print("waiting for output (earlier batches): " + ", ".join(f"{n:03}" for n in earlier))
    if not (args.pilot or args.ids) and paths.stuck.exists():
        print(f"stuck words: {paths.stuck}")
    return 0


def _validate(paths: Paths, args) -> int:
    if args.file:
        report = validate_file(paths, args.file)
        for id_, errors in report.items():
            print(f"{id_}:")
            for error in errors:
                print(f"  {error}")
        total = file_card_count(args.file)
        if total == 0:
            print("no cards in the file")
            return 1
        print(f"{len(report)} of {total} cards invalid" if report else f"all {total} cards valid")
        return 1 if report else 0
    checked, report = validate_all(paths)
    print(f"{checked - len(report)} valid, {len(report)} invalid; report: {paths.report}")
    return 1 if report else 0


def _assemble(paths: Paths, args) -> int:
    count = assemble(paths)
    print(f"{count} words in {paths.words}")
    return 0
