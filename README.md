# unified-lead-platform

**CapitalStream** — Unified Opportunity Dashboard for institutional capital allocation and lead management.

## Stack

| Layer    | Tech                     |
|----------|--------------------------|
| Backend  | FastAPI (Python)         |
| Frontend | React + Vite + Tailwind  |
| Database | TBD                      |

## Project Structure

```
unified-lead-platform/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── api/routes/       # dashboard, leads, opportunities, funding
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── models/           # DB models (placeholder)
│   │   └── db/database.py    # DB connection placeholder
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/              # API client + per-resource modules
    │   ├── hooks/            # Data-fetching hooks
    │   ├── components/
    │   │   ├── layout/       # AppShell, Header, Sidebar, Footer
    │   │   └── ui/           # MetricCard, Badge, ProgressBar
    │   └── pages/            # Dashboard, LeadManagement, OpportunityDiscovery, FundingPortal, MapView, Settings
    ├── tailwind.config.js
    └── vite.config.js
```

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs available at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:5173

## Database

Not yet configured. See `backend/app/db/database.py` for instructions on adding PostgreSQL, SQLite, or MongoDB.
Replace the in-memory stores in each route file with real DB calls once a database is chosen.
