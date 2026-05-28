from fastapi import APIRouter, HTTPException
from app.schemas.opportunity import Opportunity, OpportunityCreate, OpportunityUpdate

router = APIRouter()

# In-memory store — replace with DB calls once a database is configured
_opportunities: dict[int, dict] = {
    1: {"id": 1, "name": "Tampa Heights Commercial Redevelopment", "valuation": 18_500_000, "sector": "Real Estate", "confidence": 0.88, "flagged": False, "latitude": 27.9622, "longitude": -82.4604},
    2: {"id": 2, "name": "Ybor City Mixed-Use Development", "valuation": 34_000_000, "sector": "Real Estate", "confidence": 0.92, "flagged": False, "latitude": 27.9602, "longitude": -82.4368},
    3: {"id": 3, "name": "Hillsborough County Affordable Housing Grant", "valuation": 5_500_000, "sector": "Funding", "confidence": 0.85, "flagged": False, "latitude": 27.9506, "longitude": -82.4572},
    4: {"id": 4, "name": "Tampa Port Infrastructure Expansion (Phase I)", "valuation": 112_000_000, "sector": "Construction", "confidence": 0.94, "flagged": False, "latitude": 27.9250, "longitude": -82.4430},
    5: {"id": 5, "name": "Westshore Office Tower & Residential Space", "valuation": 78_000_000, "sector": "Real Estate", "confidence": 0.78, "flagged": False, "latitude": 27.9490, "longitude": -82.5280},
    6: {"id": 6, "name": "South Tampa Townhomes Project (Zoning Re-Eval)", "valuation": 12_400_000, "sector": "Real Estate", "confidence": 0.45, "flagged": True, "latitude": 27.9010, "longitude": -82.5020},
    7: {"id": 7, "name": "Tampa Bay Green Energy Grid Retrofit", "valuation": 45_000_000, "sector": "Construction", "confidence": 0.82, "flagged": False, "latitude": 27.9710, "longitude": -82.4490},
    8: {"id": 8, "name": "Florida Homebuyers Purchase Program (Tampa Portal)", "valuation": 8_000_000, "sector": "Funding", "confidence": 0.90, "flagged": False, "latitude": 27.9550, "longitude": -82.4700},
}
_next_id = 9


@router.get("/", response_model=list[Opportunity])
def list_opportunities():
    return list(_opportunities.values())


@router.get("/{opp_id}", response_model=Opportunity)
def get_opportunity(opp_id: int):
    if opp_id not in _opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return _opportunities[opp_id]


@router.post("/", response_model=Opportunity, status_code=201)
def create_opportunity(payload: OpportunityCreate):
    global _next_id
    opp = {"id": _next_id, **payload.model_dump()}
    _opportunities[_next_id] = opp
    _next_id += 1
    return opp


@router.patch("/{opp_id}", response_model=Opportunity)
def update_opportunity(opp_id: int, payload: OpportunityUpdate):
    if opp_id not in _opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    _opportunities[opp_id].update({k: v for k, v in payload.model_dump().items() if v is not None})
    return _opportunities[opp_id]


@router.delete("/{opp_id}", status_code=204)
def delete_opportunity(opp_id: int):
    if opp_id not in _opportunities:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    del _opportunities[opp_id]
