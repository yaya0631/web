param(
  [string]$SiteUrl = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$configPath = Join-Path $PSScriptRoot "reliability.config.json"
if ((Test-Path $configPath) -and [string]::IsNullOrWhiteSpace($SiteUrl)) {
  $cfg = Get-Content $configPath -Raw | ConvertFrom-Json
  if ($cfg.siteUrl) { $SiteUrl = [string]$cfg.siteUrl }
}
if ([string]::IsNullOrWhiteSpace($SiteUrl)) {
  $SiteUrl = "https://web-lake-six-70.vercel.app"
}

Push-Location $repoRoot
try {
  & node .\scripts\health_check.mjs --site-url "$SiteUrl" --output ".\files\health"
} finally {
  Pop-Location
}
