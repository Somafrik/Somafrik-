# Génère le keystore release pour signer l'AAB localement (Google Play).
# Usage : powershell -ExecutionPolicy Bypass -File scripts/generate-release-keystore.ps1

$ErrorActionPreference = "Stop"
$mobileRoot = Split-Path -Parent $PSScriptRoot
$keystorePath = Join-Path $mobileRoot "release.keystore"
$propsExample = Join-Path $mobileRoot "android\keystore.properties.example"
$propsPath = Join-Path $mobileRoot "android\keystore.properties"

if (Test-Path $keystorePath) {
    Write-Host "Le keystore existe déjà : $keystorePath"
    exit 0
}

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    Write-Error "keytool introuvable. Installez le JDK (Java) et ajoutez-le au PATH."
}

$password = Read-Host "Mot de passe du keystore (à conserver précieusement)"
$keyPassword = Read-Host "Mot de passe de la clé (Entrée = identique au keystore)"
if ([string]::IsNullOrWhiteSpace($keyPassword)) {
    $keyPassword = $password
}

& keytool -genkeypair -v `
    -storetype PKCS12 `
    -keystore $keystorePath `
    -alias somafrik-release `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $password `
    -keypass $keyPassword `
    -dname "CN=Somafrik, OU=Mobile, O=Somafrik, L=Abidjan, ST=Abidjan, C=CI"

Copy-Item $propsExample $propsPath -Force
(Get-Content $propsPath -Raw) `
    -replace "VOTRE_MOT_DE_PASSE", $password `
    | Set-Content $propsPath -NoNewline

Write-Host ""
Write-Host "Keystore créé : $keystorePath"
Write-Host "Config signing : $propsPath"
Write-Host "Conservez le mot de passe : Google Play l'exigera pour les mises à jour."
