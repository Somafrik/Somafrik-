# Release alignée : backend + web (/web/) + mobile EAS sur la même URL API.
# Usage :
#   powershell -ExecutionPolicy Bypass -File scripts\release-prod-aligned.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\release-prod-aligned.ps1 -SkipDocker
#   powershell -ExecutionPolicy Bypass -File scripts\release-prod-aligned.ps1 -EasProfile preview

param(
    [switch]$SkipDocker,
    [string]$EasProfile = "production"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$nodePath = "C:\Program Files\nodejs"
$npmGlobal = Join-Path $env:APPDATA "npm"
if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$npmGlobal;" + $env:PATH
}

Set-Location $root

Write-Host "=== Somafrik — release prod alignée (web + mobile) ===" -ForegroundColor Cyan
Write-Host "Branche : $(git rev-parse --abbrev-ref HEAD)"
Write-Host "Commit  : $(git rev-parse --short HEAD)"
Write-Host ""

$prodEnv = & (Join-Path $root "Mobile\scripts\load-prod-env.ps1") -WorkspaceRoot $root
$apiUrl = $prodEnv.ApiUrl
Write-Host "API prod (web + mobile) : $apiUrl"
Write-Host ""

if (-not $SkipDocker) {
    Write-Host "1/3 — Rebuild Docker (backend + web intégré dans l'image)..." -ForegroundColor Yellow
    docker compose up -d --build postgres backend
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Échec docker compose up --build"
    }

    Write-Host "Attente santé backend..."
    $healthy = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -eq 200) {
                $healthy = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    if (-not $healthy) {
        Write-Warning "Backend non joignable sur http://127.0.0.1:5000/api/health — vérifiez docker compose logs backend"
    } else {
        Write-Host "Backend OK — web disponible sur http://127.0.0.1:5000/web/" -ForegroundColor Green
    }
} else {
    Write-Host "1/3 — Docker ignoré (-SkipDocker)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "2/3 — Vérification build web (type-check + vite)..." -ForegroundColor Yellow
npm --prefix web run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build web échoué — corrigez avant la release mobile."
}
Write-Host "Build web OK (web/dist)" -ForegroundColor Green

Write-Host ""
Write-Host "3/3 — Build EAS Android (profil: $EasProfile)..." -ForegroundColor Yellow
& (Join-Path $root "Mobile\scripts\build-play-eas.ps1") $EasProfile
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Cyan
Write-Host "Web prod  : $apiUrl/web/"
Write-Host "API mobile: $apiUrl/api"
Write-Host "Téléchargez l'AAB depuis le lien Expo affiché ci-dessus."
