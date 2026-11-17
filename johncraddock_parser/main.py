#!/usr/bin/env python3
"""John Craddock Ltd catalog parser — Stages 1–2 (test only by default)."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import List, Set

# Allow running as `python main.py` from package dir
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (
    DB_PATH,
    EXPORTS_DIR,
    FULL_RUN_UNLOCKED,
    IMAGES_DIR,
    LOGS_DIR,
    MAPPING_PATH,
    OUTPUT_DIR,
    TEST_CATEGORY_LIMIT,
    TEST_PRODUCT_LIMIT,
    TEST_SEED_CATEGORIES,
)
from database.schema import Database
from exporter.csv_export import export_all, write_quality_report
from parser.categories import expand_to_leaves, iter_listing_product_urls
from parser.images import download_product_images, image_paths_for_export
from parser.products import parse_product_html
from utils.http import PoliteClient


def setup_logging() -> Path:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOGS_DIR / "scrape.log"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(log_path, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    return log_path


def refuse_full(mode: str) -> int:
    print(
        f"Mode '{mode}' is locked until Stage 3 human unlock "
        f"(FULL_RUN_UNLOCKED={FULL_RUN_UNLOCKED}). Use: python main.py test",
        file=sys.stderr,
    )
    return 2


def run_test(limit: int, category_limit: int) -> int:
    logger = logging.getLogger("main")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

    db = Database(DB_PATH)
    run_id = db.start_run("test")
    errors: List[str] = []
    images_downloaded = 0
    products_parsed = 0
    categories_touched = 0

    with PoliteClient() as client:
        leaves, leaf_errors = expand_to_leaves(
            client, TEST_SEED_CATEGORIES, max_categories=category_limit
        )
        errors.extend(leaf_errors)
        for leaf in leaves:
            db.upsert_category(leaf.path, leaf.name, leaf.parent_path, is_leaf=True)
        categories_touched = len(leaves)
        logger.info("Leaf categories ready: %d", categories_touched)

        remaining = limit
        seen_urls: Set[str] = set()
        for leaf in leaves:
            if remaining <= 0:
                break
            cards, list_errors = iter_listing_product_urls(
                client, leaf.path, limit=remaining, already=seen_urls
            )
            errors.extend(list_errors)
            for card in cards:
                html = client.get_text(card.url)
                if html is None:
                    errors.append(f"pdp_failed:{card.url}")
                    continue
                try:
                    data = parse_product_html(
                        html, card.url, listing_category=card.category_path or leaf.path
                    )
                except Exception as exc:  # noqa: BLE001 — isolate one bad PDP
                    errors.append(f"parse_error:{card.url}:{exc}")
                    logger.exception("Parse failed for %s", card.url)
                    continue

                product_id = db.upsert_product(data)
                new_imgs, img_errors = download_product_images(
                    client,
                    db,
                    product_id,
                    data.get("image_urls") or [],
                    IMAGES_DIR,
                )
                images_downloaded += new_imgs
                errors.extend(img_errors)
                products_parsed += 1
                remaining -= 1
                logger.info(
                    "[%d/%d] %s | %s",
                    products_parsed,
                    limit,
                    data.get("article"),
                    data.get("name", "")[:60],
                )

    paths = export_all(db, EXPORTS_DIR, MAPPING_PATH)
    # also mirror key CSVs at output/ root for convenience
    for key, src in paths.items():
        dest = OUTPUT_DIR / src.name
        dest.write_bytes(src.read_bytes())

    products_for_report = []
    for row in db.list_products():
        item = dict(row)
        item.update(image_paths_for_export(db, int(row["id"])))
        products_for_report.append(item)

    report_path = write_quality_report(
        OUTPUT_DIR / "parse_report.md",
        categories_touched=categories_touched,
        products_parsed=products_parsed,
        images_downloaded=images_downloaded,
        errors=errors,
        products=products_for_report,
    )

    notes = f"categories={categories_touched}; report={report_path}"
    db.finish_run(run_id, products_parsed, images_downloaded, len(errors), notes)
    db.close()

    logger.info(
        "Done. products=%d images=%d errors=%d categories=%d",
        products_parsed,
        images_downloaded,
        len(errors),
        categories_touched,
    )
    logger.info("Exports: %s", paths)
    return 0 if products_parsed > 0 else 1


def main(argv: List[str] | None = None) -> int:
    setup_logging()
    parser = argparse.ArgumentParser(description="John Craddock → Bamper parser")
    parser.add_argument(
        "mode",
        choices=["test", "full", "discover-all", "export-only"],
        help="test = Stage 2 (20–30 products). full/discover-all locked until unlock.",
    )
    parser.add_argument("--limit", type=int, default=TEST_PRODUCT_LIMIT)
    parser.add_argument("--categories", type=int, default=TEST_CATEGORY_LIMIT)
    args = parser.parse_args(argv)

    if args.mode in ("full", "discover-all"):
        if not FULL_RUN_UNLOCKED:
            return refuse_full(args.mode)
        return refuse_full(args.mode)  # still refuse until Stage 3 implemented

    if args.mode == "export-only":
        db = Database(DB_PATH)
        paths = export_all(db, EXPORTS_DIR, MAPPING_PATH)
        for src in paths.values():
            (OUTPUT_DIR / src.name).write_bytes(src.read_bytes())
        db.close()
        print(paths)
        return 0

    # clamp test limit to Stage 2 band
    limit = max(20, min(args.limit, 30))
    return run_test(limit=limit, category_limit=args.categories)


if __name__ == "__main__":
    raise SystemExit(main())
