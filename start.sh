#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="$SCRIPT_DIR/docker-compose.yml"

case "$1" in
  down)
    echo "Stopping CapitalStream..."
    docker compose -f "$COMPOSE" down
    exit 0
    ;;
  logs)
    docker compose -f "$COMPOSE" logs -f
    exit 0
    ;;
  build)
    docker compose -f "$COMPOSE" up --build -d
    ;;
  *)
    docker compose -f "$COMPOSE" up -d
    ;;
esac

echo ""
echo "  App running at:"
echo "    Frontend  ->  http://localhost"
echo "    API       ->  http://localhost:8000"
echo "    API docs  ->  http://localhost:8000/docs"
echo ""
echo "  To stop:  ./start.sh down"
echo "  To logs:  ./start.sh logs"
echo ""
