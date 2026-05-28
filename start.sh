#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── backend ────────────────────────────────────────────────────────────────
cd "$ROOT/backend"

if [ ! -f .env ]; then
  echo "[start] No .env found — copying from .env.example"
  cp .env.example .env
fi

if [ ! -d .venv ]; then
  echo "[start] Creating Python virtual environment..."
  python -m venv .venv
fi

source .venv/Scripts/activate 2>/dev/null || source .venv/bin/activate

echo "[start] Installing backend dependencies..."
pip install -q -r requirements.txt

echo "[start] Starting backend (FastAPI on :8000)..."
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# ── frontend ───────────────────────────────────────────────────────────────
cd "$ROOT/frontend"

echo "[start] Installing frontend dependencies..."
npm install --silent

echo "[start] Starting frontend (Vite on :5174)..."
npm run dev &
FRONTEND_PID=$!

# ── shutdown handler ───────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "[start] Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo "[start] Done."
}
trap cleanup INT TERM

echo ""
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo "  Frontend: http://localhost:5174"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

wait
