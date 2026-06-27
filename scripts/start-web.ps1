# Lance le BackOffice web Somafrik (Vite)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$nodePath = "C:\Program Files\nodejs"
$npmGlobal = Join-Path $env:APPDATA "npm"

if (Test-Path $nodePath) {
  $env:PATH = "$nodePath;$npmGlobal;" + $env:PATH
}

Set-Location $root

if (-not (Test-Path "$root\web\node_modules\vite\bin\vite.js")) {
  Write-Host "Installation des dependances web..."
  & npm --prefix web install
}

Write-Host "Demarrage du site web sur http://localhost:5173/web/"
& npm run web:dev
