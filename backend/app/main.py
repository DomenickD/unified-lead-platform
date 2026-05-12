from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import dashboard, leads, opportunities, funding

app = FastAPI(title="CapitalStream API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(opportunities.router, prefix="/api/opportunities", tags=["opportunities"])
app.include_router(funding.router, prefix="/api/funding", tags=["funding"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
