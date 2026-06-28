# Ouvre le pare-feu Windows pour le dev Somafrik (telephone -> PC).
# Executer en administrateur si les ports sont bloques.
# Usage : powershell -ExecutionPolicy Bypass -File scripts\open-firewall-dev.ps1

$ErrorActionPreference = "Stop"

$rules = @(
  @{ Name = "Somafrik API 5000"; Port = 5000 },
  @{ Name = "Somafrik Expo 8083"; Port = 8083 },
  @{ Name = "Somafrik Web 5173"; Port = 5173 }
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
  Write-Host "ATTENTION : PowerShell non administrateur." -ForegroundColor Yellow
  Write-Host "Si le telephone ne se connecte pas, relancez ce script en admin." -ForegroundColor Yellow
  Write-Host ""
}

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Regle deja presente : $($rule.Name)" -ForegroundColor DarkGray
    continue
  }
  if (-not $isAdmin) {
    Write-Host "Manquant (admin requis) : $($rule.Name) port $($rule.Port)" -ForegroundColor Yellow
    continue
  }
  New-NetFirewallRule `
    -DisplayName $rule.Name `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $rule.Port `
    -Profile Private, Domain | Out-Null
  Write-Host "Regle ajoutee : $($rule.Name) (TCP $($rule.Port))" -ForegroundColor Green
}
