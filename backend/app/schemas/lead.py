from pydantic import BaseModel
from typing import Optional
from enum import Enum


class LeadStatus(str, Enum):
    funded = "Funded"
    under_review = "Under Review"
    contacted = "Contacted"
    new = "New"


class LeadSector(str, Enum):
    real_estate = "Real Estate"
    construction = "Construction"
    funding = "Funding"
    commercial = "Commercial"
    industrial = "Industrial"
    multifamily = "Multi-family"
    retail = "Retail"


class LeadBase(BaseModel):
    name: str
    location: str
    sector: LeadSector
    deal_size: float
    status: LeadStatus
    confidence: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    sector: Optional[LeadSector] = None
    deal_size: Optional[float] = None
    status: Optional[LeadStatus] = None
    confidence: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class Lead(LeadBase):
    id: int

    class Config:
        from_attributes = True
