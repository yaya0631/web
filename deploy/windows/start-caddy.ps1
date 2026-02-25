param(
    [string]$Domain = "sphynx0631.mooo.com",
    [switch]$Foreground
)

$ErrorActionPreference = "Stop"

function Get-CaddyExe {
    $cmd = Get-Command caddy -ErrorAction SilentlyContinue
    if ($cmd -and (Test-Path $cmd.Source)) {
        return $cmd.Source
    }

    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe"),
        "C:\Program Files\Caddy\caddy.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    throw "Caddy executable not found. Install Caddy first."
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$distPath = Join-Path $projectRoot "dist"
$templatePath = Join-Path $PSScriptRoot "Caddyfile.template"
$configPath = Join-Path $PSScriptRoot "Caddyfile"
$pidFile = Join-Path $PSScriptRoot "caddy.pid"
$logDir = Join-Path $PSScriptRoot "logs"

if (-not (Test-Path $distPath)) {
    throw "Build output not found at '$distPath'. Run npm run build first."
}
if (-not (Test-Path $templatePath)) {
    throw "Template not found at '$templatePath'."
}
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$caddyExe = Get-CaddyExe
$distPathPosix = ($distPath -replace '\\', '/')
$config = (Get-Content $templatePath -Raw).
    Replace("__DOMAIN__", $Domain).
    Replace("__DIST_PATH__", $distPathPosix)
Set-Content -Path $configPath -Value $config -Encoding ascii

if (Test-Path $pidFile) {
    $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($oldPid -as [int]) {
        $proc = Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id ([int]$oldPid) -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$args = @("run", "--config", $configPath, "--adapter", "caddyfile")
if ($Foreground) {
    & $caddyExe @args
    exit $LASTEXITCODE
}

$stdoutLog = Join-Path $logDir "caddy.out.log"
$stderrLog = Join-Path $logDir "caddy.err.log"
$proc = Start-Process `
    -FilePath $caddyExe `
    -ArgumentList $args `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog
Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii

Write-Output "Started Caddy (PID $($proc.Id)) for $Domain"
Write-Output "Config: $configPath"
Write-Output "Logs: $stdoutLog and $stderrLog"
