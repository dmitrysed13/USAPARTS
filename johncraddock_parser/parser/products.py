"""Product detail page parsing."""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from config import BASE_URL
from utils.text import clean_ws, infer_brand, schema_availability, unique_preserve

logger = logging.getLogger(__name__)


def _load_json_ld_product(soup: BeautifulSoup) -> Dict[str, Any]:
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text() or ""
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and data.get("@type") == "Product":
            return data
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get("@type") == "Product":
                    return item
    return {}


def _prefer_xl(url: str) -> str:
    if "/_images/_images/l/" in url:
        return url.replace("/_images/_images/l/", "/_images/_images/xl/")
    return url


def _abs(url: str) -> str:
    return urljoin(BASE_URL + "/", url)


def extract_gallery_images(soup: BeautifulSoup, ld: Dict[str, Any]) -> List[str]:
    urls: List[str] = []
    for a in soup.select("aside.gallery a[href]"):
        href = a.get("href") or ""
        if "/_images/_images/" in href:
            urls.append(_prefer_xl(_abs(href)))
    for img in soup.select("aside.gallery img[src]"):
        src = img.get("src") or ""
        if "/_images/_images/" in src:
            urls.append(_prefer_xl(_abs(src)))
    ld_image = ld.get("image")
    if isinstance(ld_image, str) and ld_image:
        urls.append(_prefer_xl(_abs(ld_image)))
    elif isinstance(ld_image, list):
        for item in ld_image:
            if isinstance(item, str):
                urls.append(_prefer_xl(_abs(item)))
    return unique_preserve(urls)


def extract_cross_numbers(soup: BeautifulSoup, primary_sku: str) -> str:
    crosses: List[str] = []
    for a in soup.select(".alternativeBrands a[href]"):
        text = clean_ws(a.get_text(" ", strip=True))
        # "STC488G - £49.60" → STC488G
        sku = text.split(" - ")[0].strip()
        if sku and sku.lower() != primary_sku.lower():
            crosses.append(sku)
    return "|".join(unique_preserve(crosses))


def extract_fitment_and_categories(soup: BeautifulSoup) -> tuple[str, str]:
    """Return (primary_category_path, fitment_summary)."""
    cat_paths: List[str] = []
    labels: List[str] = []
    for a in soup.select(".tags a[href], .productTags a[href]"):
        href = a.get("href") or ""
        text = clean_ws(a.get_text(" ", strip=True))
        if not href.startswith("http"):
            href = _abs(href)
        path = href.replace(BASE_URL, "")
        if any(
            seg in path
            for seg in (
                "/parts/",
                "/accessories/",
                "/series/",
                "/land-rover-",
                "/range-rover/",
            )
        ) and path.endswith("/"):
            cat_paths.append(path)
            if text:
                labels.append(text)
    primary = cat_paths[0] if cat_paths else ""
    fitment = " | ".join(unique_preserve(labels))
    return primary, fitment


def extract_ex_vat(soup: BeautifulSoup) -> str:
    el = soup.select_one(".price.exVat strong, .priceWrap .exVat strong")
    if not el:
        return ""
    m = re.search(r"[\d,.]+", el.get_text())
    return m.group(0).replace(",", "") if m else ""


def parse_product_html(html: str, url: str, listing_category: str = "") -> Dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    ld = _load_json_ld_product(soup)

    name = clean_ws(ld.get("name") or "")
    h1 = soup.select_one("h1")
    h1_text = clean_ws(h1.get_text(" ", strip=True) if h1 else "")
    article = clean_ws(str(ld.get("sku") or ld.get("mpn") or ""))
    if not article and h1_text:
        m = re.search(r"Part No\.\s*(.+)$", h1_text, re.I)
        if m:
            article = clean_ws(m.group(1))
    sku_input = soup.select_one("input[name=product_sku]")
    if not article and sku_input and sku_input.get("value"):
        article = clean_ws(sku_input["value"])

    if not name and h1_text:
        name = re.sub(r"\s*Part No\.\s*.*$", "", h1_text, flags=re.I).strip()

    brand = infer_brand(name)
    # Do not use data-brand="Standard Warehouse" as manufacturer

    offers = ld.get("offers") if isinstance(ld.get("offers"), dict) else {}
    price = clean_ws(str(offers.get("price") or ""))
    currency = clean_ws(str(offers.get("priceCurrency") or ""))
    availability = schema_availability(str(offers.get("availability") or ""))

    # Fallback availability text
    if not availability:
        for li in soup.select("ul.attributes li"):
            t = clean_ws(li.get_text(" ", strip=True))
            if t.lower().startswith("available"):
                availability = t
                break

    description = clean_ws(str(ld.get("description") or ""))
    if not description:
        desc_el = soup.select_one("#description")
        description = clean_ws(desc_el.get_text(" ", strip=True) if desc_el else "")

    category_path, fitment = extract_fitment_and_categories(soup)
    if not category_path:
        category_path = listing_category

    images = extract_gallery_images(soup, ld)
    cross_numbers = extract_cross_numbers(soup, article)
    oem = article  # site uses same value for sku/mpn; genuine cross SKUs go to cross_numbers

    parse_date = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "url": url,
        "article": article,
        "brand": brand,
        "oem": oem if oem else "",
        "name": name,
        "description": description,
        "category_path": category_path,
        "price": price,
        "price_ex_vat": extract_ex_vat(soup),
        "currency": currency or "GBP",
        "availability": availability,
        "fitment": fitment,
        "cross_numbers": cross_numbers,
        "image_urls": images,
        "parse_date": parse_date,
        "raw": {
            "json_ld_keys": sorted(ld.keys()),
            "listing_category": listing_category,
        },
    }
