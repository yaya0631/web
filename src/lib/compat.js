const STATUS_VALUES = {
  IN_PROGRESS: 'En cours',
  WAITING: 'En attente',
  DONE: 'Termine',
  BLOCKED: 'Bloque',
  ARCHIVED: 'Archive',
  TRASH: 'Corbeille',
}

const DEPOT_VALUES = ['Non depose', 'Depose', 'Depose 2eme fois']

function normalizeSpace(value) {
  return String(value ?? '').trim()
}

function slugify(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const s = slugify(value)
  return s === '1' || s === 'true' || s === 'oui' || s === 'yes'
}

function nowIso() {
  return new Date().toISOString()
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function isoToSqlDateTime(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function normalizeStatus(value, { archive = false, trash = false } = {}) {
  if (trash) return STATUS_VALUES.TRASH
  if (archive) return STATUS_VALUES.ARCHIVED

  const s = slugify(value)
  if (!s) return STATUS_VALUES.IN_PROGRESS

  if (['en attente', 'attente', 'waiting'].includes(s)) return STATUS_VALUES.WAITING
  if (['termine', 'terminee', 'done'].includes(s)) return STATUS_VALUES.DONE
  if (['bloque', 'blocked'].includes(s)) return STATUS_VALUES.BLOCKED
  if (['archive', 'archived'].includes(s)) return STATUS_VALUES.ARCHIVED
  if (['corbeille', 'trash', 'supprime', 'deleted'].includes(s)) return STATUS_VALUES.TRASH

  // Legacy web states map back to desktop-style status.
  if (['retard', 'echeance', 'partiel', 'attente', 'en cours', 'encours'].includes(s)) {
    return STATUS_VALUES.IN_PROGRESS
  }

  return STATUS_VALUES.IN_PROGRESS
}

function normalizeDepot(value) {
  const s = slugify(value)
  if (!s || s === 'non depose') return DEPOT_VALUES[0]
  if (s === 'depose') return DEPOT_VALUES[1]
  if (s === 'depose 2eme fois' || s === 'depose deuxieme fois' || s === 'en cours') {
    return DEPOT_VALUES[2]
  }
  return DEPOT_VALUES[0]
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

export function normalizeHistoryEntry(value) {
  return {
    date: normalizeSpace(value?.date) || nowIso(),
    action: normalizeSpace(value?.action) || 'Modification',
    details: normalizeSpace(value?.details) || null,
  }
}

export function normalizeHistory(values) {
  return ensureArray(values).map((v) => normalizeHistoryEntry(v))
}

export function addHistoryEntry(existing, action, details) {
  const history = normalizeHistory(existing)
  history.push(normalizeHistoryEntry({ date: nowIso(), action, details }))
  return history
}

export function normalizePayment(value) {
  const amount = toNumber(value?.montant_paye ?? value?.montant, 0)
  const date = normalizeSpace(value?.date_paiement ?? value?.date) || todayYmd()
  const stage = normalizeSpace(value?.etape ?? value?.stage) || 'Acompte'
  const notes = normalizeSpace(value?.notes ?? value?.note) || null
  const mode = normalizeSpace(value?.mode_paiement ?? value?.mode) || 'Especes'
  const receipt = normalizeSpace(value?.receipt_number ?? value?.receipt) || null
  const created = normalizeSpace(value?.date_creation ?? value?.created_at) || nowIso()
  const id = value?.id ?? `${date}-${amount}-${Math.random().toString(36).slice(2, 8)}`

  return {
    id,
    montant_paye: amount,
    date_paiement: date,
    etape: stage,
    notes,
    date_creation: created,
    receipt_number: receipt,
    mode_paiement: mode,
    // Legacy aliases used by the current UI.
    montant: amount,
    date,
    note: notes || '',
  }
}

export function normalizePayments(values) {
  return ensureArray(values)
    .map((value) => normalizePayment(value))
    .sort((a, b) => String(a.date_paiement).localeCompare(String(b.date_paiement)))
}

export function sumPayments(values, fallback = 0) {
  const list = normalizePayments(values)
  if (list.length === 0) return toNumber(fallback, 0)
  return list.reduce((sum, item) => sum + toNumber(item.montant_paye, 0), 0)
}

export function nextReceiptNumber(values) {
  const year = new Date().getFullYear()
  let maxN = 0
  for (const p of normalizePayments(values)) {
    const r = normalizeSpace(p.receipt_number)
    const m = /^QUI-(\d{4})-(\d{4})$/i.exec(r)
    if (!m) continue
    if (Number(m[1]) !== year) continue
    maxN = Math.max(maxN, Number(m[2]))
  }
  return `QUI-${year}-${String(maxN + 1).padStart(4, '0')}`
}

export function normalizeFile(value, dossierId = '') {
  const name = normalizeSpace(value?.nom_fichier ?? value?.name) || 'fichier'
  const path = normalizeSpace(value?.chemin_fichier ?? value?.path) || `web://${dossierId}/${name}`
  const addedAt = normalizeSpace(value?.date_ajout ?? value?.addedAt) || todayYmd()
  const size = normalizeSpace(value?.size ?? value?.taille_kb) || ''
  const id = value?.id ?? `${name}-${Math.random().toString(36).slice(2, 8)}`

  return {
    id,
    nom_fichier: name,
    chemin_fichier: path,
    date_ajout: addedAt,
    size,
    // Legacy aliases used by the current UI.
    name,
    addedAt,
  }
}

export function normalizeFiles(values, dossierId = '') {
  return ensureArray(values).map((value) => normalizeFile(value, dossierId))
}

export function normalizeDossier(value) {
  const rawId = normalizeSpace(value?.id ?? value?.numero_dossier)
  if (!rawId) return null

  const archive = toBoolean(value?.archive ?? value?.est_archive)
  const trash = toBoolean(value?.est_supprime) || slugify(value?.etat ?? value?.statut) === 'corbeille'
  const status = normalizeStatus(value?.etat ?? value?.statut, { archive, trash })
  const paiements = normalizePayments(value?.paiements)
  const fichiers = normalizeFiles(value?.fichiers, rawId)
  const montant = toNumber(value?.montant, 0)
  const encaisse = sumPayments(paiements, value?.encaisse)
  const created = normalizeSpace(value?.created_at ?? value?.date_creation) || nowIso()
  const updated = normalizeSpace(value?.updated_at ?? value?.date_modification) || nowIso()

  return {
    id: rawId,
    nom: normalizeSpace(value?.nom ?? value?.nom_prenom),
    endroit: normalizeSpace(value?.endroit),
    date_finale: normalizeSpace(value?.date_finale ?? value?.date_finalisation),
    telephone: normalizeSpace(value?.telephone),
    montant,
    encaisse,
    acte: toBoolean(value?.acte),
    regul: toBoolean(value?.regul),
    agricole: toBoolean(value?.agricole),
    depot_cad: normalizeDepot(value?.depot_cad),
    depot_domain: normalizeDepot(value?.depot_domain),
    observations: normalizeSpace(value?.observations),
    archive,
    date_archive: normalizeSpace(value?.date_archive) || (archive || trash ? todayYmd() : ''),
    etat: status,
    paiements,
    fichiers,
    historique: normalizeHistory(value?.historique),
    created_at: created,
    updated_at: updated,
  }
}

export function toDbPayload(value, { touchUpdated = true } = {}) {
  const row = normalizeDossier(value)
  if (!row) return null
  return {
    id: row.id,
    nom: row.nom,
    endroit: row.endroit,
    date_finale: row.date_finale || null,
    telephone: row.telephone || null,
    montant: row.montant,
    encaisse: row.encaisse,
    acte: row.acte,
    regul: row.regul,
    agricole: row.agricole,
    depot_cad: row.depot_cad,
    depot_domain: row.depot_domain,
    observations: row.observations || null,
    archive: row.archive,
    date_archive: row.date_archive || null,
    etat: row.etat,
    paiements: row.paiements,
    fichiers: row.fichiers,
    historique: row.historique || [],
    created_at: row.created_at || nowIso(),
    updated_at: touchUpdated ? nowIso() : row.updated_at || nowIso(),
  }
}

export function isInTrash(row) {
  return normalizeStatus(row?.etat, { archive: false, trash: false }) === STATUS_VALUES.TRASH
}

export function isArchived(row) {
  return !isInTrash(row) && toBoolean(row?.archive)
}

export function isOverdue(row) {
  if (!row || isInTrash(row) || isArchived(row) || !row.date_finale) return false
  const due = new Date(row.date_finale)
  if (Number.isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export function isDueSoon(row, days = 7) {
  if (!row || isInTrash(row) || isArchived(row) || !row.date_finale) return false
  const due = new Date(row.date_finale)
  if (Number.isNaN(due.getTime())) return false
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  return diffDays >= 0 && diffDays <= days
}

export function hasOutstanding(row) {
  if (!row || isInTrash(row) || isArchived(row)) return false
  return toNumber(row.montant, 0) > toNumber(row.encaisse, 0)
}

export function getDisplayState(row) {
  if (!row) return 'en_cours'
  if (isInTrash(row)) return 'corbeille'
  if (isArchived(row)) return 'archive'
  if (isOverdue(row)) return 'retard'
  if (isDueSoon(row, 7)) return 'echeance'
  if (hasOutstanding(row) && toNumber(row.encaisse, 0) > 0) return 'partiel'

  const status = normalizeStatus(row.etat, { archive: false, trash: false })
  if (status === STATUS_VALUES.DONE) return 'termine'
  if (status === STATUS_VALUES.BLOCKED) return 'bloque'
  if (status === STATUS_VALUES.WAITING) return 'attente'
  return 'en_cours'
}

function desktopStatusFromRow(row) {
  const status = normalizeStatus(row.etat, { archive: false, trash: false })
  if (status === STATUS_VALUES.WAITING) return 'En attente'
  if (status === STATUS_VALUES.DONE) return 'Termine'
  if (status === STATUS_VALUES.BLOCKED) return 'Bloque'
  return 'En cours'
}

export function rowsToDesktopBundle(rows) {
  const normalized = ensureArray(rows).map((row) => normalizeDossier(row)).filter(Boolean)
  let dossierSqlId = 1
  let paiementSqlId = 1
  let fichierSqlId = 1
  const dossiers = []
  const paiements = []
  const fichiers = []

  for (const row of normalized) {
    const sqlId = dossierSqlId++
    const trash = isInTrash(row)
    const archive = isArchived(row)
    dossiers.push({
      id: sqlId,
      numero_dossier: row.id,
      nom_prenom: row.nom,
      endroit: row.endroit || '-',
      date_finalisation: row.date_finale || null,
      telephone: row.telephone || null,
      montant: row.montant || null,
      acte: row.acte ? 1 : 0,
      regul: row.regul ? 1 : 0,
      agricole: row.agricole ? 1 : 0,
      depot_cad: normalizeDepot(row.depot_cad),
      depot_domain: normalizeDepot(row.depot_domain),
      observations: row.observations || null,
      date_creation: isoToSqlDateTime(row.created_at) || isoToSqlDateTime(nowIso()),
      date_modification: isoToSqlDateTime(row.updated_at),
      est_archive: archive ? 1 : 0,
      date_archive: row.date_archive || null,
      statut: desktopStatusFromRow(row),
      est_supprime: trash ? 1 : 0,
      date_suppression: trash ? (isoToSqlDateTime(row.updated_at) || isoToSqlDateTime(nowIso())) : null,
    })

    for (const payment of normalizePayments(row.paiements)) {
      paiements.push({
        id: paiementSqlId++,
        dossier_id: sqlId,
        montant_paye: toNumber(payment.montant_paye, 0),
        date_paiement: normalizeSpace(payment.date_paiement) || todayYmd(),
        etape: normalizeSpace(payment.etape) || 'Acompte',
        notes: normalizeSpace(payment.notes) || null,
        date_creation: isoToSqlDateTime(payment.date_creation) || isoToSqlDateTime(nowIso()),
        receipt_number: normalizeSpace(payment.receipt_number) || null,
        mode_paiement: normalizeSpace(payment.mode_paiement) || 'Especes',
      })
    }

    for (const file of normalizeFiles(row.fichiers, row.id)) {
      fichiers.push({
        id: fichierSqlId++,
        dossier_id: sqlId,
        nom_fichier: file.nom_fichier,
        chemin_fichier: file.chemin_fichier || `web://${row.id}/${file.nom_fichier}`,
        date_ajout: file.date_ajout || todayYmd(),
      })
    }
  }

  return {
    schema: 'geoman.desktop.bundle.v2',
    exported_at: nowIso(),
    dossiers,
    paiements,
    fichiers,
  }
}

export function bundleToRows(payload) {
  if (!payload) return []

  if (Array.isArray(payload)) {
    return payload.map((row) => normalizeDossier(row)).filter(Boolean)
  }

  const rawRows = Array.isArray(payload.rows) ? payload.rows : null
  if (rawRows) {
    return rawRows.map((row) => normalizeDossier(row)).filter(Boolean)
  }

  if (!Array.isArray(payload.dossiers)) return []
  const paiements = ensureArray(payload.paiements)
  const fichiers = ensureArray(payload.fichiers)
  const payByDossier = new Map()
  const filesByDossier = new Map()

  for (const payment of paiements) {
    const key = payment.dossier_id
    if (!payByDossier.has(key)) payByDossier.set(key, [])
    payByDossier.get(key).push(payment)
  }

  for (const file of fichiers) {
    const key = file.dossier_id
    if (!filesByDossier.has(key)) filesByDossier.set(key, [])
    filesByDossier.get(key).push(file)
  }

  const rows = []
  for (const dossier of payload.dossiers) {
    const row = normalizeDossier({
      ...dossier,
      id: dossier.numero_dossier ?? dossier.id,
      nom: dossier.nom_prenom,
      date_finale: dossier.date_finalisation,
      archive: dossier.est_archive,
      etat: dossier.est_supprime ? STATUS_VALUES.TRASH : dossier.statut,
      paiements: payByDossier.get(dossier.id) || [],
      fichiers: filesByDossier.get(dossier.id) || [],
    })
    if (row) rows.push(row)
  }
  return rows
}

function csvEscape(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export function buildDesktopCsv(rows) {
  const headers = [
    'No Dossier',
    'Nom et Prenom',
    'Endroit',
    'Date Finalisation',
    'Telephone',
    'Montant Total',
    'Encaisse',
    'Reste',
    'Acte',
    'Regul',
    'Agricole',
    'Depot CAD',
    'Depot Domain',
    'Archive',
    'Date Archive',
    'Observations',
  ]

  const lines = [headers.join(';')]
  for (const raw of ensureArray(rows)) {
    const row = normalizeDossier(raw)
    if (!row || isInTrash(row)) continue
    const encaisse = sumPayments(row.paiements, row.encaisse)
    const reste = Math.max(toNumber(row.montant, 0) - encaisse, 0)
    const values = [
      row.id,
      row.nom,
      row.endroit,
      row.date_finale || '',
      row.telephone || '',
      row.montant || '',
      encaisse || '',
      reste || '',
      row.acte ? 'Oui' : 'Non',
      row.regul ? 'Oui' : 'Non',
      row.agricole ? 'Oui' : 'Non',
      normalizeDepot(row.depot_cad),
      normalizeDepot(row.depot_domain),
      isArchived(row) ? 'Oui' : 'Non',
      row.date_archive || '',
      row.observations || '',
    ]
    lines.push(values.map(csvEscape).join(';'))
  }
  return lines.join('\n')
}

function parseSemicolonCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ';' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }
    current += ch
  }
  values.push(current)
  return values.map((value) => value.trim())
}

export function parseDesktopCsv(text) {
  const input = String(text || '').replace(/^\uFEFF/, '')
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseSemicolonCsvLine(lines[0]).map((h) => slugify(h))
  const idx = (name) => headers.indexOf(slugify(name))

  const iNo = idx('No Dossier')
  const iNom = idx('Nom et Prenom')
  const iEnd = idx('Endroit')
  const iDate = idx('Date Finalisation')
  const iTel = idx('Telephone')
  const iMontant = idx('Montant Total')
  const iEncaisse = idx('Encaisse')
  const iActe = idx('Acte')
  const iRegul = idx('Regul')
  const iAgricole = idx('Agricole')
  const iCad = idx('Depot CAD')
  const iDomain = idx('Depot Domain')
  const iArchive = idx('Archive')
  const iDateArchive = idx('Date Archive')
  const iObs = idx('Observations')

  const rows = []
  for (let li = 1; li < lines.length; li += 1) {
    const values = parseSemicolonCsvLine(lines[li])
    const id = normalizeSpace(values[iNo])
    if (!id) continue
    const archive = slugify(values[iArchive]) === 'oui'
    const encaisse = toNumber(values[iEncaisse], 0)
    const paiements = encaisse > 0
      ? [normalizePayment({
        montant_paye: encaisse,
        date_paiement: normalizeSpace(values[iDate]) || todayYmd(),
        etape: 'Import CSV',
        notes: 'Import desktop CSV',
        mode_paiement: 'Especes',
      })]
      : []

    const row = normalizeDossier({
      id,
      nom: normalizeSpace(values[iNom]),
      endroit: normalizeSpace(values[iEnd]),
      date_finale: normalizeSpace(values[iDate]),
      telephone: normalizeSpace(values[iTel]),
      montant: toNumber(values[iMontant], 0),
      encaisse,
      acte: slugify(values[iActe]) === 'oui',
      regul: slugify(values[iRegul]) === 'oui',
      agricole: slugify(values[iAgricole]) === 'oui',
      depot_cad: normalizeSpace(values[iCad]),
      depot_domain: normalizeSpace(values[iDomain]),
      archive,
      date_archive: normalizeSpace(values[iDateArchive]),
      etat: archive ? STATUS_VALUES.ARCHIVED : STATUS_VALUES.IN_PROGRESS,
      observations: normalizeSpace(values[iObs]),
      paiements,
    })
    if (row) rows.push(row)
  }
  return rows
}

export const STATUS = STATUS_VALUES
export const DEPOT_OPTIONS = DEPOT_VALUES
