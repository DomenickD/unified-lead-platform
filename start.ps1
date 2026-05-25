# CapitalStream start script (Windows / PowerShell)
param(
    [switch]$Build,
    [switch]$Down,
    [switch]$Logs
)

$composeFile = Join-Path $PSScriptRoot "docker-compose.yml"

if ($Down) {
    Write-Host "Stopping CapitalStream..." -ForegroundColor Yellow
    docker compose -f $composeFile down
    exit 0
}

if ($Logs) {
    docker compose -f $composeFile logs -f
    exit 0
}

# Check Docker is running
if (-not (docker info 2>$null)) {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  CapitalStream" -ForegroundColor White
Write-Host "  Starting services..." -ForegroundColor Gray
Write-Host ""

$buildFlag = if ($Build) { "--build" } else { "" }

if ($buildFlag) {
    docker compose -f $composeFile up --build -d
} else {
    docker compose -f $composeFile up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start. Run with -Build to rebuild images." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  App running at:" -ForegroundColor Green
Write-Host "    Frontend  ->  http://localhost" -ForegroundColor Cyan
Write-Host "    API       ->  http://localhost:8000" -ForegroundColor Cyan
Write-Host "    API docs  ->  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To stop:  .\start.ps1 -Down" -ForegroundColor Gray
Write-Host "  To logs:  .\start.ps1 -Logs" -ForegroundColor Gray
Write-Host ""
