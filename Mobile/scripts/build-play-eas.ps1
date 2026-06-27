# Build AAB via EAS (cloud) pour Google Play Console.
# Lit EXPO_PUBLIC_API_URL depuis la racine (.env) — même source que le backend/web Docker.
# Prérequis : eas login (une seule fois)

$ErrorActionPreference = "Stop"
$mobileRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $mobileRoot
$nodePath = "C:\Program Files\nodejs"
$npmGlobal = Join-Path $env:APPDATA "npm"

if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$npmGlobal;" + $env:PATH
}

Set-Location $mobileRoot

$profile = if ($args.Count -gt 0) { $args[0] } else { "production" }
$easEnvironment = switch ($profile) {
    "preview" { "preview" }
    "development" { "development" }
    default { "production" }
}

Write-Host "Build EAS Android (profil: $profile, env EAS: $easEnvironment)..."

$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Vous n'êtes pas connecté à Expo. Lancez d'abord :"
    Write-Host "  eas login"
    exit 1
}
Write-Host "Connecté en tant que : $whoami"

$prodEnv = & (Join-Path $PSScriptRoot "load-prod-env.ps1") -WorkspaceRoot $workspaceRoot
$apiUrl = $prodEnv.ApiUrl
$demoMode = $prodEnv.DemoMode

Write-Host "API injectée dans le build mobile : $apiUrl"

# .env local pour la résolution app.config.js côté CLI EAS
@"
EXPO_PUBLIC_API_URL=$apiUrl
EXPO_PUBLIC_DEMO_MODE=$demoMode
"@ | Set-Content -Path (Join-Path $mobileRoot ".env") -Encoding utf8

if ($profile -in @("production", "preview")) {
    & (Join-Path $PSScriptRoot "sync-eas-env.ps1") -Environment $easEnvironment -ApiUrl $apiUrl -DemoMode $demoMode
}

$env:EXPO_PUBLIC_API_URL = $apiUrl
$env:EXPO_PUBLIC_DEMO_MODE = $demoMode

eas build --platform android --profile $profile --non-interactive
