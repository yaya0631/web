import { useState } from 'react'
import { closeModal } from './Modal.jsx'
import { downloadBlob, todayStr } from '../../lib/utils.jsx'
import { supabase, TABLE } from '../../lib/supabase.js'
import {
  buildDesktopCsv,
  bundleToRows,
  normalizeDossier,
  parseDesktopCsv,
  rowsToDesktopBundle,
  toDbPayload,
} from '../../lib/compat'
import { exportDesktopDbBlob, importRowsFromDesktopDb } from '../../lib/sqliteInterop'

function chunk(values, size) {
  const result = []
  for (let i = 0; i < values.length; i += size) {
    result.push(values.slice(i, i + size))
  }
  return result
}

async function upsertRows(rows) {
  const normalized = rows.map((row) => normalizeDossier(row)).filter(Boolean)
  const payloads = normalized.map((row) => toDbPayload(row)).filter(Boolean)
  if (payloads.length === 0) return 0

  for (const part of chunk(payloads, 100)) {
    const { error } = await supabase.from(TABLE).upsert(part, { onConflict: 'id' })
    if (error) throw error
  }
  return payloads.length
}

export function ConfirmModal({ dossier, mode = 'trash', onConfirm }) {
  if (!dossier) return null
  const hardDelete = mode === 'purge'
  return (
    <div className="overlay" id="m-confirm">
      <div className="modal modal-xs" onClick={(e) => e.stopPropagation()}>
        <div className="mb" style={{ padding: '28px 22px' }}>
          <div className="conf-icon">!</div>
          <p className="conf-msg">
            {hardDelete ? 'Supprimer definitivement' : 'Deplacer vers la corbeille'}
            <br />
            <strong style={{ color: 'var(--text)' }}>"{dossier.id} - {dossier.nom}"</strong>
            <br />
            <br />
            <small style={{ color: 'var(--t4)' }}>
              {hardDelete ? 'Cette action est irreversible.' : 'Vous pourrez restaurer ce dossier depuis la corbeille.'}
            </small>
          </p>
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-confirm')}>Annuler</button>
          <button
            className="hbtn hb-del"
            onClick={async () => {
              await onConfirm()
              closeModal('m-confirm')
            }}
          >
            {hardDelete ? 'Supprimer' : 'Corbeille'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ExportModal({ rows, onImportDone }) {
  const [busy, setBusy] = useState(false)

  const exportJson = () => {
    const cleanRows = rows.map((row) => normalizeDossier(row)).filter(Boolean)
    const payload = {
      schema: 'geoman.web.sync.v1',
      exported_at: new Date().toISOString(),
      rows: cleanRows,
      desktop_bundle: rowsToDesktopBundle(cleanRows),
    }
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `geoman-sync-${todayStr()}.json`
    )
  }

  const exportDesktopCsvFile = () => {
    const csv = buildDesktopCsv(rows)
    downloadBlob(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }),
      `geoman-desktop-${todayStr()}.csv`
    )
  }

  const exportDesktopDbFile = async () => {
    try {
      setBusy(true)
      const blob = await exportDesktopDbBlob(rows)
      downloadBlob(blob, `geoman-desktop-backup-${todayStr()}.db`)
    } catch (error) {
      alert(`Erreur export DB: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy(true)
    try {
      const filename = file.name.toLowerCase()
      let importedRows = []

      if (filename.endsWith('.db') || filename.endsWith('.sqlite') || filename.endsWith('.sqlite3')) {
        importedRows = await importRowsFromDesktopDb(file)
      } else if (filename.endsWith('.csv')) {
        importedRows = parseDesktopCsv(await file.text())
      } else if (filename.endsWith('.json')) {
        const parsed = JSON.parse(await file.text())
        importedRows = bundleToRows(parsed.desktop_bundle || parsed)
      } else {
        throw new Error('Format non supporte. Utilisez JSON, CSV ou DB.')
      }

      if (!importedRows.length) {
        throw new Error('Aucune ligne valide a importer.')
      }

      const count = await upsertRows(importedRows)
      onImportDone(count)
      closeModal('m-export')
    } catch (error) {
      alert(`Erreur import: ${error.message}`)
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  return (
    <div className="overlay" id="m-export">
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <div className="mh-title">Import / Export compatibilite desktop</div>
          <button className="mh-close" onClick={() => closeModal('m-export')}>x</button>
        </div>
        <div className="mb">
          <div className="export-grid">
            <div className="exp-card" onClick={exportJson}>
              <div className="exp-title">JSON Sync</div>
              <div className="exp-desc">Export complet web + bundle desktop.</div>
            </div>
            <div className="exp-card" onClick={exportDesktopCsvFile}>
              <div className="exp-title">CSV Desktop</div>
              <div className="exp-desc">Format CSV identique a GeoMan desktop.</div>
            </div>
            <div className="exp-card" onClick={exportDesktopDbFile}>
              <div className="exp-title">Backup DB Desktop</div>
              <div className="exp-desc">Genere un fichier SQLite .db compatible desktop.</div>
            </div>
            <label className="exp-card" style={{ cursor: 'pointer' }}>
              <div className="exp-title">Importer JSON / CSV / DB</div>
              <div className="exp-desc">Importe depuis export web ou backup desktop.</div>
              <input
                type="file"
                accept=".json,.csv,.db,.sqlite,.sqlite3"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </label>
          </div>
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-export')} disabled={busy}>
            {busy ? 'Traitement...' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  )
}
