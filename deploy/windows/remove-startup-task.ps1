$ErrorActionPreference = "Stop"
$taskName = "Sphynx0631-Web-Host"

$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Output "Removed scheduled task '$taskName'."
} else {
    Write-Output "Scheduled task '$taskName' not found."
}
