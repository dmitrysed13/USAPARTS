"""Polite HTTP client with retries and robots-aware path checks."""

from __future__ import annotations

import logging
import random
import time
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx

from config import (
    BACKOFF_BASE_SEC,
    BASE_URL,
    DISALLOWED_PATH_PREFIXES,
    MAX_RETRIES,
    REQUEST_DELAY_JITTER_SEC,
    REQUEST_DELAY_SEC,
    REQUEST_TIMEOUT,
    USER_AGENT,
)

logger = logging.getLogger(__name__)


class PoliteClient:
    def __init__(self) -> None:
        self._client = httpx.Client(
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-GB,en;q=0.9",
            },
            follow_redirects=True,
            timeout=REQUEST_TIMEOUT,
        )
        self._last_request_at = 0.0

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "PoliteClient":
        return self

    def __exit__(self, *args) -> None:
        self.close()

    @staticmethod
    def absolute(url: str) -> str:
        return urljoin(BASE_URL + "/", url)

    @staticmethod
    def is_allowed(url: str) -> bool:
        path = urlparse(url).path or "/"
        return not any(path.startswith(p) for p in DISALLOWED_PATH_PREFIXES)

    def _throttle(self) -> None:
        now = time.monotonic()
        wait = REQUEST_DELAY_SEC + random.uniform(0, REQUEST_DELAY_JITTER_SEC)
        elapsed = now - self._last_request_at
        if elapsed < wait:
            time.sleep(wait - elapsed)

    def get_text(self, url: str) -> Optional[str]:
        url = self.absolute(url)
        if not self.is_allowed(url):
            logger.warning("Blocked by robots policy path: %s", url)
            return None

        last_err: Optional[Exception] = None
        for attempt in range(1, MAX_RETRIES + 1):
            self._throttle()
            try:
                self._last_request_at = time.monotonic()
                resp = self._client.get(url)
                if resp.status_code in (429, 503):
                    sleep_for = BACKOFF_BASE_SEC * (2 ** (attempt - 1))
                    logger.warning(
                        "HTTP %s for %s — backoff %.1fs",
                        resp.status_code,
                        url,
                        sleep_for,
                    )
                    time.sleep(sleep_for)
                    continue
                if resp.status_code >= 400:
                    logger.error("HTTP %s for %s", resp.status_code, url)
                    return None
                return resp.text
            except httpx.HTTPError as exc:
                last_err = exc
                sleep_for = BACKOFF_BASE_SEC * (2 ** (attempt - 1))
                logger.warning(
                    "Request error %s for %s — retry in %.1fs",
                    exc,
                    url,
                    sleep_for,
                )
                time.sleep(sleep_for)
        logger.error("Failed GET %s after retries: %s", url, last_err)
        return None

    def get_bytes(self, url: str) -> Optional[bytes]:
        url = self.absolute(url)
        if not self.is_allowed(url):
            logger.warning("Blocked by robots policy path: %s", url)
            return None

        last_err: Optional[Exception] = None
        for attempt in range(1, MAX_RETRIES + 1):
            self._throttle()
            try:
                self._last_request_at = time.monotonic()
                resp = self._client.get(url)
                if resp.status_code in (429, 503):
                    sleep_for = BACKOFF_BASE_SEC * (2 ** (attempt - 1))
                    time.sleep(sleep_for)
                    continue
                if resp.status_code >= 400:
                    logger.error("HTTP %s for image %s", resp.status_code, url)
                    return None
                return resp.content
            except httpx.HTTPError as exc:
                last_err = exc
                time.sleep(BACKOFF_BASE_SEC * (2 ** (attempt - 1)))
        logger.error("Failed image GET %s: %s", url, last_err)
        return None
