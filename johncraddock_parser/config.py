"""Configuration for John Craddock → Bamper parser (Stages 1–2)."""

from __future__ import annotations

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
IMAGES_DIR = OUTPUT_DIR / "images"
LOGS_DIR = OUTPUT_DIR / "logs"
EXPORTS_DIR = OUTPUT_DIR / "exports"
DB_PATH = OUTPUT_DIR / "johncraddock.sqlite3"
MAPPING_PATH = BASE_DIR / "mapping.json"

BASE_URL = "https://www.johncraddockltd.co.uk"
ROBOTS_URL = f"{BASE_URL}/robots.txt"
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"

USER_AGENT = (
    "Mozilla/5.0 (compatible; BamperCatalogResearch/0.1; "
    "+https://bamper.by; stage2-test; polite)"
)

# Polite defaults
REQUEST_TIMEOUT = 30.0
REQUEST_DELAY_SEC = 1.25
REQUEST_DELAY_JITTER_SEC = 0.4
MAX_RETRIES = 3
BACKOFF_BASE_SEC = 2.0

# Stage 2 hard cap — do not raise without human unlock
TEST_PRODUCT_LIMIT = 28
TEST_CATEGORY_LIMIT = 6
DEFAULT_PER_PAGE = 32

# Full-catalog modes stay locked until Stage 3 approval
FULL_RUN_UNLOCKED = False

# Seed paths for test discovery (vehicle → leaf categories)
TEST_SEED_CATEGORIES = [
    "/series/series-3/parts/brakes/",
    "/series/series-3/parts/cooling-and-heating/",
    "/series/series-3/accessories/jerry-cans-and-spouts/",
    "/land-rover-defender/defender-90-and-110/parts/cooling-and-heating/",
]

# Tokens that reliably indicate manufacturer brand in the product name
KNOWN_BRAND_TOKENS = [
    "Britpart",
    "Terrafirma",
    "Girling",
    "Lucas",
    "Proflow",
    "Exmoor Trim",
    "Exmoor",
    "Climair",
    "ARB",
    "OEM",
    "Genuine",
    "Allmakes",
    "Bearmach",
    "Paddock",
    "Mud-UK",
    "Mud UK",
    "Devon 4x4",
    "Nas",
    "Polybush",
    "SuperPro",
    "Old Man Emu",
    "Warn",
    "Smittybilt",
]

DISALLOWED_PATH_PREFIXES = ("/_inc",)