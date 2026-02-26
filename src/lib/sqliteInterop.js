import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { bundleToRows, rowsToDesktopBundle } from './compat.js'

let sqlPromise = null

async function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: () => wasmUrl,
    })
  }
  return sqlPromise
}

function tableExists(db, tableName) {
  const stmt = db.prepare('SELECT name FROM sqlite_master WHERE type = ? AND name = ?')
  stmt.bind(['table', tableName])
  const exists = stmt.step()
  stmt.free()
  return exists
}

function queryRows(db, sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export async function importRowsFromDesktopDb(file) {
  const SQL = await getSql()
  const bytes = new Uint8Array(await file.arrayBuffer())
  const db = new SQL.Database(bytes)

  try {
    if (!tableExists(db, 'dossiers')) {
      throw new Error('Le fichier ne contient pas la table dossiers.')
    }

    const dossiers = queryRows(db, 'SELECT * FROM dossiers')
    const paiements = tableExists(db, 'paiements') ? queryRows(db, 'SELECT * FROM paiements') : []
    const fichiers = tableExists(db, 'fichiers') ? queryRows(db, 'SELECT * FROM fichiers') : []

    return bundleToRows({
      dossiers,
      paiements,
      fichiers,
    })
  } finally {
    db.close()
  }
}

export async function exportDesktopDbBlob(rows) {
  const SQL = await getSql()
  const db = new SQL.Database()
  const bundle = rowsToDesktopBundle(rows)

  db.run(`
    CREATE TABLE IF NOT EXISTS dossiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_dossier TEXT NOT NULL UNIQUE,
      nom_prenom TEXT NOT NULL,
      endroit TEXT NOT NULL,
      date_finalisation TEXT,
      telephone TEXT,
      montant REAL,
      acte INTEGER DEFAULT 0,
      regul INTEGER DEFAULT 0,
      agricole INTEGER DEFAULT 0,
      depot_cad TEXT DEFAULT 'Non depose',
      depot_domain TEXT DEFAULT 'Non depose',
      observations TEXT,
      date_creation TEXT NOT NULL,
      date_modification TEXT,
      est_archive INTEGER DEFAULT 0,
      date_archive TEXT,
      statut TEXT DEFAULT 'En cours',
      est_supprime INTEGER DEFAULT 0,
      date_suppression TEXT
    );

    CREATE TABLE IF NOT EXISTS fichiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dossier_id INTEGER NOT NULL,
      nom_fichier TEXT NOT NULL,
      chemin_fichier TEXT NOT NULL,
      date_ajout TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS historique (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dossier_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      date_action TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dossier_id INTEGER NOT NULL,
      numero_dossier TEXT NOT NULL,
      nom_prenom TEXT NOT NULL,
      date_acces TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS paiements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dossier_id INTEGER NOT NULL,
      montant_paye REAL NOT NULL,
      date_paiement TEXT NOT NULL,
      etape TEXT DEFAULT 'Acompte',
      notes TEXT,
      date_creation TEXT NOT NULL,
      receipt_number TEXT,
      mode_paiement TEXT DEFAULT 'Especes'
    );

    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  const insertDossier = db.prepare(`
    INSERT INTO dossiers (
      id, numero_dossier, nom_prenom, endroit, date_finalisation, telephone, montant,
      acte, regul, agricole, depot_cad, depot_domain, observations, date_creation,
      date_modification, est_archive, date_archive, statut, est_supprime, date_suppression
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const row of bundle.dossiers) {
    insertDossier.run([
      row.id,
      row.numero_dossier,
      row.nom_prenom,
      row.endroit,
      row.date_finalisation,
      row.telephone,
      row.montant,
      row.acte,
      row.regul,
      row.agricole,
      row.depot_cad,
      row.depot_domain,
      row.observations,
      row.date_creation,
      row.date_modification,
      row.est_archive,
      row.date_archive,
      row.statut,
      row.est_supprime,
      row.date_suppression,
    ])
  }
  insertDossier.free()

  const insertPaiement = db.prepare(`
    INSERT INTO paiements (
      id, dossier_id, montant_paye, date_paiement, etape, notes, date_creation, receipt_number, mode_paiement
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const row of bundle.paiements) {
    insertPaiement.run([
      row.id,
      row.dossier_id,
      row.montant_paye,
      row.date_paiement,
      row.etape,
      row.notes,
      row.date_creation,
      row.receipt_number,
      row.mode_paiement,
    ])
  }
  insertPaiement.free()

  const insertFichier = db.prepare(`
    INSERT INTO fichiers (
      id, dossier_id, nom_fichier, chemin_fichier, date_ajout
    ) VALUES (?, ?, ?, ?, ?)
  `)
  for (const row of bundle.fichiers) {
    insertFichier.run([
      row.id,
      row.dossier_id,
      row.nom_fichier,
      row.chemin_fichier,
      row.date_ajout,
    ])
  }
  insertFichier.free()

  db.run(
    'INSERT OR REPLACE INTO schema_version (id, version, updated_at) VALUES (1, ?, ?)',
    [2, new Date().toISOString().slice(0, 19).replace('T', ' ')]
  )

  const bytes = db.export()
  db.close()
  return new Blob([bytes], { type: 'application/octet-stream' })
}
