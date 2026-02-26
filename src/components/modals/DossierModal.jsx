import { useEffect, useState } from 'react'
import { DEPOT_OPTIONS, STATUS, normalizeDossier } from '../../lib/compat'
import { todayStr } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

const EMPTY = {
  id: '',
  nom: '',
  telephone: '',
  endroit: '',
  montant: 0,
  encaisse: 0,
  date_finale: '',
  date_archive: '',
  depot_cad: DEPOT_OPTIONS[0],
  depot_domain: DEPOT_OPTIONS[0],
  etat: STATUS.IN_PROGRESS,
  archive: false,
  acte: false,
  regul: false,
  agricole: false,
  observations: '',
}

export default function DossierModal({ editing, rows, onSave }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) {
      const current = rows.find((row) => row.id === editing)
      if (current) {
        setForm({ ...EMPTY, ...normalizeDossier(current) })
      }
    } else {
      setForm({ ...EMPTY, date_finale: todayStr() })
    }
  }, [editing, rows])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!String(form.id || '').trim()) {
      alert('Numero de dossier obligatoire.')
      return
    }
    if (!String(form.nom || '').trim()) {
      alert('Nom obligatoire.')
      return
    }
    if (!editing && rows.some((row) => row.id === form.id)) {
      alert('Ce numero existe deja.')
      return
    }

    setSaving(true)
    try {
      const existing = editing ? rows.find((row) => row.id === editing) : null
      const payload = normalizeDossier({
        ...form,
        montant: parseFloat(form.montant) || 0,
        encaisse: parseFloat(form.encaisse) || 0,
        date_finale: form.date_finale || null,
        date_archive: form.date_archive || null,
        paiements: existing?.paiements || [],
        fichiers: existing?.fichiers || [],
      })

      await onSave(payload)
      closeModal('all')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" id="m-dossier">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">{editing ? `Modifier - ${editing}` : 'Nouveau dossier'}</div>
            <div className="mh-sub">{editing ? form.nom : 'Remplissez les informations'}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-dossier')}>x</button>
        </div>
        <div className="mb">
          <div className="fg-grid">
            <div className="fg">
              <label className="fl-f">Numero dossier *</label>
              <input
                className="fc"
                value={form.id}
                onChange={(e) => setField('id', e.target.value)}
                placeholder="ex: 94-2026"
                disabled={Boolean(editing)}
              />
            </div>
            <div className="fg">
              <label className="fl-f">Nom et prenom *</label>
              <input
                className="fc"
                value={form.nom}
                onChange={(e) => setField('nom', e.target.value)}
                placeholder="Prenom NOM"
              />
            </div>
            <div className="fg">
              <label className="fl-f">Telephone</label>
              <input
                className="fc"
                value={form.telephone}
                onChange={(e) => setField('telephone', e.target.value)}
                placeholder="0XXXXXXXXX"
              />
            </div>
            <div className="fg">
              <label className="fl-f">Endroit</label>
              <input
                className="fc"
                value={form.endroit}
                onChange={(e) => setField('endroit', e.target.value)}
                placeholder="AET, Bir el Djir..."
              />
            </div>
            <div className="fg">
              <label className="fl-f">Montant total (DA)</label>
              <input
                className="fc"
                type="number"
                value={form.montant}
                onChange={(e) => setField('montant', e.target.value)}
                min="0"
              />
            </div>
            <div className="fg">
              <label className="fl-f">Montant encaisse (DA)</label>
              <input
                className="fc"
                type="number"
                value={form.encaisse}
                onChange={(e) => setField('encaisse', e.target.value)}
                min="0"
              />
            </div>
            <div className="fg">
              <label className="fl-f">Date finalisation</label>
              <input
                className="fc"
                type="date"
                value={form.date_finale || ''}
                onChange={(e) => setField('date_finale', e.target.value)}
              />
            </div>
            <div className="fg">
              <label className="fl-f">Date archive</label>
              <input
                className="fc"
                type="date"
                value={form.date_archive || ''}
                onChange={(e) => setField('date_archive', e.target.value)}
              />
            </div>
            <div className="fg">
              <label className="fl-f">Depot CAD</label>
              <select className="fc" value={form.depot_cad} onChange={(e) => setField('depot_cad', e.target.value)}>
                {DEPOT_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">Depot Domain</label>
              <select className="fc" value={form.depot_domain} onChange={(e) => setField('depot_domain', e.target.value)}>
                {DEPOT_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">Statut</label>
              <select className="fc" value={form.etat} onChange={(e) => setField('etat', e.target.value)}>
                <option value={STATUS.IN_PROGRESS}>En cours</option>
                <option value={STATUS.WAITING}>En attente</option>
                <option value={STATUS.DONE}>Termine</option>
                <option value={STATUS.BLOCKED}>Bloque</option>
                <option value={STATUS.TRASH}>Corbeille</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">Archive</label>
              <select
                className="fc"
                value={form.archive ? 'true' : 'false'}
                onChange={(e) => setField('archive', e.target.value === 'true')}
              >
                <option value="false">Non</option>
                <option value="true">Oui</option>
              </select>
            </div>
            <div className="fg fg-full">
              <label className="fl-f">Options</label>
              <div className="check-row">
                {[
                  ['acte', 'Acte'],
                  ['regul', 'Regul'],
                  ['agricole', 'Agricole'],
                ].map(([key, label]) => (
                  <label key={key} className="chk-item">
                    <input
                      type="checkbox"
                      checked={Boolean(form[key])}
                      onChange={(e) => setField(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="fg fg-full">
              <label className="fl-f">Observations</label>
              <input
                className="fc"
                value={form.observations}
                onChange={(e) => setField('observations', e.target.value)}
                placeholder="Notes, remarques..."
              />
            </div>
          </div>
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-dossier')}>Annuler</button>
          <button className="hbtn hb-edit" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
