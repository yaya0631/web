# GeoMan Web (React + Supabase + Vercel)

Professional web app for dossier management.

## Live URLs

- Production (Vercel): `https://web-lake-six-70.vercel.app`
- Standby (GitHub Pages): `https://yaya0631.github.io/web/`

## Stack

- React 19
- Vite 7
- Supabase (database/backend)
- Vercel (production hosting)
- GitHub Pages (standby hosting)

## Environment

Use `.env.local` with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are also accepted for compatibility.

## Local Development

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

## Build

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

## Deploy Production (Vercel)

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add .
& 'C:\Program Files\Git\cmd\git.exe' commit -m "update app"
& 'C:\Program Files\Git\cmd\git.exe' push origin main
& 'C:\Program Files\nodejs\npx.cmd' vercel --prod --yes
```

## Free Reliability Setup (Applied)

This project now includes automation for the 5 free-safety points:

1. Keep free stack (Vercel + Supabase) and monitor health.
2. Weekly backups in 2 locations.
3. Secure local backup of env file.
4. Monthly automated health check.
5. Standby free deployment via GitHub Pages.

### One-time setup on this PC

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run setup:free
& 'C:\Program Files\nodejs\npm.cmd' run env:secure:save
```

### What gets installed

- Weekly scheduled task: `GeoManWeeklyBackup`
  - Runs Sunday 20:00
  - Exports Supabase data to:
    - `files/backups/weekly` (inside repo)
    - `%USERPROFILE%\Documents\GeoManBackups\weekly` (second copy)
- Monthly scheduled task: `GeoManMonthlyCheck`
  - Runs day 1 at 09:00
  - Writes health reports to `files/health`

### Manual backup command

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run backup:weekly
```

### Manual health check command

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run health:monthly
```

### Secure env backup / restore

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run env:secure:save
& 'C:\Program Files\nodejs\npm.cmd' run env:secure:restore
```

Encrypted env file path:

- `deploy/secrets/env.local.secure`

## GitHub Automation Added

- `.github/workflows/standby-pages.yml`
  - Deploys standby app to GitHub Pages on each push to `main`.
- `.github/workflows/weekly-backup.yml`
  - Weekly cloud backup artifact (90-day retention).
- `.github/workflows/monthly-health.yml`
  - Monthly cloud health report artifact (90-day retention).

## Common Files to Edit

- `src/App.jsx`
- `src/App.css`
- `src/components/*`
- `src/hooks/*`
- `src/lib/*`

## Troubleshooting

- If PowerShell blocks `npm`/`npx`, use `npm.cmd`/`npx.cmd`.
- If Vercel deploy fails:

```powershell
& 'C:\Program Files\nodejs\npx.cmd' vercel logs
```
