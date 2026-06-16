param(
  [switch]$ResetDatabase
)

$ErrorActionPreference = "Stop"

Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

docker compose down

if ($ResetDatabase) {
  docker compose down --volumes
}

docker compose up -d --build
docker compose ps
