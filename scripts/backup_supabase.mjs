import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { buildDesktopCsv } from '../src/lib/compat.js'

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
      const key = clean.slice(0, idx).trim()
      const value = clean.slice(idx + 1).trim()
      out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function ymd() {
  return new Date().toISOString().slice(0, 10)
}

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true })
}

async function fetchAllRows(client, pageSize = 500) {
  const rows = []
  let from = 0
  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await client
      .from('dossiers')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) throw new Error(`Supabase select error: ${error.message}`)
    if (!data || data.length === 0) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function pruneOldFiles(dirPath, keepDays) {
  const keepMs = keepDays * 24 * 60 * 60 * 1000
  const now = Date.now()
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const fullPath = path.join(dirPath, entry.name)
    const stat = await fs.stat(fullPath)
    if (now - stat.mtimeMs > keepMs) {
      await fs.unlink(fullPath)
    }
  }
}

async function copyOutputs(files, destinationDir) {
  await ensureDir(destinationDir)
  const copied = []
  for (const filePath of files) {
    const target = path.join(destinationDir, path.basename(filePath))
    await fs.copyFile(filePath, target)
    copied.push(target)
  }
  return copied
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const envLocal = await readEnvFile(path.join(REPO_ROOT, '.env.local'))
  const envDot = await readEnvFile(path.join(REPO_ROOT, '.env'))
  const cfg = { ...envDot, ...envLocal, ...process.env }

  const url = cfg.VITE_SUPABASE_URL || cfg.SUPABASE_URL
  const anonKey = cfg.VITE_SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env values (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  }

  const primaryDir = path.resolve(args.primary || path.join(REPO_ROOT, 'files', 'backups', 'weekly'))
  const secondaryDir = args.secondary ? path.resolve(args.secondary) : ''
  const keepDays = Number(args['keep-days'] || 120)

  await ensureDir(primaryDir)

  const client = createClient(url, anonKey)
  const rows = await fetchAllRows(client)

  const marker = `${ymd()}-${timestamp()}`
  const base = `geoman-supabase-backup-${marker}`
  const jsonPath = path.join(primaryDir, `${base}.json`)
  const csvPath = path.join(primaryDir, `${base}.csv`)

  const payload = {
    schema: 'geoman.supabase.backup.v1',
    generated_at: new Date().toISOString(),
    source: 'supabase.dossiers',
    count: rows.length,
    rows,
  }
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const csv = buildDesktopCsv(rows)
  await fs.writeFile(csvPath, `\uFEFF${csv}`, 'utf8')

  const generated = [jsonPath, csvPath]
  let copied = []
  if (secondaryDir) {
    copied = await copyOutputs(generated, secondaryDir)
  }

  await pruneOldFiles(primaryDir, keepDays)
  if (secondaryDir) await pruneOldFiles(secondaryDir, keepDays)

  console.log(`[backup] rows=${rows.length}`)
  console.log(`[backup] primary=${primaryDir}`)
  if (copied.length) console.log(`[backup] secondary=${secondaryDir}`)
  generated.forEach((f) => console.log(`[backup] file=${f}`))
  copied.forEach((f) => console.log(`[backup] copy=${f}`))
}

main().catch((error) => {
  console.error(`[backup] failed: ${error.message}`)
  process.exitCode = 1
})
