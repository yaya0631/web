import { useState } from 'react'
import { closeModal } from './Modal.jsx'

const STORAGE_KEY = 'geoman-settings'

const DEFAULT_SETTINGS = {
    cabinet_nom: '',
    cabinet_adresse: '',
    cabinet_telephone: '',
    cabinet_email: '',
    cabinet_agrement: '',
    showRemindersOnStartup: true,
    confirmBeforeDelete: true,
    autoOpenExports: false,
}

export function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export default function SettingsModal({ onSettingsChange }) {
    const [form, setForm] = useState(() => loadSettings())

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

    const handleSave = () => {
        saveSettings(form)
        onSettingsChange?.(form)
        closeModal('m-settings')
    }

    return (
        <div className="overlay" id="m-settings">
            <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                <div className="mh">
                    <div className="mh-title">Parametres</div>
                    <button className="mh-close" onClick={() => closeModal('m-settings')}>x</button>
                </div>
                <div className="mb">
                    <div className="settings-section">
                        <div className="settings-section-title">Profil du cabinet</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="fg">
                                <label className="fl-f">Nom du cabinet</label>
                                <input className="fc" value={form.cabinet_nom} onChange={(e) => setField('cabinet_nom', e.target.value)} placeholder="Cabinet de Geometre-Expert" />
                            </div>
                            <div className="fg">
                                <label className="fl-f">Adresse</label>
                                <input className="fc" value={form.cabinet_adresse} onChange={(e) => setField('cabinet_adresse', e.target.value)} placeholder="Adresse du cabinet" />
                            </div>
                            <div className="fg">
                                <label className="fl-f">Telephone</label>
                                <input className="fc" value={form.cabinet_telephone} onChange={(e) => setField('cabinet_telephone', e.target.value)} placeholder="0XXXXXXXXX" />
                            </div>
                            <div className="fg">
                                <label className="fl-f">Email</label>
                                <input className="fc" value={form.cabinet_email} onChange={(e) => setField('cabinet_email', e.target.value)} placeholder="contact@cabinet.dz" />
                            </div>
                            <div className="fg">
                                <label className="fl-f">N° Agrement</label>
                                <input className="fc" value={form.cabinet_agrement} onChange={(e) => setField('cabinet_agrement', e.target.value)} placeholder="AG-XXXX" />
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <div className="settings-section-title">Options de l'application</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                ['showRemindersOnStartup', 'Afficher les rappels au demarrage'],
                                ['confirmBeforeDelete', 'Demander confirmation avant suppression'],
                                ['autoOpenExports', 'Ouvrir automatiquement les exports'],
                            ].map(([key, label]) => (
                                <label key={key} className="col-toggle-item">
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
                </div>
                <div className="mf">
                    <button className="hbtn hb-ghost" onClick={() => closeModal('m-settings')}>Annuler</button>
                    <button className="hbtn hb-edit" onClick={handleSave}>Enregistrer</button>
                </div>
            </div>
        </div>
    )
}
