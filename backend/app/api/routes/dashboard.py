from fastapi import APIRouter
from app.schemas.dashboard import DashboardMetrics, RegionTrend, SectorPipeline

router = APIRouter()

# Mock data — replace with DB queries once a database is configured
_MOCK_METRICS = DashboardMetrics(
    total_active_leads=1402,
    funding_volume=2_840_000_000,
    funding_capacity=5_000_000_000,
    florida_exclusivity_active=True,
    florida_geo_coverage=94.0,
    avg_deal_velocity_days=14.2,
    deal_velocity_delta=-2.1,
)

_MOCK_REGIONS = [
    RegionTrend(region="Tampa Bay (Hillsborough/Pinellas)", state="FL", change_pct=35.0),
    RegionTrend(region="South Florida (Miami/Dade)", state="FL", change_pct=18.0),
    RegionTrend(region="Central Florida (Orlando/Orange)", state="FL", change_pct=12.0),
]

_MOCK_PIPELINES = [
    SectorPipeline(sector="Real Estate", total=420_000_000, allocated_pct=65.0),
    SectorPipeline(sector="Construction", total=242_000_000, allocated_pct=42.0),
    SectorPipeline(sector="Funding", total=178_000_000, allocated_pct=89.0),
]


@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics():
    return _MOCK_METRICS


@router.get("/regions", response_model=list[RegionTrend])
def get_trending_regions():
    return _MOCK_REGIONS


@router.get("/pipelines", response_model=list[SectorPipeline])
def get_sector_pipelines():
    return _MOCK_PIPELINES
