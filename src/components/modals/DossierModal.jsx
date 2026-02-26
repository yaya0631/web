import { useState, useEffect } from 'react'
import { todayStr } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

const EMPTY = {
  id: '', nom: '', telephone: '', endroit: '',
  montant: 0, encaisse: 0, date_finale: '', date_archive: '',
  depot_cad: 'Non déposé', depot_domain: 'Non déposé',
  etat: 'attente', archive: false,
  acte: false, regul: false, agricole: false, observations: '',
}

export default function DossierModal({ editing, rows, onSave }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) {
      const d = rows.find(x => x.id === editing)
      if (d) setForm({ ...EMPTY, ...d })
    } else {
      setForm({ ...EMPTY, date_finale: todayStr() })
    }
  }, [editing, rows])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.id.trim())  { alert('N° de dossier obligatoire.'); return }
    if (!form.nom.trim()) { alert('Nom obligatoire.'); return }
    if (!editing && rows.find(d => d.id === form.id)) { alert('Ce numéro existe déjà.'); return }
    setSaving(true)
    try {
      const existing = editing ? rows.find(d => d.id === editing) : null
      await onSave({
        ...form,
        montant:  parseFloat(form.montant)  || 0,
        encaisse: parseFloat(form.encaisse) || 0,
        date_finale:  form.date_finale  || null,
        date_archive: form.date_archive || null,
        paiements: existing?.paiements || [],
        fichiers:  existing?.fichiers  || [],
      })
      closeModal('m-dossier')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" id="m-dossier">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">{editing ? `Modifier — ${editing}` : 'Nouveau Dossier'}</div>
            <div className="mh-sub">{editing ? form.nom : 'Remplissez les informations'}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-dossier')}>✕</button>
        </div>
        <div className="mb">
          <div className="fg-grid">
            <div className="fg">
              <label className="fl-f">N° Dossier *</label>
              <input className="fc" value={form.id} onChange={e => set('id', e.target.value)}
                placeholder="ex: 94-2026" disabled={!!editing} />
            </div>
            <div className="fg">
              <label className="fl-f">Nom et Prénom *</label>
              <input className="fc" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Prénom NOM" />
            </div>
            <div className="fg">
              <label className="fl-f">Téléphone</label>
              <input className="fc" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="0XXXXXXXXX" />
            </div>
            <div className="fg">
              <label className="fl-f">Endroit</label>
              <input className="fc" value={form.endroit} onChange={e => set('endroit', e.target.value)} placeholder="AET, Bir el Djir…" />
            </div>
            <div className="fg">
              <label className="fl-f">Montant Total (DA)</label>
              <input className="fc" type="number" value={form.montant} onChange={e => set('montant', e.target.value)} min="0" />
            </div>
            <div className="fg">
              <label className="fl-f">Montant Encaissé (DA)</label>
              <input className="fc" type="number" value={form.encaisse} onChange={e => set('encaisse', e.target.value)} min="0" />
            </div>
            <div className="fg">
              <label className="fl-f">Date Finale</label>
              <input className="fc" type="date" value={form.date_finale || ''} onChange={e => set('date_finale', e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl-f">Date Archive</label>
              <input className="fc" type="date" value={form.date_archive || ''} onChange={e => set('date_archive', e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl-f">Dépôt CAD</label>
              <select className="fc" value={form.depot_cad} onChange={e => set('depot_cad', e.target.value)}>
                <option>Non déposé</option><option>Déposé</option><option>En cours</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">Dépôt Domaine</label>
              <select className="fc" value={form.depot_domain} onChange={e => set('depot_domain', e.target.value)}>
                <option>Non déposé</option><option>Déposé</option><option>En cours</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">État</label>
              <select className="fc" value={form.etat} onChange={e => set('etat', e.target.value)}>
                <option value="attente">En attente</option>
                <option value="echeance">Échéance &lt; 7j</option>
                <option value="partiel">Solde partiel</option>
                <option value="termine">Terminé</option>
                <option value="retard">En retard</option>
                <option value="bloque">Bloqué</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">Archivé</label>
              <select className="fc" value={form.archive ? 'true' : 'false'} onChange={e => set('archive', e.target.value === 'true')}>
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </select>
            </div>
            <div className="fg fg-full">
              <label className="fl-f">Options</label>
              <div className="check-row">
                {[['acte','Acte'],['regul','Regul'],['agricole','Agricole']].map(([k,l]) => (
                  <label key={k} className="chk-item">
                    <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)} /> {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="fg fg-full">
              <label className="fl-f">Observations</label>
              <input className="fc" value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Notes, remarques…" />
            </div>
          </div>
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-dossier')}>Annuler</button>
          <button className="hbtn hb-edit" onClick={handleSave} disabled={saving}>
            {saving ? '⌛ Enregistrement…' : '💾 Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
