param(
  [string]$PrimaryDir = "",
  [string]$SecondaryDir = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$configPath = Join-Path $PSScriptRoot "reliability.config.json"
if (Test-Path $configPath) {
  $cfg = Get-Content $configPath -Raw | ConvertFrom-Json
  if ([string]::IsNullOrWhiteSpace($PrimaryDir) -and $cfg.primaryDir) {
    $PrimaryDir = [string]$cfg.primaryDir
  }
  if ([string]::IsNullOrWhiteSpace($SecondaryDir) -and $cfg.secondaryDir) {
    $SecondaryDir = [string]$cfg.secondaryDir
  }
}

if ([string]::IsNullOrWhiteSpace($PrimaryDir)) {
  $PrimaryDir = Join-Path $repoRoot "files\backups\weekly"
}
if ([string]::IsNullOrWhiteSpace($SecondaryDir)) {
  $SecondaryDir = Join-Path $env:USERPROFILE "Documents\GeoManBackups\weekly"
}

Push-Location $repoRoot
try {
  & node .\scripts\backup_supabase.mjs --primary "$PrimaryDir" --secondary "$SecondaryDir" --keep-days 120
} finally {
  Pop-Location
}
