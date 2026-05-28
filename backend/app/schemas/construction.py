from pydantic import BaseModel
from typing import Optional


class ConstructionPermit(BaseModel):
    permit_number: str
    permit_type: str
    description: Optional[str] = None
    address: str
    city: str
    state: str = "FL"
    zip_code: Optional[str] = None
    status: str
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    estimated_value: Optional[float] = None
    sqft: Optional[float] = None
    contractor_name: Optional[str] = None
    contractor_license: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: str


class ConstructionFeedStatus(BaseModel):
    feeds_configured: list[str]
    feeds_missing_config: list[str]
    total_permits_fetched: int
    total_leads_generated: int
