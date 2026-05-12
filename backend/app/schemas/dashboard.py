from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_active_leads: int
    funding_volume: float
    funding_capacity: float
    florida_exclusivity_active: bool
    florida_geo_coverage: float
    avg_deal_velocity_days: float
    deal_velocity_delta: float


class RegionTrend(BaseModel):
    region: str
    state: str
    change_pct: float


class SectorPipeline(BaseModel):
    sector: str
    total: float
    allocated_pct: float
