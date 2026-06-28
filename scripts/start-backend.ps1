# Démarre le backend Somafrik (mode mémoire, sans PostgreSQL).
# Usage : powershell -ExecutionPolicy Bypass -File scripts\start-backend.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$nodePath = "C:\Program Files\nodejs"
$npmGlobal = Join-Path $env:APPDATA "npm"

if (Test-Path $nodePath) {
  $env:PATH = "$nodePath;$npmGlobal;" + $env:PATH
}

Set-Location (Join-Path $root "backend")
$env:SOMAFRIK_DB_REQUIRED = "false"
$env:NODE_ENV = "development"

Write-Host "Demarrage backend Somafrik (memoire) sur http://0.0.0.0:5000 ..."
Write-Host "Test : http://192.168.1.35:5000/api/health"
Write-Host ""

node scripts/dev-memory.js
