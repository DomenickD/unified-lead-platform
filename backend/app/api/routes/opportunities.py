from fastapi import APIRouter, HTTPException
from app.schemas.opportunity import Opportunity, OpportunityCreate, OpportunityUpdate

router = APIRouter()

# In-memory store — replace with DB calls once a database is configured
_opportunities: dict[int, dict] = {
    1: {"id": 1, "name": "Palm Heights Multi-Family", "valuation": 42_500_000, "sector": "Real Estate", "confidence": 0.88, "flagged": False},
    2: {"id": 2, "name": "Bay Bridge Expansion Ph. II", "valuation": 128_000_000, "sector": "Construction", "confidence": 0.94, "flagged": False},
    3: {"id": 3, "name": "NexusTech Series C Bridge", "valuation": 15_000_000, "sector": "Funding", "confidence": 0.72, "flagged": False},
    4: {"id": 4, "name": "Orlando Hospitality Hub (RE-EVAL)", "valuation": 67_200_000, "sector": "Real Estate", "confidence": 0.41, "flagged": True},
    5: {"id": 5, "name": "Miami Smart-Grid Upgrade", "valuation": 210_500_000, "sector": "Construction", "confidence": 0.91, "flagged": False},
}
_next_id = 6


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
