# Synchronise EXPO_PUBLIC_* vers l'environnement EAS (production / preview).
param(
    [Parameter(Mandatory = $true)]
    [string]$Environment,
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,
    [string]$DemoMode = "false"
)

$ErrorActionPreference = "Stop"

foreach ($entry in @(
    @{ Name = "EXPO_PUBLIC_API_URL"; Value = $ApiUrl },
    @{ Name = "EXPO_PUBLIC_DEMO_MODE"; Value = $DemoMode }
)) {
    Write-Host "Sync EAS [$Environment] $($entry.Name) = $($entry.Value)"
    eas env:create `
        --name $entry.Name `
        --value $entry.Value `
        --environment $Environment `
        --visibility plaintext `
        --force
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Échec sync EAS pour $($entry.Name)."
    }
}

Write-Host "Variables EAS synchronisées pour '$Environment'."
