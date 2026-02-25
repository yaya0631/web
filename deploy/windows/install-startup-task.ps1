param(
    [string]$Domain = "sphynx0631.mooo.com"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$taskName = "Sphynx0631-Web-Host"
$scriptPath = Join-Path $projectRoot "deploy\windows\start-caddy.ps1"

if (-not (Test-Path $scriptPath)) {
    throw "start-caddy script not found at $scriptPath"
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -Domain $Domain"

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Starts Caddy static host for $Domain at user logon." `
    -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
Write-Output "Scheduled task '$taskName' installed and started."
