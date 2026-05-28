"""
Tampa, FL construction data feeds.

Data sources:
  1. City of Tampa Open Data (Socrata) — building permits
     Portal:  https://data.tampagov.net
     Dataset: set TAMPA_PERMITS_DATASET_ID in .env
              To find the ID: go to the portal, open the Building Permits
              dataset, click "API" → the path shows /resource/<ID>.json

  2. Hillsborough County Open Data (Socrata) — county-wide permits
     Portal:  https://opendata.hillsboroughcounty.org
     Dataset: set HILLSBOROUGH_PERMITS_DATASET_ID in .env

Both endpoints are free, unauthenticated for read access.
An app token (SOCRATA_APP_TOKEN) removes the default 1 000 req/hour
rate limit — register one free at https://data.tampagov.net/profile/app_tokens.
"""

import logging
import os
from typing import Any

import httpx

from app.integrations.base import BaseFeed

logger = logging.getLogger(__name__)

# ── env-configurable endpoints ─────────────────────────────────────────────
TAMPA_SOCRATA_BASE = os.getenv("TAMPA_SOCRATA_BASE", "https://data.tampagov.net")
TAMPA_PERMITS_DATASET_ID = os.getenv("TAMPA_PERMITS_DATASET_ID", "")

HILLSBOROUGH_SOCRATA_BASE = os.getenv(
    "HILLSBOROUGH_SOCRATA_BASE", "https://opendata.hillsboroughcounty.org"
)
HILLSBOROUGH_PERMITS_DATASET_ID = os.getenv("HILLSBOROUGH_PERMITS_DATASET_ID", "")

SOCRATA_APP_TOKEN = os.getenv("SOCRATA_APP_TOKEN", "")

# Only pull permits with an estimated job value at or above this threshold
MIN_JOB_VALUE = float(os.getenv("CONSTRUCTION_MIN_JOB_VALUE", "100000"))

# Number of permits to pull per source per request
FETCH_LIMIT = int(os.getenv("CONSTRUCTION_FETCH_LIMIT", "200"))

# How many days back to look for permits
LOOKBACK_DAYS = int(os.getenv("CONSTRUCTION_LOOKBACK_DAYS", "90"))

# Construction-related permit type keywords (case-insensitive substring match)
CONSTRUCTION_KEYWORDS = [
    "new construction",
    "commercial building",
    "residential building",
    "addition",
    "demolition",
    "foundation",
    "structural",
    "mixed use",
    "multi-family",
    "multifamily",
    "industrial",
    "warehouse",
    "office",
    "retail",
    "hotel",
    "parking",
    "infrastructure",
]


def _socrata_headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if SOCRATA_APP_TOKEN:
        headers["X-App-Token"] = SOCRATA_APP_TOKEN
    return headers


class TampaCityPermitsFeed(BaseFeed):
    """
    City of Tampa building permits via the Socrata SoQL API.

    Expected source fields (Tampa permit dataset):
      permit_number, permit_type, permit_status, work_description,
      site_address, issue_date, expiration_date, jobs_value,
      contractor_name, contractor_license_number, latitude, longitude,
      total_sqft
    """

    def _endpoint(self) -> str:
        return f"{TAMPA_SOCRATA_BASE}/resource/{TAMPA_PERMITS_DATASET_ID}.json"

    async def fetch(self, **kwargs) -> list[dict[str, Any]]:
        if not TAMPA_PERMITS_DATASET_ID:
            logger.warning(
                "TAMPA_PERMITS_DATASET_ID not set — falling back to mock City of Tampa construction permits."
            )
            return [
                {
                    "permit_number": "BLD-2026-04123",
                    "permit_type": "Commercial Building",
                    "work_description": "New 5-story mixed use retail and apartment building (Funding to build commercial projects)",
                    "site_address": "1210 N Franklin St",
                    "jobs_value": 12500000,
                    "total_sqft": 45000,
                    "contractor_name": "Tampa Bay Developers LLC",
                    "contractor_license_number": "CGC1520041",
                    "latitude": 27.9545,
                    "longitude": -82.4590,
                    "permit_status": "Issued",
                    "issue_date": "2026-04-15",
                },
                {
                    "permit_number": "BLD-2026-03982",
                    "permit_type": "Residential Building",
                    "work_description": "Construction of 12 unit townhome complex (Funding to build homes)",
                    "site_address": "2408 E 2nd Ave",
                    "jobs_value": 3800000,
                    "total_sqft": 18000,
                    "contractor_name": "Ybor Builders Group",
                    "contractor_license_number": "CRC1330981",
                    "latitude": 27.9610,
                    "longitude": -82.4330,
                    "permit_status": "Issued",
                    "issue_date": "2026-04-20",
                },
                {
                    "permit_number": "BLD-2026-05110",
                    "permit_type": "New Construction",
                    "work_description": "Commercial office shell building and parking deck",
                    "site_address": "4830 W Kennedy Blvd",
                    "jobs_value": 24500000,
                    "total_sqft": 85000,
                    "contractor_name": "Westshore Construction Corp",
                    "contractor_license_number": "CGC0991204",
                    "latitude": 27.9440,
                    "longitude": -82.5290,
                    "permit_status": "Approved",
                    "issue_date": "2026-05-10",
                },
                {
                    "permit_number": "BLD-2026-05891",
                    "permit_type": "Residential Building",
                    "work_description": "Single family residential home construction (Funding to build homes)",
                    "site_address": "3204 W Barcelona St",
                    "jobs_value": 850000,
                    "total_sqft": 3400,
                    "contractor_name": "South Tampa Custom Homes",
                    "contractor_license_number": "CRC0589101",
                    "latitude": 27.9150,
                    "longitude": -82.4950,
                    "permit_status": "Plan Review",
                    "issue_date": "2026-05-18",
                },
            ]

        params = {
            "$limit": FETCH_LIMIT,
            "$order": "issue_date DESC",
            "$where": (
                f"jobs_value >= {MIN_JOB_VALUE} "
                f"AND issue_date >= '{_days_ago(LOOKBACK_DAYS)}'"
            ),
        }

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    self._endpoint(), params=params, headers=_socrata_headers()
                )
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            logger.error("City of Tampa permits fetch failed: %s", exc)
            return []

    def normalize(self, raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
        out = []
        for r in raw:
            ptype = r.get("permit_type", "") or r.get("work_type", "")
            if not _is_construction_permit(ptype, r.get("work_description", "")):
                continue
            out.append(
                {
                    "permit_number": r.get("permit_number", ""),
                    "permit_type": ptype,
                    "description": r.get("work_description", ""),
                    "address": r.get("site_address", r.get("address", "")),
                    "city": "Tampa",
                    "state": "FL",
                    "zip_code": r.get("zip_code", r.get("zip", "")),
                    "status": _map_status(r.get("permit_status", "")),
                    "issue_date": r.get("issue_date", ""),
                    "expiration_date": r.get("expiration_date", ""),
                    "estimated_value": _safe_float(r.get("jobs_value")),
                    "sqft": _safe_float(r.get("total_sqft")),
                    "contractor_name": r.get("contractor_name", ""),
                    "contractor_license": r.get("contractor_license_number", ""),
                    "latitude": _safe_float(r.get("latitude")),
                    "longitude": _safe_float(r.get("longitude")),
                    "source": "tampa_city_permits",
                }
            )
        return out


class HillsboroughCountyPermitsFeed(BaseFeed):
    """
    Hillsborough County building permits via the Socrata SoQL API.

    Expected source fields (Hillsborough permit dataset):
      permit_no, permit_type_desc, status_desc, project_name,
      address, issued_date, expire_date, job_value,
      contractor_company, latitude, longitude
    """

    def _endpoint(self) -> str:
        return (
            f"{HILLSBOROUGH_SOCRATA_BASE}/resource/{HILLSBOROUGH_PERMITS_DATASET_ID}.json"
        )

    async def fetch(self, **kwargs) -> list[dict[str, Any]]:
        if not HILLSBOROUGH_PERMITS_DATASET_ID:
            logger.warning(
                "HILLSBOROUGH_PERMITS_DATASET_ID not set — falling back to mock Hillsborough County permits."
            )
            return [
                {
                    "permit_no": "HC-2026-08101",
                    "permit_type_desc": "Commercial Building",
                    "project_name": "Warehouse addition and distribution hub expansion (Funding to build commercial projects)",
                    "address": "8410 Adamo Dr",
                    "job_value": 14200000,
                    "contractor_company": "Hillsborough Industrial Builders",
                    "latitude": 27.9620,
                    "longitude": -82.3550,
                    "status_desc": "Issued",
                    "issued_date": "2026-03-30",
                },
                {
                    "permit_no": "HC-2026-09224",
                    "permit_type_desc": "Residential Addition",
                    "project_name": "New residential multifamily building - 24 units (Funding to build homes)",
                    "address": "1015 E Brandon Blvd",
                    "job_value": 6200000,
                    "contractor_company": "Brandon Construction Partners",
                    "latitude": 27.9370,
                    "longitude": -82.2850,
                    "status_desc": "Plan Review",
                    "issued_date": "2026-04-05",
                },
                {
                    "permit_no": "HC-2026-07431",
                    "permit_type_desc": "New Construction",
                    "project_name": "Tampa Medical Center Outpatient Wing",
                    "address": "3100 E Fletcher Ave",
                    "job_value": 38000000,
                    "contractor_company": "Apex Healthcare Builders",
                    "latitude": 28.0690,
                    "longitude": -82.4270,
                    "status_desc": "Approved",
                    "issued_date": "2026-05-02",
                },
            ]

        params = {
            "$limit": FETCH_LIMIT,
            "$order": "issued_date DESC",
            "$where": (
                f"job_value >= {MIN_JOB_VALUE} "
                f"AND issued_date >= '{_days_ago(LOOKBACK_DAYS)}'"
            ),
        }

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    self._endpoint(), params=params, headers=_socrata_headers()
                )
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            logger.error("Hillsborough County permits fetch failed: %s", exc)
            return []

    def normalize(self, raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
        out = []
        for r in raw:
            ptype = r.get("permit_type_desc", "") or r.get("permit_type", "")
            if not _is_construction_permit(ptype, r.get("project_name", "")):
                continue
            out.append(
                {
                    "permit_number": r.get("permit_no", r.get("permit_number", "")),
                    "permit_type": ptype,
                    "description": r.get("project_name", r.get("work_description", "")),
                    "address": r.get("address", ""),
                    "city": r.get("city", "Tampa"),
                    "state": "FL",
                    "zip_code": r.get("zip_code", ""),
                    "status": _map_status(r.get("status_desc", r.get("permit_status", ""))),
                    "issue_date": r.get("issued_date", r.get("issue_date", "")),
                    "expiration_date": r.get("expire_date", r.get("expiration_date", "")),
                    "estimated_value": _safe_float(r.get("job_value", r.get("jobs_value"))),
                    "sqft": _safe_float(r.get("sqft")),
                    "contractor_name": r.get("contractor_company", r.get("contractor_name", "")),
                    "contractor_license": r.get("contractor_license", ""),
                    "latitude": _safe_float(r.get("latitude")),
                    "longitude": _safe_float(r.get("longitude")),
                    "source": "hillsborough_county_permits",
                }
            )
        return out


async def fetch_all_tampa_construction_permits() -> list[dict[str, Any]]:
    """Fetch and merge permits from all Tampa-area construction feeds."""
    city_feed = TampaCityPermitsFeed()
    county_feed = HillsboroughCountyPermitsFeed()

    import asyncio

    city_results, county_results = await asyncio.gather(
        city_feed.fetch_normalized(),
        county_feed.fetch_normalized(),
        return_exceptions=False,
    )

    combined = city_results + county_results

    # If Bright Data Scraping Browser WebSocket URL is configured, run the live web scraper
    ws_url = os.getenv("BRIGHT_DATA_BROWSER_WS", "")
    if ws_url:
        try:
            logger.info("BRIGHT_DATA_BROWSER_WS is configured. Running live Accela browser scraper...")
            from app.integrations.bright_data_scraper import BrightDataAccelaScraper
            scraper = BrightDataAccelaScraper(ws_url)
            scraped_permits = await scraper.scrape_tampa_permits()
            if scraped_permits:
                combined = scraped_permits + combined
        except Exception as exc:
            logger.error(f"Failed to run Bright Data Accela scraper: {exc}")

    return _deduplicate(combined)


def permits_to_leads(permits: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Convert normalized construction permits into Lead-compatible dicts.
    These can be injected directly into the leads in-memory store or a DB.
    """
    leads = []
    for p in permits:
        value = p.get("estimated_value") or 0.0
        desc = p.get("description") or p.get("permit_type") or "Construction Project"
        address = p.get("address", "")
        city = p.get("city", "Tampa")

        leads.append(
            {
                "name": _build_lead_name(desc, address),
                "location": f"{address}, {city}, FL" if address else f"{city}, FL",
                "sector": "Construction",
                "deal_size": value,
                "status": p["status"],
                "confidence": _estimate_confidence(p),
                # extra construction metadata (stored as passthrough for now)
                "_permit_number": p.get("permit_number", ""),
                "_permit_type": p.get("permit_type", ""),
                "_contractor_name": p.get("contractor_name", ""),
                "_sqft": p.get("sqft"),
                "_source_feed": p.get("source", ""),
                "_issue_date": p.get("issue_date", ""),
                "_latitude": p.get("latitude"),
                "_longitude": p.get("longitude"),
            }
        )
    return leads


# ── helpers ────────────────────────────────────────────────────────────────


def _days_ago(n: int) -> str:
    from datetime import datetime, timedelta

    return (datetime.utcnow() - timedelta(days=n)).strftime("%Y-%m-%dT%H:%M:%S")


def _safe_float(val: Any) -> float | None:
    try:
        return float(val) if val not in (None, "", "N/A") else None
    except (TypeError, ValueError):
        return None


def _is_construction_permit(permit_type: str, description: str) -> bool:
    combined = f"{permit_type} {description}".lower()
    return any(kw in combined for kw in CONSTRUCTION_KEYWORDS)


def _map_status(raw_status: str) -> str:
    """Map source-specific status strings to the platform's LeadStatus values."""
    s = raw_status.lower()
    if any(x in s for x in ("issued", "active", "open", "approved")):
        return "New"
    if any(x in s for x in ("under review", "pending", "in review", "plan review")):
        return "Under Review"
    if any(x in s for x in ("contacted", "inspection", "in progress")):
        return "Contacted"
    if any(x in s for x in ("closed", "finaled", "completed", "funded")):
        return "Funded"
    return "New"


def _estimate_confidence(permit: dict[str, Any]) -> float:
    """Heuristic confidence score based on permit characteristics."""
    score = 0.5
    value = permit.get("estimated_value") or 0
    if value >= 5_000_000:
        score += 0.25
    elif value >= 1_000_000:
        score += 0.15
    elif value >= 500_000:
        score += 0.08

    if permit.get("contractor_name"):
        score += 0.10
    if permit.get("sqft") and (permit["sqft"] or 0) > 5_000:
        score += 0.05
    if permit.get("status") in ("New", "Contacted"):
        score += 0.05

    return round(min(score, 0.99), 2)


def _build_lead_name(description: str, address: str) -> str:
    desc = description.strip()
    if len(desc) > 60:
        desc = desc[:57] + "..."
    if address:
        short_addr = address.split(",")[0].strip()
        return f"{desc} — {short_addr}"
    return desc


def _deduplicate(permits: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Remove duplicate permit numbers across sources, keeping the first occurrence."""
    seen: set[str] = set()
    unique = []
    for p in permits:
        key = p.get("permit_number", "").strip()
        if key and key in seen:
            continue
        if key:
            seen.add(key)
        unique.append(p)
    return unique
