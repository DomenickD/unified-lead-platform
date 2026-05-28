import os

from fastapi import APIRouter, HTTPException, Query

from app.integrations.tampa_construction import (
    HILLSBOROUGH_PERMITS_DATASET_ID,
    TAMPA_PERMITS_DATASET_ID,
    fetch_all_tampa_construction_permits,
    permits_to_leads,
)
from app.schemas.construction import ConstructionFeedStatus, ConstructionPermit

# Reference to the shared leads store — injected at import time from leads.py.
# When a real DB is added, replace this with DB write calls.
from app.api.routes import leads as leads_module

router = APIRouter()


@router.get("/status", response_model=ConstructionFeedStatus)
def feed_status():
    """Reports which data sources are configured vs. missing credentials."""
    configured = []
    missing = []
    for name, dataset_id in [
        ("tampa_city_permits", TAMPA_PERMITS_DATASET_ID),
        ("hillsborough_county_permits", HILLSBOROUGH_PERMITS_DATASET_ID),
    ]:
        if dataset_id:
            configured.append(name)
        else:
            missing.append(name)

    return ConstructionFeedStatus(
        feeds_configured=configured,
        feeds_missing_config=missing,
        total_permits_fetched=0,
        total_leads_generated=0,
    )


@router.get("/permits", response_model=list[ConstructionPermit])
async def list_construction_permits(
    limit: int = Query(50, ge=1, le=500),
    min_value: float = Query(100_000, ge=0),
):
    """
    Fetch live Tampa-area construction permits from configured data feeds.

    Returns raw permit records normalized to a common schema.
    Configure feeds via environment variables — see .env.example.
    """
    permits = await fetch_all_tampa_construction_permits()
    filtered = [p for p in permits if (p.get("estimated_value") or 0) >= min_value]
    return filtered[:limit]


@router.get("/leads")
async def list_construction_leads(
    limit: int = Query(50, ge=1, le=500),
    min_value: float = Query(500_000, ge=0),
):
    """
    Returns Tampa construction permits mapped to the platform's Lead schema.
    These are live-fetched and not yet persisted to the leads store.
    Call POST /sync to persist them.
    """
    permits = await fetch_all_tampa_construction_permits()
    filtered = [p for p in permits if (p.get("estimated_value") or 0) >= min_value]
    leads = permits_to_leads(filtered)
    return leads[:limit]


@router.post("/sync", status_code=200)
async def sync_construction_leads(
    min_value: float = Query(500_000, ge=0),
    dry_run: bool = Query(False),
):
    """
    Fetch Tampa construction permits and inject them into the leads store.

    - `min_value`: only import permits with estimated value >= this amount
    - `dry_run=true`: preview what would be imported without writing anything

    Returns a summary of what was (or would be) added.
    """
    permits = await fetch_all_tampa_construction_permits()
    filtered = [p for p in permits if (p.get("estimated_value") or 0) >= min_value]
    leads = permits_to_leads(filtered)

    if dry_run:
        return {
            "dry_run": True,
            "permits_fetched": len(permits),
            "leads_to_import": len(leads),
            "preview": leads[:5],
        }

    added = 0
    for lead_data in leads:
        # Strip the underscore-prefixed passthrough keys before creating the Lead
        core = {k: v for k, v in lead_data.items() if not k.startswith("_")}
        try:
            from app.schemas.lead import LeadCreate

            payload = LeadCreate(**core)
            leads_module.create_lead(payload)
            added += 1
        except Exception as exc:
            # Log and skip individual bad records rather than failing the whole sync
            import logging

            logging.getLogger(__name__).warning("Skipping lead during sync: %s", exc)

    return {
        "dry_run": False,
        "permits_fetched": len(permits),
        "leads_imported": added,
    }
