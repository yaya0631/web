import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
      continue
    }
    args[key] = next
    i += 1
  }
  return args
}

async function readEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const out = {}
    for (const line of raw.split(/\r?\n/)) {
      const clean = line.trim()
      if (!clean || clean.startsWith('#')) continue
      const idx = clean.indexOf('=')
      if (idx < 0) continue
      out[clean.slice(0, idx).trim()] = clean.slice(idx + 1).trim()
    }
    return out
  } catch {
    return {}
  }
}

async function checkSite(siteUrl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(siteUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    })
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function checkSupabase(url, anonKey) {
  const client = createClient(url, anonKey)
  const { count, error } = await client
    .from('dossiers')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return {
      ok: false,
      error: error.message,
      count: null,
    }
  }
  return {
    ok: true,
    error: null,
    count: count ?? 0,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const envLocal = await readEnvFile(path.join(REPO_ROOT, '.env.local'))
  const envDot = await readEnvFile(path.join(REPO_ROOT, '.env'))
  const cfg = { ...envDot, ...envLocal, ...process.env }

  const url = cfg.VITE_SUPABASE_URL || cfg.SUPABASE_URL
  const anonKey = cfg.VITE_SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY
  const siteUrl = args['site-url'] || cfg.WEBSITE_URL || 'https://web-lake-six-70.vercel.app'
  const outputDir = path.resolve(args.output || path.join(REPO_ROOT, 'files', 'health'))

  if (!url || !anonKey) {
    throw new Error('Missing Supabase env values (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  }

  await fs.mkdir(outputDir, { recursive: true })

  const web = await checkSite(siteUrl)
  const db = await checkSupabase(url, anonKey)
  const ok = web.ok && db.ok

  const report = {
    schema: 'geoman.healthcheck.v1',
    generated_at: new Date().toISOString(),
    site_url: siteUrl,
    ok,
    checks: {
      web,
      supabase: db,
    },
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputPath = path.join(outputDir, `health-${stamp}.json`)
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  console.log(`[health] ok=${ok}`)
  console.log(`[health] web_status=${web.status}`)
  console.log(`[health] supabase_count=${db.count ?? 'n/a'}`)
  console.log(`[health] report=${outputPath}`)

  if (!ok) process.exitCode = 1
}

main().catch((error) => {
  console.error(`[health] failed: ${error.message}`)
  process.exitCode = 1
})
