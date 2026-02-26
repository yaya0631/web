param(
  [string]$InputPath = "",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($InputPath)) {
  $InputPath = Join-Path $repoRoot "deploy\secrets\env.local.secure"
}
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $repoRoot ".env.local"
}

if (!(Test-Path $InputPath)) {
  throw "Secure file not found: $InputPath"
}

$encrypted = Get-Content $InputPath -Raw
$secure = ConvertTo-SecureString $encrypted
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

Set-Content -Path $OutputPath -Value $plain -Encoding UTF8
Write-Host "Env restored to: $OutputPath"
