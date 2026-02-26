param(
  [string]$EnvPath = "",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($EnvPath)) {
  $EnvPath = Join-Path $repoRoot ".env.local"
}
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $repoRoot "deploy\secrets\env.local.secure"
}

if (!(Test-Path $EnvPath)) {
  throw "Env file not found: $EnvPath"
}

$secretDir = Split-Path $OutputPath -Parent
$null = New-Item -ItemType Directory -Path $secretDir -Force

$plain = Get-Content $EnvPath -Raw
$secure = ConvertTo-SecureString $plain -AsPlainText -Force
$encrypted = ConvertFrom-SecureString $secure
Set-Content -Path $OutputPath -Value $encrypted -Encoding UTF8

icacls $OutputPath /inheritance:r | Out-Null
icacls $OutputPath /grant:r "$($env:USERNAME):(R,W)" | Out-Null

Write-Host "Secure env backup saved to: $OutputPath"
