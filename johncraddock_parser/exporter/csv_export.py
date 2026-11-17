"""CSV exporters including Bamper-oriented import file."""

from __future__ import annotations

import csv
import json
import logging
from pathlib import Path
from typing import Any, Dict, List

from database.schema import Database
from parser.images import image_paths_for_export

logger = logging.getLogger(__name__)


PRODUCT_COLUMNS = [
    "id",
    "article",
    "oem",
    "name",
    "brand",
    "category_path",
    "price",
    "price_ex_vat",
    "currency",
    "availability",
    "description",
    "fitment",
    "cross_numbers",
    "image_main_path",
    "image_extra_paths",
    "url",
    "parse_date",
]


def _write_csv(path: Path, fieldnames: List[str], rows: List[Dict[str, Any]], delimiter: str = ",") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, delimiter=delimiter, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") if row.get(k, "") is not None else "" for k in fieldnames})


def export_all(db: Database, exports_dir: Path, mapping_path: Path) -> Dict[str, Path]:
    exports_dir.mkdir(parents=True, exist_ok=True)
    products: List[Dict[str, Any]] = []
    for row in db.list_products():
        item = dict(row)
        imgs = image_paths_for_export(db, int(row["id"]))
        item.update(imgs)
        # sqlite Row -> plain
        products.append({k: item.get(k, "") for k in PRODUCT_COLUMNS})

    products_path = exports_dir / "products.csv"
    _write_csv(products_path, PRODUCT_COLUMNS, products)

    categories = [dict(r) for r in db.list_categories()]
    categories_path = exports_dir / "categories.csv"
    _write_csv(
        categories_path,
        ["id", "path", "name", "parent_path", "is_leaf", "discovered_at"],
        categories,
    )

    brands = [dict(r) for r in db.list_brands()]
    brands_path = exports_dir / "brands.csv"
    _write_csv(brands_path, ["id", "name"], brands)

    bamper_path = export_bamper(products, exports_dir / "bamper_import.csv", mapping_path)

    return {
        "products": products_path,
        "categories": categories_path,
        "brands": brands_path,
        "bamper": bamper_path,
    }


def export_bamper(products: List[Dict[str, Any]], path: Path, mapping_path: Path) -> Path:
    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    columns = mapping["columns"]
    fieldnames = [c["bamper"] for c in columns]
    delim = mapping.get("bamper_csv", {}).get("delimiter", ";")
    encoding = mapping.get("bamper_csv", {}).get("encoding", "utf-8-sig")

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding=encoding, newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, delimiter=delim, extrasaction="ignore")
        writer.writeheader()
        for product in products:
            out: Dict[str, Any] = {}
            for col in columns:
                src = col["source"]
                out[col["bamper"]] = product.get(src, "") or ""
            writer.writerow(out)
    logger.info("Wrote Bamper CSV %s (%d rows)", path, len(products))
    return path


def write_quality_report(
    path: Path,
    *,
    categories_touched: int,
    products_parsed: int,
    images_downloaded: int,
    errors: List[str],
    products: List[Dict[str, Any]],
) -> Path:
    missing_name = sum(1 for p in products if not p.get("name"))
    missing_article = sum(1 for p in products if not p.get("article"))
    missing_price = sum(1 for p in products if not p.get("price"))
    missing_image = sum(1 for p in products if not p.get("image_main_path"))
    with_brand = sum(1 for p in products if p.get("brand"))
    lines = [
        "# John Craddock Stage 2 — parse report",
        "",
        f"- Categories touched: {categories_touched}",
        f"- Products parsed: {products_parsed}",
        f"- Images newly downloaded: {images_downloaded}",
        f"- Errors: {len(errors)}",
        f"- Missing name: {missing_name}",
        f"- Missing article: {missing_article}",
        f"- Missing price: {missing_price}",
        f"- Missing main image path: {missing_image}",
        f"- With inferred brand: {with_brand}",
        "",
        "## Errors",
    ]
    if errors:
        lines.extend(f"- {e}" for e in errors[:50])
    else:
        lines.append("- (none)")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path
