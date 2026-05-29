from fastapi import APIRouter, Query
from app.integrations.real_estate import RealEstateFeed
from app.api.routes import leads as leads_module
from app.schemas.lead import LeadCreate
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
async def list_properties(
    type: str = Query("all", description="all | listings | foreclosures | county"),
    limit: int = Query(50, ge=1, le=200),
):
    """Fetch live Tampa-area real estate listings, foreclosures, and county records."""
    feed = RealEstateFeed()
    return await feed.fetch_normalized(prop_type=type, limit=limit)


@router.post("/sync", status_code=200)
async def sync_real_estate_leads(
    type: str = Query("all"),
    dry_run: bool = Query(False),
):
    """Bulk-import real estate properties as leads."""
    feed = RealEstateFeed()
    properties = await feed.fetch_normalized(prop_type=type, limit=100)

    leads = []
    for p in properties:
        if not p.get("price", 0):
            continue
        sector = "Real Estate"
        prop_type = p.get("property_type", "")
        if "commercial" in prop_type.lower() or "industrial" in prop_type.lower():
            sector = "Commercial"
        elif "multi" in prop_type.lower():
            sector = "Multi-family"

        leads.append({
            "name": f"{p['property_type']} — {p['address']}, {p['city']}",
            "location": f"{p['address']}, {p['city']}, FL {p.get('zip', '')}".strip(),
            "sector": sector,
            "deal_size": float(p["price"]),
            "status": "New",
            "confidence": 0.80,
            "latitude": p.get("latitude"),
            "longitude": p.get("longitude"),
        })

    if dry_run:
        return {
            "dry_run": True,
            "properties_fetched": len(properties),
            "leads_to_import": len(leads),
            "preview": leads[:5],
        }

    added = 0
    for lead_data in leads:
        try:
            payload = LeadCreate(**lead_data)
            leads_module.create_lead(payload)
            added += 1
        except Exception as exc:
            logger.warning("Skipping real estate lead: %s", exc)

    return {
        "dry_run": False,
        "properties_fetched": len(properties),
        "leads_imported": added,
    }
