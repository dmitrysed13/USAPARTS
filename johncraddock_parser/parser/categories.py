"""Category discovery and leaf pagination."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional, Set, Tuple
from urllib.parse import parse_qs, urlencode, urljoin, urlparse, urlunparse

from bs4 import BeautifulSoup

from config import BASE_URL, DEFAULT_PER_PAGE
from utils.http import PoliteClient
from utils.text import clean_ws

logger = logging.getLogger(__name__)


@dataclass
class CategoryRef:
    path: str
    name: str
    parent_path: str = ""
    is_leaf: bool = False


@dataclass
class ProductCard:
    url: str
    name: str = ""
    article: str = ""
    price: str = ""
    currency: str = "GBP"
    category_path: str = ""
    image_url: str = ""


def normalize_path(url_or_path: str) -> str:
    if url_or_path.startswith("http"):
        path = urlparse(url_or_path).path
    else:
        path = url_or_path
    if not path.startswith("/"):
        path = "/" + path
    if not path.endswith(".html") and not path.endswith("/"):
        path += "/"
    return path


def discover_child_categories(html: str, parent_path: str) -> List[CategoryRef]:
    soup = BeautifulSoup(html, "lxml")
    parent_path = normalize_path(parent_path)
    found: List[CategoryRef] = []
    seen: Set[str] = set()

    for box in soup.select("div.catBox"):
        a = box.find("a", href=True)
        if not a:
            continue
        path = normalize_path(a["href"])
        if path in seen:
            continue
        # Stay under parent when possible
        if parent_path not in ("/", "") and not path.startswith(parent_path.rstrip("/")):
            # still accept sibling-style absolute category links under same site tree
            if not any(
                path.startswith(p)
                for p in (
                    "/series/",
                    "/land-rover-",
                    "/range-rover/",
                    "/accessories/",
                    "/other/",
                    "/tyres/",
                    "/wheels",
                )
            ):
                continue
        name = clean_ws(a.get("title") or a.get_text(" ", strip=True))
        if not name:
            strong = box.find("strong")
            name = clean_ws(strong.get_text(" ", strip=True) if strong else path)
        seen.add(path)
        found.append(CategoryRef(path=path, name=name, parent_path=parent_path, is_leaf=False))

    # Sidebar category links under current tree
    for a in soup.select("aside a[href], .sidebar a[href], nav a[href]"):
        href = a.get("href") or ""
        path = normalize_path(href)
        if path in seen:
            continue
        if parent_path.rstrip("/") and path.startswith(parent_path.rstrip("/") + "/"):
            name = clean_ws(a.get_text(" ", strip=True))
            if name and len(name) < 80:
                seen.add(path)
                found.append(
                    CategoryRef(path=path, name=name, parent_path=parent_path, is_leaf=False)
                )
    return found


def parse_product_cards(html: str, fallback_category: str = "") -> List[ProductCard]:
    soup = BeautifulSoup(html, "lxml")
    cards: List[ProductCard] = []
    for article in soup.select("article.productBox"):
        a = article.select_one("a.text[href], a[href$='.html']")
        if not a:
            continue
        href = a.get("href") or ""
        url = urljoin(BASE_URL + "/", href)
        name = clean_ws(a.get("data-name") or "")
        if not name:
            h2 = article.select_one("h2")
            name = clean_ws(h2.get_text(" ", strip=True) if h2 else "")
        article_sku = clean_ws(a.get("data-id") or a.get("data-variant") or "")
        price = clean_ws(a.get("data-price") or "")
        category_path = normalize_path(a.get("data-category") or fallback_category)
        img = article.select_one("img[src*='/_images/_images/']")
        image_url = urljoin(BASE_URL + "/", img["src"]) if img and img.get("src") else ""
        # Prefer xl if l slipped in
        if "/_images/_images/l/" in image_url:
            image_url = image_url.replace("/_images/_images/l/", "/_images/_images/xl/")
        cards.append(
            ProductCard(
                url=url,
                name=name,
                article=article_sku,
                price=price,
                category_path=category_path,
                image_url=image_url,
            )
        )
    return cards


def page_count(html: str) -> int:
    soup = BeautifulSoup(html, "lxml")
    text = clean_ws(soup.select_one("#pagination").get_text(" ", strip=True) if soup.select_one("#pagination") else "")
    m = re.search(r"Showing page\s+\d+\s+of\s+(\d+)", text, re.I)
    if m:
        return int(m.group(1))
    # fallback: highest startpos / per_page
    max_start = 0
    for a in soup.select("#pagination a[href*='startpos=']"):
        qs = parse_qs(urlparse(a["href"]).query)
        if "startpos" in qs:
            max_start = max(max_start, int(qs["startpos"][0]))
    if max_start:
        return max_start // DEFAULT_PER_PAGE + 1
    return 1 if parse_product_cards(html) else 0


def listing_url(path: str, startpos: int = 0, per_page: int = DEFAULT_PER_PAGE) -> str:
    path = normalize_path(path)
    base = urljoin(BASE_URL + "/", path)
    parts = list(urlparse(base))
    q = parse_qs(parts[4])
    q["per_page"] = [str(per_page)]
    if startpos:
        q["startpos"] = [str(startpos)]
    parts[4] = urlencode({k: v[0] for k, v in q.items()})
    return urlunparse(parts)


def is_product_listing(html: str) -> bool:
    return bool(BeautifulSoup(html, "lxml").select("article.productBox"))


def expand_to_leaves(
    client: PoliteClient,
    seeds: Iterable[str],
    max_categories: int,
) -> Tuple[List[CategoryRef], List[str]]:
    """Walk from seeds until product listings (leaves) or limit."""
    leaves: List[CategoryRef] = []
    errors: List[str] = []
    queue: List[str] = [normalize_path(s) for s in seeds]
    seen: Set[str] = set()

    while queue and len(leaves) < max_categories:
        path = queue.pop(0)
        if path in seen:
            continue
        seen.add(path)
        html = client.get_text(path)
        if html is None:
            errors.append(f"fetch_failed:{path}")
            continue
        if is_product_listing(html):
            soup = BeautifulSoup(html, "lxml")
            h1 = soup.select_one("h1")
            name = clean_ws(h1.get_text(" ", strip=True) if h1 else path)
            leaves.append(CategoryRef(path=path, name=name, is_leaf=True))
            logger.info("Leaf category: %s (%s)", path, name)
            continue
        children = discover_child_categories(html, path)
        if not children:
            errors.append(f"no_children_or_products:{path}")
            continue
        for child in children:
            if child.path not in seen:
                queue.append(child.path)
    return leaves, errors


def iter_listing_product_urls(
    client: PoliteClient,
    category_path: str,
    limit: int,
    already: Optional[Set[str]] = None,
) -> Tuple[List[ProductCard], List[str]]:
    already = already or set()
    errors: List[str] = []
    collected: List[ProductCard] = []
    first_url = listing_url(category_path, 0)
    html = client.get_text(first_url)
    if html is None:
        return [], [f"listing_failed:{category_path}"]
    pages = page_count(html)
    per_page = DEFAULT_PER_PAGE
    for page_idx in range(pages):
        if page_idx > 0:
            html = client.get_text(listing_url(category_path, page_idx * per_page))
            if html is None:
                errors.append(f"listing_page_failed:{category_path}:p{page_idx}")
                break
        for card in parse_product_cards(html, fallback_category=category_path):
            if card.url in already:
                continue
            already.add(card.url)
            collected.append(card)
            if len(collected) >= limit:
                return collected, errors
    return collected, errors
