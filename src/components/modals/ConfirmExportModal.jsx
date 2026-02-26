import { closeModal } from './Modal.jsx'
import { downloadBlob, todayStr } from '../../lib/utils.jsx'
import { supabase, TABLE } from '../../lib/supabase.js'

// ── CONFIRM DELETE ────────────────────────────
export function ConfirmModal({ dossier, onConfirm }) {
  if (!dossier) return null
  return (
    <div className="overlay" id="m-confirm">
      <div className="modal modal-xs" onClick={e => e.stopPropagation()}>
        <div className="mb" style={{padding:'28px 22px'}}>
          <div className="conf-icon">⚠️</div>
          <p className="conf-msg">
            Supprimer le dossier<br />
            <strong style={{color:'var(--text)'}}>"{dossier.id} — {dossier.nom}"</strong> ?<br /><br />
            <small style={{color:'var(--t4)'}}>Cette action est irréversible.</small>
          </p>
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-confirm')}>Annuler</button>
          <button className="hbtn hb-del" onClick={async () => { await onConfirm(); closeModal('m-confirm') }}>🗑 Supprimer</button>
        </div>
      </div>
    </div>
  )
}

// ── EXPORT MODAL ──────────────────────────────
export function ExportModal({ rows, onImportDone }) {
  const exportJSON = () => {
    const clean = rows.map(({ id, nom, telephone, endroit, montant, encaisse,
      date_finale, date_archive, depot_cad, depot_domain, etat, archive,
      acte, regul, agricole, observations, paiements, fichiers }) => ({
        id, nom, telephone, endroit, montant, encaisse,
        date_finale, date_archive, depot_cad, depot_domain, etat, archive,
        acte, regul, agricole, observations, paiements, fichiers
    }))
    downloadBlob(new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' }), `geoman-backup-${todayStr()}.json`)
  }

  const exportCSV = () => {
    const H = ['N° Dossier','Nom','Endroit','Téléphone','Montant','Encaissé','Date Finale','Dépôt CAD','Dépôt Domaine','État','Observations']
    const R = rows.map(d => [d.id,d.nom,d.endroit,d.telephone,d.montant,d.encaisse,d.date_finale,d.depot_cad,d.depot_domain,d.etat,d.observations])
    const csv = [H,...R].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    downloadBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}),`geoman-${todayStr()}.csv`)
  }

  const handleImport = async (e) => {
    const f = e.target.files[0]; if (!f) return
    const text = await f.text()
    try {
      const data = JSON.parse(text)
      if (!Array.isArray(data)) throw new Error('Format invalide')
      for (const row of data) {
        row.created_at = row.created_at || new Date().toISOString()
        row.updated_at = new Date().toISOString()
        await supabase.from(TABLE).upsert(row, { onConflict: 'id' })
      }
      onImportDone(data.length)
      closeModal('m-export')
    } catch(err) { alert('Erreur import : ' + err.message) }
    e.target.value = ''
  }

  return (
    <div className="overlay" id="m-export">
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div className="mh-title">↑ Exporter les Données</div>
          <button className="mh-close" onClick={() => closeModal('m-export')}>✕</button>
        </div>
        <div className="mb">
          <div className="export-grid">
            <div className="exp-card" onClick={exportJSON}>
              <div className="exp-icon">📄</div>
              <div className="exp-title">JSON</div>
              <div className="exp-desc">Sauvegarde complète réimportable</div>
            </div>
            <div className="exp-card" onClick={exportCSV}>
              <div className="exp-icon">📊</div>
              <div className="exp-title">CSV</div>
              <div className="exp-desc">Compatible Excel / Google Sheets</div>
            </div>
            <div className="exp-card" onClick={() => window.print()}>
              <div className="exp-icon">🖨️</div>
              <div className="exp-title">Imprimer</div>
              <div className="exp-desc">Impression ou export PDF</div>
            </div>
            <label className="exp-card" style={{cursor:'pointer'}}>
              <div className="exp-icon">📥</div>
              <div className="exp-title">Importer JSON</div>
              <div className="exp-desc">Restaurer une sauvegarde</div>
              <input type="file" accept=".json" style={{display:'none'}} onChange={handleImport} />
            </label>
          </div>
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-export')}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
