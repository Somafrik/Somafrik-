# Lance l'API Somafrik (backend)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$nodePath = "C:\Program Files\nodejs"
$npmGlobal = Join-Path $env:APPDATA "npm"

if (Test-Path $nodePath) {
  $env:PATH = "$nodePath;$npmGlobal;" + $env:PATH
}

Set-Location $root

if (-not (Test-Path "$root\backend\node_modules\express")) {
  Write-Host "Installation des dependances backend..."
  & npm --prefix backend install
}

Write-Host "Demarrage du backend sur http://127.0.0.1:5000"
& npm run backend
