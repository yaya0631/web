$ErrorActionPreference = "Stop"

$pidFile = Join-Path $PSScriptRoot "caddy.pid"

if (Test-Path $pidFile) {
    $pidValue = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($pidValue -as [int]) {
        $proc = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id ([int]$pidValue) -Force -ErrorAction SilentlyContinue
            Write-Output "Stopped Caddy PID $pidValue"
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

Get-Process -Name caddy -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
