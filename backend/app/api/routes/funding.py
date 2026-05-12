from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class FundingRequest(BaseModel):
    opportunity_name: str
    requested_amount: float
    sector: str
    notes: str = ""


class FundingRequestOut(FundingRequest):
    id: int
    status: str = "Pending"


_requests: dict[int, dict] = {}
_next_id = 1


@router.get("/", response_model=list[FundingRequestOut])
def list_funding_requests():
    return list(_requests.values())


@router.post("/", response_model=FundingRequestOut, status_code=201)
def submit_funding_request(payload: FundingRequest):
    global _next_id
    req = {"id": _next_id, "status": "Pending", **payload.model_dump()}
    _requests[_next_id] = req
    _next_id += 1
    return req
