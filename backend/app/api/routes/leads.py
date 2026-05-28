from fastapi import APIRouter, HTTPException
from app.schemas.lead import Lead, LeadCreate, LeadUpdate

router = APIRouter()

# In-memory store — replace with DB calls once a database is configured
_leads: dict[int, dict] = {
    1: {"id": 1, "name": "Tampa Channelside Residential Development", "location": "Channelside Dr, Tampa, FL", "sector": "Multi-family", "deal_size": 45_000_000, "status": "New", "confidence": 0.88, "latitude": 27.9439, "longitude": -82.4452},
    2: {"id": 2, "name": "Hyde Park Boutique Office Hub", "location": "Hyde Park, Tampa, FL", "sector": "Commercial", "deal_size": 12_800_000, "status": "Contacted", "confidence": 0.78, "latitude": 27.9392, "longitude": -82.4788},
    3: {"id": 3, "name": "Hillsborough River Waterfront Towers", "location": "Ashley Dr, Tampa, FL", "sector": "Commercial", "deal_size": 95_000_000, "status": "Under Review", "confidence": 0.62, "latitude": 27.9482, "longitude": -82.4610},
    4: {"id": 4, "name": "SOHO Townhomes Community (Tampa)", "location": "South Howard Ave, Tampa, FL", "sector": "Multi-family", "deal_size": 16_500_000, "status": "Funded", "confidence": 0.95, "latitude": 27.9351, "longitude": -82.4831},
    5: {"id": 5, "name": "Tampa Port Logistics Center", "location": "Maritime Blvd, Tampa, FL", "sector": "Industrial", "deal_size": 110_000_000, "status": "Under Review", "confidence": 0.70, "latitude": 27.9050, "longitude": -82.4350},
    6: {"id": 6, "name": "Seminole Heights Eco-Village Grants", "location": "Florida Ave, Tampa, FL", "sector": "Funding", "deal_size": 3_200_000, "status": "New", "confidence": 0.82, "latitude": 27.9920, "longitude": -82.4600},
}
_next_id = 7


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
