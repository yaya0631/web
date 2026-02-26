# Web App (React + Vite)

Small React site deployed on Vercel.

## Stack

- React 19
- Vite 7
- Vercel (production hosting)

## Live URLs

- Primary alias: `https://web-lake-six-70.vercel.app`
- Deployment URL (may change per deploy): `https://web-8mc7udkjp-yaya0631s-projects.vercel.app`

## Project Files You Will Usually Edit

- `src/App.jsx` for page content
- `src/App.css` for page styling
- `src/index.css` for global styling

## Supabase Environment Setup

This app now reads Supabase credentials from environment variables.

1. Copy `.env.example` to `.env.local`
2. Set values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Compatibility note:
- Production currently works with existing Vercel env names `SUPABASE_URL` and `SUPABASE_ANON_KEY` too.

## Run Locally

PowerShell-safe commands:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## Build Check Before Deploy

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build
```

This creates production files in `dist/`.

## Redeploy After Changes (No Router Setup Needed)

This app is hosted in the cloud, so no router port-forwarding is required.

1. Save your changes.
2. Commit and push to GitHub:

```powershell
& 'C:\Program Files\Git\cmd\git.exe' add .
& 'C:\Program Files\Git\cmd\git.exe' commit -m "update site"
& 'C:\Program Files\Git\cmd\git.exe' push origin main
```

3. Trigger a production deploy:

```powershell
& 'C:\Program Files\nodejs\npx.cmd' vercel --prod --yes
```

4. Open the URL returned by the command and verify the update.

## First-Time Vercel Login (Only If Needed)

```powershell
& 'C:\Program Files\nodejs\npx.cmd' vercel login
```

## Optional: Connect a Custom Domain

1. In Vercel: Project -> Settings -> Domains -> Add your domain.
2. In your domain/DNS provider: add the DNS records Vercel shows.
3. Wait for DNS propagation.

## Troubleshooting

- If `npm` or `npx` is blocked in PowerShell, use `npm.cmd` and `npx.cmd` commands as shown above.
- If deployment fails, run:

```powershell
& 'C:\Program Files\nodejs\npx.cmd' vercel logs
```
