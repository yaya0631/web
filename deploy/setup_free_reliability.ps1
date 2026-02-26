param(
  [string]$PrimaryDir = "",
  [string]$SecondaryDir = "",
  [string]$SiteUrl = "https://web-lake-six-70.vercel.app"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($PrimaryDir)) {
  $PrimaryDir = Join-Path $repoRoot "files\backups\weekly"
}
if ([string]::IsNullOrWhiteSpace($SecondaryDir)) {
  $SecondaryDir = Join-Path $env:USERPROFILE "Documents\GeoManBackups\weekly"
}

$null = New-Item -ItemType Directory -Path $PrimaryDir -Force
$null = New-Item -ItemType Directory -Path $SecondaryDir -Force
$null = New-Item -ItemType Directory -Path (Join-Path $repoRoot "files\health") -Force

$configPath = Join-Path $PSScriptRoot "reliability.config.json"
$config = @{
  primaryDir = $PrimaryDir
  secondaryDir = $SecondaryDir
  siteUrl = $SiteUrl
} | ConvertTo-Json
Set-Content -Path $configPath -Value $config -Encoding UTF8

$backupRunner = Join-Path $PSScriptRoot "run_weekly_backup.cmd"
$healthRunner = Join-Path $PSScriptRoot "run_monthly_health.cmd"

schtasks /Delete /TN "GeoManWeeklyBackup" /F | Out-Null
schtasks /Delete /TN "GeoManMonthlyCheck" /F | Out-Null

schtasks /Create /TN "GeoManWeeklyBackup" /SC WEEKLY /D SUN /ST 20:00 /TR "`"$backupRunner`"" /F | Out-Null
schtasks /Create /TN "GeoManMonthlyCheck" /SC MONTHLY /D 1 /ST 09:00 /TR "`"$healthRunner`"" /F | Out-Null

Write-Host "Scheduled task created: GeoManWeeklyBackup (Sunday 20:00)"
Write-Host "Scheduled task created: GeoManMonthlyCheck (day 1 each month, 09:00)"
Write-Host "Primary backups: $PrimaryDir"
Write-Host "Secondary backups: $SecondaryDir"
