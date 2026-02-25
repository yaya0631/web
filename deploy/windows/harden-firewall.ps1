$ErrorActionPreference = "Stop"

function Get-CaddyExe {
    $cmd = Get-Command caddy -ErrorAction SilentlyContinue
    if ($cmd -and (Test-Path $cmd.Source)) {
        return $cmd.Source
    }

    $candidate = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe"
    if (Test-Path $candidate) {
        return $candidate
    }

    throw "Caddy executable not found. Install Caddy first."
}

$caddyExe = Get-CaddyExe

$rulesToReplace = @(
    "Web Host - Allow HTTP (Caddy)",
    "Web Host - Allow HTTPS (Caddy)",
    "Web Host - Block Remote Mgmt (Public)"
)

foreach ($name in $rulesToReplace) {
    Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
}

New-NetFirewallRule `
    -DisplayName "Web Host - Allow HTTP (Caddy)" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 80 `
    -Program $caddyExe `
    -Profile Any | Out-Null

New-NetFirewallRule `
    -DisplayName "Web Host - Allow HTTPS (Caddy)" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 443 `
    -Program $caddyExe `
    -Profile Any | Out-Null

# Reduce exposure for common remote-management ports on public networks.
New-NetFirewallRule `
    -DisplayName "Web Host - Block Remote Mgmt (Public)" `
    -Direction Inbound `
    -Action Block `
    -Protocol TCP `
    -LocalPort 22,23,3389,445,5985,5986 `
    -Profile Public | Out-Null

Set-NetFirewallProfile -Profile Public -DefaultInboundAction Block -DefaultOutboundAction Allow

Write-Output "Firewall rules applied for secure web hosting."
