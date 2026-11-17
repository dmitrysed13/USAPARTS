"""Image download with SHA256 dedupe."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import urlparse

from database.schema import Database
from utils.http import PoliteClient

logger = logging.getLogger(__name__)


def _extension_from_url(url: str) -> str:
    path = urlparse(url).path
    suffix = Path(path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return ".jpg"


def download_product_images(
    client: PoliteClient,
    db: Database,
    product_id: int,
    image_urls: List[str],
    images_dir: Path,
) -> Tuple[int, List[str]]:
    """Download images into images/{product_id:06d}/. Returns (new_downloads, errors)."""
    errors: List[str] = []
    downloaded = 0
    if not image_urls:
        return 0, errors

    product_dir = images_dir / f"{product_id:06d}"
    product_dir.mkdir(parents=True, exist_ok=True)

    for idx, url in enumerate(image_urls):
        role = "main" if idx == 0 else f"extra_{idx}"
        ext = _extension_from_url(url)
        filename = "main.jpg" if idx == 0 else f"extra_{idx}{ext if ext != '.jpg' else '.jpg'}"
        # normalize extras to .jpg naming as brief suggests
        if idx > 0:
            filename = f"extra_{idx}.jpg"
        dest = product_dir / filename

        data = client.get_bytes(url)
        if data is None:
            errors.append(f"image_fetch_failed:{url}")
            continue

        sha = hashlib.sha256(data).hexdigest()
        existing = db.find_hash(sha)
        if existing:
            # Reuse prior file path for dedupe; still record link for this product
            db.register_image(product_id, url, existing, role, sha)
            logger.info("Dedupe image %s -> %s", url, existing)
            continue

        dest.write_bytes(data)
        rel = str(Path("images") / f"{product_id:06d}" / filename)
        db.register_image(product_id, url, rel, role, sha)
        downloaded += 1
        logger.info("Saved %s (%s)", rel, role)

    return downloaded, errors


def image_paths_for_export(db: Database, product_id: int) -> Dict[str, str]:
    rows = db.list_images_for_product(product_id)
    main = ""
    extras: List[str] = []
    for row in rows:
        if row["role"] == "main" and not main:
            main = row["local_path"] or ""
        elif row["role"] != "main":
            if row["local_path"]:
                extras.append(row["local_path"])
    if not main and rows:
        main = rows[0]["local_path"] or ""
        extras = [r["local_path"] for r in rows[1:] if r["local_path"]]
    return {
        "image_main_path": main,
        "image_extra_paths": "|".join(extras),
    }
