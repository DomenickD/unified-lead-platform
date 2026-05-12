from fastapi import APIRouter, HTTPException
from app.schemas.lead import Lead, LeadCreate, LeadUpdate

router = APIRouter()

# In-memory store — replace with DB calls once a database is configured
_leads: dict[int, dict] = {
    1: {"id": 1, "name": "Biscayne Waterfront Office", "location": "Miami, FL", "sector": "Commercial", "deal_size": 82_500_000, "status": "Funded", "confidence": 0.92},
    2: {"id": 2, "name": "Orlando Logistics Hub", "location": "Orlando, FL", "sector": "Industrial", "deal_size": 145_000_000, "status": "Under Review", "confidence": 0.55},
    3: {"id": 3, "name": "Tampa Residential Portfolio", "location": "Tampa, FL", "sector": "Multi-family", "deal_size": 28_400_000, "status": "Contacted", "confidence": 0.70},
    4: {"id": 4, "name": "Jacksonville Retail Strip", "location": "Jacksonville, FL", "sector": "Retail", "deal_size": 12_200_000, "status": "Under Review", "confidence": 0.48},
}
_next_id = 5


@router.get("/", response_model=list[Lead])
def list_leads():
    return list(_leads.values())


@router.get("/{lead_id}", response_model=Lead)
def get_lead(lead_id: int):
    if lead_id not in _leads:
        raise HTTPException(status_code=404, detail="Lead not found")
    return _leads[lead_id]


@router.post("/", response_model=Lead, status_code=201)
def create_lead(payload: LeadCreate):
    global _next_id
    lead = {"id": _next_id, **payload.model_dump()}
    _leads[_next_id] = lead
    _next_id += 1
    return lead


@router.patch("/{lead_id}", response_model=Lead)
def update_lead(lead_id: int, payload: LeadUpdate):
    if lead_id not in _leads:
        raise HTTPException(status_code=404, detail="Lead not found")
    _leads[lead_id].update({k: v for k, v in payload.model_dump().items() if v is not None})
    return _leads[lead_id]


@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: int):
    if lead_id not in _leads:
        raise HTTPException(status_code=404, detail="Lead not found")
    del _leads[lead_id]
