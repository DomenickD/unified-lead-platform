from fastapi import APIRouter, Query
from app.integrations.tampa_grants import TampaGrantsFeed

# Reference to the shared leads store
from app.api.routes import leads as leads_module

router = APIRouter()

@router.get("/")
async def list_grants(
    limit: int = Query(50, ge=1, le=500),
):
    """
    Fetch live Tampa-area grants and funding opportunities.
    Returns grant records normalized from city, state, and federal sources.
    """
    feed = TampaGrantsFeed()
    grants = await feed.fetch_normalized()
    return grants[:limit]

@router.post("/sync", status_code=200)
async def sync_grants_leads(
    dry_run: bool = Query(False),
):
    """
    Fetch Tampa-area grants and inject them into the leads store.
    """
    feed = TampaGrantsFeed()
    grants = await feed.fetch_normalized()

    leads = []
    for g in grants:
        leads.append({
            "name": f"{g['title']} — {g['agency'].split(' (')[0]}",
            "location": f"{g['address']}, Tampa, FL",
            "sector": "Funding",
            "deal_size": g["funding_amount"],
            "status": "New",
            "confidence": 0.85,
            "latitude": g["latitude"],
            "longitude": g["longitude"]
        })

    if dry_run:
        return {
            "dry_run": True,
            "grants_fetched": len(grants),
            "leads_to_import": len(leads),
            "preview": leads[:5]
        }

    added = 0
    from app.schemas.lead import LeadCreate
    for lead_data in leads:
        try:
            payload = LeadCreate(**lead_data)
            leads_module.create_lead(payload)
            added += 1
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Skipping grant lead during sync: %s", exc)

    return {
        "dry_run": False,
        "grants_fetched": len(grants),
        "leads_imported": added
    }
