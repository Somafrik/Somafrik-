# Arrête toute la stack Somafrik Docker.
param([switch]$Volumes)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($Volumes) {
  docker compose down -v
  Write-Host "Stack arretee (volumes supprimes)."
} else {
  docker compose down
  Write-Host "Stack arretee."
}
