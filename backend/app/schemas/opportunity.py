from pydantic import BaseModel
from typing import Optional
from enum import Enum


class OpportunitySector(str, Enum):
    real_estate = "Real Estate"
    construction = "Construction"
    funding = "Funding"


class OpportunityBase(BaseModel):
    name: str
    valuation: float
    sector: OpportunitySector
    confidence: float
    flagged: bool = False


class OpportunityCreate(OpportunityBase):
    pass


class OpportunityUpdate(BaseModel):
    name: Optional[str] = None
    valuation: Optional[float] = None
    sector: Optional[OpportunitySector] = None
    confidence: Optional[float] = None
    flagged: Optional[bool] = None


class Opportunity(OpportunityBase):
    id: int

    class Config:
        from_attributes = True
