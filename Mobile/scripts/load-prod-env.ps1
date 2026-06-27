# Lit EXPO_PUBLIC_* depuis la racine du workspace (.env) pour aligner mobile et backend/web.
param(
    [string]$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
)

$ErrorActionPreference = "Stop"

function Read-DotEnvFile {
    param([string]$Path)
    $result = @{}
    if (-not (Test-Path $Path)) {
        return $result
    }
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
        $eq = $trimmed.IndexOf("=")
        if ($eq -le 0) { continue }
        $key = $trimmed.Substring(0, $eq).Trim()
        $value = $trimmed.Substring($eq + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $result[$key] = $value
    }
    return $result
}

$envPath = Join-Path $WorkspaceRoot ".env"
$vars = Read-DotEnvFile $envPath

$apiUrl = $vars["EXPO_PUBLIC_API_URL"]
if (-not $apiUrl) {
    $apiUrl = $env:EXPO_PUBLIC_API_URL
}
$demoMode = if ($vars.ContainsKey("EXPO_PUBLIC_DEMO_MODE")) { $vars["EXPO_PUBLIC_DEMO_MODE"] } else { "false" }

if (-not $apiUrl) {
    Write-Error "EXPO_PUBLIC_API_URL manquant. Définissez-le dans $envPath (même URL que le backend/web en prod)."
}

if ($apiUrl -match "localhost|127\.0\.0\.1") {
    Write-Error "EXPO_PUBLIC_API_URL ne peut pas être localhost pour une release Play Store. Utilisez l'URL publique ou LAN du serveur prod."
}

if ($apiUrl -match "^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.") {
    Write-Warning "URL privée détectée ($apiUrl). Les téléphones hors de votre réseau local ne pourront pas joindre l'API."
}

return @{
    ApiUrl = $apiUrl.TrimEnd("/")
    DemoMode = $demoMode
    EnvPath = $envPath
}
