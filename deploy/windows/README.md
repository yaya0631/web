# Windows Hosting (No CNAME Required)

This setup hosts the built React app directly from this machine using Caddy.
It works with an `A` record for `sphynx0631.mooo.com`.

## 1) DNS and Router

- DNS `A` record: `sphynx0631` -> your public IPv4.
- Router/NAT: forward TCP `80` and `443` to this Windows machine.

## 2) Build and Start

```powershell
# from project root
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run build

powershell -ExecutionPolicy Bypass -File .\deploy\windows\start-caddy.ps1 -Domain sphynx0631.mooo.com
```

## 3) Security Hardening (Run as Administrator)

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\windows\harden-firewall.ps1
```

## 4) Stop Service

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\windows\stop-caddy.ps1
```

## 5) Auto-Start at Logon

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\windows\install-startup-task.ps1 -Domain sphynx0631.mooo.com
```

Remove:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy\windows\remove-startup-task.ps1
```

## Notes

- Caddy handles HTTPS certificates automatically once DNS and port-forwarding are correct.
- This setup serves only static files from `dist/`.
