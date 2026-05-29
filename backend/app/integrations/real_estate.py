"""
Tampa / Hillsborough County real estate feed.

Data sources (all free, no API key required):
  1. Redfin (unofficial stingray CSV API) — active MLS listings
  2. HUD REO ArcGIS REST — FHA-foreclosed / REO properties
  3. Hillsborough County Property Appraiser ArcGIS REST — county records

All three sources fall back to realistic Tampa mock data when unavailable.
"""

import csv
import hashlib
import io
import json
import logging
import os
from typing import Any

import httpx

from app.integrations.base import BaseFeed

logger = logging.getLogger(__name__)

# ── constants ─────────────────────────────────────────────────────────────────

REDFIN_CSV_URL = "https://www.redfin.com/stingray/api/gis-csv"
# Tampa, FL — region_id confirmed from https://www.redfin.com/city/20702/FL/Tampa
REDFIN_TAMPA_REGION_ID = os.getenv("REDFIN_REGION_ID", "20702")

HUD_REO_URL = (
    "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services"
    "/HUD_REO_Properties/FeatureServer/0/query"
)

HCPA_URL = (
    "https://gis.hcpafl.org/HCPAGIS/rest/services/Property/Property_All/MapServer/0/query"
)

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.redfin.com/",
    "Accept-Language": "en-US,en;q=0.9",
}


# ── helpers ───────────────────────────────────────────────────────────────────

def _safe_float(val: Any) -> float | None:
    try:
        return float(val) if val not in (None, "", "N/A", "-") else None
    except (TypeError, ValueError):
        return None


def _safe_int(val: Any) -> int | None:
    f = _safe_float(val)
    return int(f) if f is not None else None


def _price_str_to_int(s: str) -> int:
    if not s:
        return 0
    cleaned = s.replace("$", "").replace(",", "").replace("+", "").strip()
    try:
        return int(float(cleaned))
    except (ValueError, TypeError):
        return 0


def _deterministic_coords(seed: str, base_lat=27.9506, base_lng=-82.4572) -> tuple[float, float]:
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    lat = base_lat + ((h % 200) - 100) / 2000.0
    lng = base_lng + (((h >> 8) % 200) - 100) / 2000.0
    return round(lat, 5), round(lng, 5)


def _prop_id(prefix: str, seed: str) -> str:
    return f"{prefix}-{hashlib.md5(seed.encode()).hexdigest()[:8].upper()}"


# ── main feed class ───────────────────────────────────────────────────────────

class RealEstateFeed(BaseFeed):
    """
    Aggregates active listings, REO foreclosures, and county property records
    for the Tampa / Hillsborough County market.
    """

    async def fetch(self, prop_type: str = "all", limit: int = 50, **kwargs) -> list[dict[str, Any]]:
        results: list[dict] = []

        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            if prop_type in ("all", "listings"):
                results.extend(await self._fetch_redfin(client, limit=min(limit, 40)))

            if prop_type in ("all", "foreclosures"):
                results.extend(await self._fetch_hud_reo(client, limit=min(limit, 30)))

            if prop_type in ("all", "county"):
                results.extend(await self._fetch_hcpa(client, limit=min(limit, 30)))

        return results[:limit]

    # ── source fetchers ───────────────────────────────────────────────────────

    async def _fetch_redfin(self, client: httpx.AsyncClient, limit: int = 40) -> list[dict]:
        # Prefer BrightData browser scrape — handles JS rendering and anti-bot
        from app.integrations.bright_data_scraper import BrightDataRedfinScraper
        scraper = BrightDataRedfinScraper()
        if scraper.is_configured():
            logger.info("Redfin: using BrightData Scraping Browser")
            results = await scraper.scrape_listings(limit=limit)
            if results:
                # Already normalized — tag for passthrough in normalize()
                return [{"_source": "redfin_brightdata", **r} for r in results]
            logger.warning("BrightData Redfin scrape returned nothing — falling back to stingray API")

        # Fallback: Redfin stingray CSV API (unofficial, no key)
        region_id = REDFIN_TAMPA_REGION_ID
        region_type = "6"
        try:
            ac = await client.get(
                "https://www.redfin.com/stingray/do/location-autocomplete",
                params={"location": "Tampa, FL", "v": "2"},
                headers=_BROWSER_HEADERS,
            )
            text = ac.text.removeprefix("{}&&")
            data = json.loads(text)
            for section in data.get("payload", {}).get("sections", []):
                for row in section.get("rows", []):
                    if row.get("name") == "Tampa" and row.get("subName") == "FL":
                        region_id = str(row["id"])
                        region_type = str(row["type"])
                        break
        except Exception as exc:
            logger.warning("Redfin autocomplete failed (%s) — using region_id %s", exc, region_id)

        params = {
            "al": "1",
            "region_id": region_id,
            "region_type": region_type,
            "status": "9",
            "uipt": "1,2,3,4,5,6,7,8",
            "num_beds": "0",
            "num_baths": "0",
            "v": "8",
            "page_number": "1",
        }
        try:
            resp = await client.get(REDFIN_CSV_URL, params=params, headers=_BROWSER_HEADERS)
            resp.raise_for_status()
            rows = []
            reader = csv.DictReader(io.StringIO(resp.text))
            for row in reader:
                state = (row.get("STATE OR PROVINCE") or row.get("STATE") or "FL").strip()
                if state != "FL":
                    continue
                rows.append({"_source": "redfin", **row})
                if len(rows) >= limit:
                    break
            if rows:
                logger.info("Redfin stingray: fetched %d Tampa FL listings", len(rows))
                return rows
        except Exception as exc:
            logger.warning("Redfin stingray fetch failed (%s) — using fallback listings", exc)

        return self._redfin_fallback(limit)

    async def _fetch_hud_reo(self, client: httpx.AsyncClient, limit: int = 30) -> list[dict]:
        params = {
            "where": "STATE_CODE='FL'",
            "outFields": "PROPERTY_ADDRESS,CITY,STATE_CODE,ZIP_CODE,LIST_PRICE,BEDS,BATHS,SQFT,CASE_NUMBER,PROPERTY_TYPE",
            "resultRecordCount": str(limit),
            "orderByFields": "LIST_PRICE DESC",
            "f": "json",
        }
        try:
            resp = await client.get(HUD_REO_URL, params=params)
            resp.raise_for_status()
            features = resp.json().get("features", [])
            if features:
                records = [{"_source": "hud_reo", **f.get("attributes", {})} for f in features]
                logger.info("HUD REO: fetched %d foreclosure records", len(records))
                return records
        except Exception as exc:
            logger.warning("HUD REO fetch failed (%s) — using fallback foreclosures", exc)

        return self._hud_fallback(limit)

    async def _fetch_hcpa(self, client: httpx.AsyncClient, limit: int = 30) -> list[dict]:
        params = {
            "where": "JUST_VALUE > 150000 AND SALE_PRICE > 0",
            "outFields": "ADDRESS,CITY,ZIP,OWNER_NAME,JUST_VALUE,SALE_PRICE,SALE_DATE,LAND_USE_CODE",
            "resultRecordCount": str(limit),
            "orderByFields": "SALE_DATE DESC",
            "outSR": "4326",
            "returnGeometry": "true",
            "f": "json",
        }
        try:
            resp = await client.get(HCPA_URL, params=params)
            resp.raise_for_status()
            features = resp.json().get("features", [])
            if features:
                records = []
                for f in features:
                    attrs = f.get("attributes", {})
                    geom = f.get("geometry") or {}
                    records.append({"_source": "hcpa", "_lat": geom.get("y"), "_lng": geom.get("x"), **attrs})
                logger.info("HCPA: fetched %d county records", len(records))
                return records
        except Exception as exc:
            logger.warning("HCPA fetch failed (%s) — using fallback county records", exc)

        return self._hcpa_fallback(limit)

    # ── normalize ─────────────────────────────────────────────────────────────

    def normalize(self, raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
        out = []
        for item in raw:
            source = item.get("_source", "")
            if source == "redfin_brightdata":
                # Already normalized by the scraper — strip the internal tag and pass through
                n = {k: v for k, v in item.items() if k != "_source"}
            elif source == "redfin":
                n = self._normalize_redfin(item)
            elif source == "hud_reo":
                n = self._normalize_hud(item)
            elif source == "hcpa":
                n = self._normalize_hcpa(item)
            else:
                n = None
            if n:
                out.append(n)
        return out

    def _normalize_redfin(self, item: dict) -> dict | None:
        address = (item.get("ADDRESS") or "").strip()
        if not address:
            return None
        price = _price_str_to_int(item.get("PRICE") or "0")
        if price <= 0:
            return None

        city = (item.get("CITY") or "Tampa").strip()
        zip_code = (item.get("ZIP/POSTAL CODE") or item.get("ZIP") or "").strip()
        beds = (item.get("BEDS") or "").strip()
        baths = (item.get("BATHS") or "").strip()
        sqft = _safe_int((item.get("SQUARE FEET") or "0").replace(",", ""))
        year_built = (item.get("YEAR BUILT") or "").strip()
        prop_type = (item.get("PROPERTY TYPE") or "Residential").strip()
        days_on_mkt = (item.get("DAYS ON MARKET") or "").strip()

        lat_raw = item.get("LATITUDE", "")
        lng_raw = item.get("LONGITUDE", "")
        lat = _safe_float(lat_raw)
        lng = _safe_float(lng_raw)
        if lat is None or lng is None:
            lat, lng = _deterministic_coords(address)

        url_key = next((k for k in item if "URL" in k.upper()), None)
        listing_url = item.get(url_key, "") if url_key else ""
        if listing_url and listing_url.startswith("/"):
            listing_url = f"https://www.redfin.com{listing_url}"

        return {
            "property_id": _prop_id("RF", address),
            "address": address,
            "city": city,
            "state": "FL",
            "zip": zip_code,
            "price": price,
            "beds": beds,
            "baths": baths,
            "sqft": sqft or 0,
            "year_built": year_built,
            "property_type": prop_type,
            "status": "Active Listing",
            "days_on_market": days_on_mkt,
            "source": "Redfin",
            "source_url": listing_url,
            "latitude": lat,
            "longitude": lng,
        }

    def _normalize_hud(self, item: dict) -> dict | None:
        address = (item.get("PROPERTY_ADDRESS") or "").strip()
        if not address:
            return None
        price = _safe_int(item.get("LIST_PRICE")) or 0

        city = (item.get("CITY") or "Tampa").strip()
        zip_code = str(item.get("ZIP_CODE") or "").strip()
        beds = str(item.get("BEDS") or "").strip()
        baths = str(item.get("BATHS") or "").strip()
        sqft = _safe_int(item.get("SQFT")) or 0
        case_num = item.get("CASE_NUMBER") or ""
        prop_type = (item.get("PROPERTY_TYPE") or "Residential").strip()

        lat, lng = _deterministic_coords(address)

        return {
            "property_id": _prop_id("HUD", address),
            "address": address,
            "city": city,
            "state": "FL",
            "zip": zip_code,
            "price": price,
            "beds": beds,
            "baths": baths,
            "sqft": sqft,
            "year_built": "",
            "property_type": prop_type,
            "status": "REO / Foreclosure",
            "days_on_market": "",
            "source": "HUD REO",
            "source_url": "https://hudhomestore.hud.gov/",
            "case_number": case_num,
            "latitude": lat,
            "longitude": lng,
        }

    def _normalize_hcpa(self, item: dict) -> dict | None:
        address = (item.get("ADDRESS") or "").strip()
        if not address:
            return None

        city = (item.get("CITY") or "Tampa").strip()
        zip_code = str(item.get("ZIP") or "").strip()
        sale_price = _safe_int(item.get("SALE_PRICE")) or 0
        just_value = _safe_int(item.get("JUST_VALUE")) or 0
        price = sale_price or just_value
        owner = (item.get("OWNER_NAME") or "").strip()
        sale_date = (item.get("SALE_DATE") or "").strip()

        # Map HCPA land use codes to human-readable type
        code = _safe_int(item.get("LAND_USE_CODE")) or 0
        if 1 <= code <= 9:
            prop_type = "Single Family"
        elif 10 <= code <= 19:
            prop_type = "Vacant Residential"
        elif 20 <= code <= 29:
            prop_type = "Multi-Family"
        elif 30 <= code <= 39:
            prop_type = "Vacant Commercial"
        elif 40 <= code <= 49:
            prop_type = "Commercial"
        elif 50 <= code <= 69:
            prop_type = "Industrial"
        else:
            prop_type = "Mixed Use"

        lat = _safe_float(item.get("_lat"))
        lng = _safe_float(item.get("_lng"))
        if lat is None or lng is None:
            lat, lng = _deterministic_coords(address)

        return {
            "property_id": _prop_id("HCPA", address),
            "address": address,
            "city": city,
            "state": "FL",
            "zip": zip_code,
            "price": price,
            "beds": "",
            "baths": "",
            "sqft": 0,
            "year_built": "",
            "property_type": prop_type,
            "status": "County Record",
            "days_on_market": "",
            "source": "Hillsborough Co. PA",
            "source_url": "https://gis.hcpafl.org/propertysearch/",
            "owner": owner,
            "assessed_value": just_value,
            "sale_date": sale_date,
            "latitude": lat,
            "longitude": lng,
        }

    # ── fallback datasets ─────────────────────────────────────────────────────

    def _redfin_fallback(self, limit: int) -> list[dict]:
        rows = [
            {"_source": "redfin", "ADDRESS": "4218 W San Jose St", "CITY": "Tampa", "ZIP/POSTAL CODE": "33629",
             "PRICE": "485000", "BEDS": "3", "BATHS": "2", "SQUARE FEET": "1,842", "YEAR BUILT": "1978",
             "PROPERTY TYPE": "Single Family Residential", "DAYS ON MARKET": "12", "LATITUDE": "27.9115", "LONGITUDE": "-82.5020"},
            {"_source": "redfin", "ADDRESS": "1802 E Palm Ave #201", "CITY": "Tampa", "ZIP/POSTAL CODE": "33605",
             "PRICE": "279000", "BEDS": "2", "BATHS": "2", "SQUARE FEET": "1,120", "YEAR BUILT": "2004",
             "PROPERTY TYPE": "Condo/Co-op", "DAYS ON MARKET": "7", "LATITUDE": "27.9624", "LONGITUDE": "-82.4339"},
            {"_source": "redfin", "ADDRESS": "3105 W Azeele St", "CITY": "Tampa", "ZIP/POSTAL CODE": "33609",
             "PRICE": "750000", "BEDS": "4", "BATHS": "3", "SQUARE FEET": "2,640", "YEAR BUILT": "2019",
             "PROPERTY TYPE": "Single Family Residential", "DAYS ON MARKET": "3", "LATITUDE": "27.9395", "LONGITUDE": "-82.4860"},
            {"_source": "redfin", "ADDRESS": "5012 N Habana Ave #105", "CITY": "Tampa", "ZIP/POSTAL CODE": "33614",
             "PRICE": "185000", "BEDS": "1", "BATHS": "1", "SQUARE FEET": "720", "YEAR BUILT": "1990",
             "PROPERTY TYPE": "Condo/Co-op", "DAYS ON MARKET": "28", "LATITUDE": "27.9842", "LONGITUDE": "-82.5010"},
            {"_source": "redfin", "ADDRESS": "2208 N Rome Ave", "CITY": "Tampa", "ZIP/POSTAL CODE": "33607",
             "PRICE": "370000", "BEDS": "3", "BATHS": "2", "SQUARE FEET": "1,480", "YEAR BUILT": "1956",
             "PROPERTY TYPE": "Single Family Residential", "DAYS ON MARKET": "19", "LATITUDE": "27.9622", "LONGITUDE": "-82.4858"},
            {"_source": "redfin", "ADDRESS": "601 S Harbour Island Blvd #910", "CITY": "Tampa", "ZIP/POSTAL CODE": "33602",
             "PRICE": "624000", "BEDS": "2", "BATHS": "2", "SQUARE FEET": "1,390", "YEAR BUILT": "2001",
             "PROPERTY TYPE": "Condo/Co-op", "DAYS ON MARKET": "41", "LATITUDE": "27.9424", "LONGITUDE": "-82.4503"},
            {"_source": "redfin", "ADDRESS": "8807 Huntington Pointe Dr", "CITY": "Tampa", "ZIP/POSTAL CODE": "33647",
             "PRICE": "420000", "BEDS": "4", "BATHS": "3", "SQUARE FEET": "2,210", "YEAR BUILT": "2002",
             "PROPERTY TYPE": "Single Family Residential", "DAYS ON MARKET": "6", "LATITUDE": "28.1450", "LONGITUDE": "-82.3380"},
            {"_source": "redfin", "ADDRESS": "1620 E 7th Ave", "CITY": "Tampa", "ZIP/POSTAL CODE": "33605",
             "PRICE": "315000", "BEDS": "3", "BATHS": "2", "SQUARE FEET": "1,350", "YEAR BUILT": "1925",
             "PROPERTY TYPE": "Single Family Residential", "DAYS ON MARKET": "15", "LATITUDE": "27.9614", "LONGITUDE": "-82.4348"},
            {"_source": "redfin", "ADDRESS": "500 Knights Run Ave #2109", "CITY": "Tampa", "ZIP/POSTAL CODE": "33602",
             "PRICE": "540000", "BEDS": "2", "BATHS": "2", "SQUARE FEET": "1,280", "YEAR BUILT": "2000",
             "PROPERTY TYPE": "Condo/Co-op", "DAYS ON MARKET": "9", "LATITUDE": "27.9435", "LONGITUDE": "-82.4492"},
            {"_source": "redfin", "ADDRESS": "3804 W Azeele St", "CITY": "Tampa", "ZIP/POSTAL CODE": "33609",
             "PRICE": "1150000", "BEDS": "5", "BATHS": "4", "SQUARE FEET": "3,820", "YEAR BUILT": "2022",
             "PROPERTY TYPE": "Single Family Residential", "DAYS ON MARKET": "22", "LATITUDE": "27.9398", "LONGITUDE": "-82.5020"},
        ]
        return rows[:limit]

    def _hud_fallback(self, limit: int) -> list[dict]:
        rows = [
            {"_source": "hud_reo", "PROPERTY_ADDRESS": "2115 E Lake Ave", "CITY": "Tampa", "STATE_CODE": "FL",
             "ZIP_CODE": "33610", "LIST_PRICE": 148000, "BEDS": 3, "BATHS": 1, "SQFT": 1120,
             "CASE_NUMBER": "093-748821", "PROPERTY_TYPE": "Single Family"},
            {"_source": "hud_reo", "PROPERTY_ADDRESS": "4508 N 22nd St", "CITY": "Tampa", "STATE_CODE": "FL",
             "ZIP_CODE": "33610", "LIST_PRICE": 112000, "BEDS": 2, "BATHS": 1, "SQFT": 960,
             "CASE_NUMBER": "093-751032", "PROPERTY_TYPE": "Single Family"},
            {"_source": "hud_reo", "PROPERTY_ADDRESS": "6901 N 40th St", "CITY": "Tampa", "STATE_CODE": "FL",
             "ZIP_CODE": "33610", "LIST_PRICE": 178000, "BEDS": 3, "BATHS": 2, "SQFT": 1340,
             "CASE_NUMBER": "093-762114", "PROPERTY_TYPE": "Single Family"},
            {"_source": "hud_reo", "PROPERTY_ADDRESS": "3209 E Hillsborough Ave #4", "CITY": "Tampa", "STATE_CODE": "FL",
             "ZIP_CODE": "33610", "LIST_PRICE": 89000, "BEDS": 2, "BATHS": 1, "SQFT": 840,
             "CASE_NUMBER": "093-779080", "PROPERTY_TYPE": "Condo/Co-op"},
            {"_source": "hud_reo", "PROPERTY_ADDRESS": "1402 E Osborne Ave", "CITY": "Tampa", "STATE_CODE": "FL",
             "ZIP_CODE": "33603", "LIST_PRICE": 159000, "BEDS": 3, "BATHS": 1, "SQFT": 1180,
             "CASE_NUMBER": "093-784215", "PROPERTY_TYPE": "Single Family"},
        ]
        return rows[:limit]

    def _hcpa_fallback(self, limit: int) -> list[dict]:
        rows = [
            {"_source": "hcpa", "ADDRESS": "4101 N Nebraska Ave", "CITY": "Tampa", "ZIP": "33603",
             "OWNER_NAME": "BROOKSIDE PROPERTIES LLC", "JUST_VALUE": 420000, "SALE_PRICE": 385000,
             "SALE_DATE": "2025-11-14", "LAND_USE_CODE": 49, "_lat": 27.9790, "_lng": -82.4620},
            {"_source": "hcpa", "ADDRESS": "7812 N Dale Mabry Hwy", "CITY": "Tampa", "ZIP": "33614",
             "OWNER_NAME": "NORTH DALE COMMERCIAL PARTNERS", "JUST_VALUE": 1250000, "SALE_PRICE": 1100000,
             "SALE_DATE": "2026-01-08", "LAND_USE_CODE": 41, "_lat": 28.0100, "_lng": -82.5062},
            {"_source": "hcpa", "ADDRESS": "2904 W Kennedy Blvd", "CITY": "Tampa", "ZIP": "33609",
             "OWNER_NAME": "KENNEDY BLVD REALTY INC", "JUST_VALUE": 875000, "SALE_PRICE": 810000,
             "SALE_DATE": "2026-02-20", "LAND_USE_CODE": 40, "_lat": 27.9420, "_lng": -82.4820},
            {"_source": "hcpa", "ADDRESS": "3312 W Cypress St", "CITY": "Tampa", "ZIP": "33607",
             "OWNER_NAME": "CYPRESS WEST HOLDINGS", "JUST_VALUE": 340000, "SALE_PRICE": 320000,
             "SALE_DATE": "2025-12-05", "LAND_USE_CODE": 1, "_lat": 27.9490, "_lng": -82.4870},
            {"_source": "hcpa", "ADDRESS": "1720 E 7th Ave", "CITY": "Tampa", "ZIP": "33605",
             "OWNER_NAME": "YBOR CITY INVESTORS GROUP", "JUST_VALUE": 560000, "SALE_PRICE": 520000,
             "SALE_DATE": "2026-03-12", "LAND_USE_CODE": 48, "_lat": 27.9615, "_lng": -82.4332},
        ]
        return rows[:limit]
