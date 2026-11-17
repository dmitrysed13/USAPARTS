"""SQLite schema and access helpers (resume-friendly)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    name TEXT,
    parent_path TEXT,
    is_leaf INTEGER DEFAULT 0,
    discovered_at TEXT
);

CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    article TEXT,
    brand TEXT,
    oem TEXT,
    name TEXT,
    description TEXT,
    category_path TEXT,
    price TEXT,
    price_ex_vat TEXT,
    currency TEXT,
    availability TEXT,
    fitment TEXT,
    cross_numbers TEXT,
    parse_date TEXT,
    raw_json TEXT,
    UNIQUE(article, brand)
);

CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    source_url TEXT NOT NULL,
    local_path TEXT,
    role TEXT,
    sha256 TEXT,
    UNIQUE(product_id, source_url),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS image_hashes (
    sha256 TEXT PRIMARY KEY,
    local_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scrape_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT,
    started_at TEXT,
    finished_at TEXT,
    products_parsed INTEGER DEFAULT 0,
    images_downloaded INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_article ON products(article);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_images_sha ON images(sha256);
"""


class Database:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        self.conn = sqlite3.connect(str(path))
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA_SQL)
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    def upsert_category(
        self,
        path: str,
        name: str = "",
        parent_path: str = "",
        is_leaf: bool = False,
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self.conn.execute(
            """
            INSERT INTO categories(path, name, parent_path, is_leaf, discovered_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET
                name=excluded.name,
                parent_path=excluded.parent_path,
                is_leaf=CASE
                    WHEN excluded.is_leaf = 1 OR categories.is_leaf = 1 THEN 1
                    ELSE 0
                END
            """,
            (path, name, parent_path, int(is_leaf), now),
        )
        self.conn.commit()

    def ensure_brand(self, name: str) -> None:
        name = (name or "").strip()
        if not name:
            return
        self.conn.execute(
            "INSERT OR IGNORE INTO brands(name) VALUES (?)",
            (name,),
        )
        self.conn.commit()

    def get_product_by_url(self, url: str) -> Optional[sqlite3.Row]:
        cur = self.conn.execute("SELECT * FROM products WHERE url = ?", (url,))
        return cur.fetchone()

    def upsert_product(self, data: Dict[str, Any]) -> int:
        existing = self.get_product_by_url(data["url"])
        fields = {
            "url": data.get("url", ""),
            "article": data.get("article") or None,
            "brand": data.get("brand") or None,
            "oem": data.get("oem") or None,
            "name": data.get("name") or "",
            "description": data.get("description") or "",
            "category_path": data.get("category_path") or "",
            "price": data.get("price") or "",
            "price_ex_vat": data.get("price_ex_vat") or "",
            "currency": data.get("currency") or "",
            "availability": data.get("availability") or "",
            "fitment": data.get("fitment") or "",
            "cross_numbers": data.get("cross_numbers") or "",
            "parse_date": data.get("parse_date") or "",
            "raw_json": json.dumps(data.get("raw") or {}, ensure_ascii=False),
        }
        if existing:
            self.conn.execute(
                """
                UPDATE products SET
                    article=?, brand=?, oem=?, name=?, description=?,
                    category_path=?, price=?, price_ex_vat=?, currency=?,
                    availability=?, fitment=?, cross_numbers=?, parse_date=?,
                    raw_json=?
                WHERE id=?
                """,
                (
                    fields["article"],
                    fields["brand"],
                    fields["oem"],
                    fields["name"],
                    fields["description"],
                    fields["category_path"],
                    fields["price"],
                    fields["price_ex_vat"],
                    fields["currency"],
                    fields["availability"],
                    fields["fitment"],
                    fields["cross_numbers"],
                    fields["parse_date"],
                    fields["raw_json"],
                    existing["id"],
                ),
            )
            self.conn.commit()
            pid = int(existing["id"])
        else:
            # Avoid UNIQUE(oem) collisions when oem empty/duplicated: store NULL for empty
            cur = self.conn.execute(
                """
                INSERT INTO products(
                    url, article, brand, oem, name, description, category_path,
                    price, price_ex_vat, currency, availability, fitment,
                    cross_numbers, parse_date, raw_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    fields["url"],
                    fields["article"],
                    fields["brand"],
                    fields["oem"],
                    fields["name"],
                    fields["description"],
                    fields["category_path"],
                    fields["price"],
                    fields["price_ex_vat"],
                    fields["currency"],
                    fields["availability"],
                    fields["fitment"],
                    fields["cross_numbers"],
                    fields["parse_date"],
                    fields["raw_json"],
                ),
            )
            self.conn.commit()
            pid = int(cur.lastrowid)

        if fields["brand"]:
            self.ensure_brand(fields["brand"])
        return pid

    def find_hash(self, sha256: str) -> Optional[str]:
        cur = self.conn.execute(
            "SELECT local_path FROM image_hashes WHERE sha256 = ?",
            (sha256,),
        )
        row = cur.fetchone()
        return row["local_path"] if row else None

    def register_image(
        self,
        product_id: int,
        source_url: str,
        local_path: str,
        role: str,
        sha256: str,
    ) -> None:
        self.conn.execute(
            """
            INSERT OR REPLACE INTO images(product_id, source_url, local_path, role, sha256)
            VALUES (?, ?, ?, ?, ?)
            """,
            (product_id, source_url, local_path, role, sha256),
        )
        self.conn.execute(
            """
            INSERT OR IGNORE INTO image_hashes(sha256, local_path) VALUES (?, ?)
            """,
            (sha256, local_path),
        )
        self.conn.commit()

    def list_products(self) -> List[sqlite3.Row]:
        return list(self.conn.execute("SELECT * FROM products ORDER BY id"))

    def list_categories(self) -> List[sqlite3.Row]:
        return list(self.conn.execute("SELECT * FROM categories ORDER BY path"))

    def list_brands(self) -> List[sqlite3.Row]:
        return list(self.conn.execute("SELECT * FROM brands ORDER BY name"))

    def list_images_for_product(self, product_id: int) -> List[sqlite3.Row]:
        return list(
            self.conn.execute(
                "SELECT * FROM images WHERE product_id = ? ORDER BY id",
                (product_id,),
            )
        )

    def start_run(self, mode: str) -> int:
        cur = self.conn.execute(
            "INSERT INTO scrape_runs(mode, started_at) VALUES (?, ?)",
            (mode, datetime.now(timezone.utc).isoformat()),
        )
        self.conn.commit()
        return int(cur.lastrowid)

    def finish_run(
        self,
        run_id: int,
        products_parsed: int,
        images_downloaded: int,
        errors: int,
        notes: str = "",
    ) -> None:
        self.conn.execute(
            """
            UPDATE scrape_runs SET
                finished_at=?, products_parsed=?, images_downloaded=?, errors=?, notes=?
            WHERE id=?
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                products_parsed,
                images_downloaded,
                errors,
                notes,
                run_id,
            ),
        )
        self.conn.commit()
