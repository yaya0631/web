import { useState, useEffect } from 'react'
import { closeModal } from './Modal.jsx'

const ALL_COLS = [
    { key: '_n', label: 'No', defaultVisible: true },
    { key: 'id', label: 'No Dossier', defaultVisible: true },
    { key: 'nom', label: 'Nom et Prenom', defaultVisible: true },
    { key: 'endroit', label: 'Endroit', defaultVisible: true },
    { key: 'date_finale', label: 'Date finale', defaultVisible: true },
    { key: 'telephone', label: 'Telephone', defaultVisible: true },
    { key: 'montant', label: 'Montant', defaultVisible: true },
    { key: 'acte', label: 'Acte', defaultVisible: false },
    { key: 'regul', label: 'Regul', defaultVisible: false },
    { key: 'agricole', label: 'Agricole', defaultVisible: false },
    { key: 'depot_cad', label: 'Depot CAD', defaultVisible: true },
    { key: 'depot_domain', label: 'Depot Domain', defaultVisible: true },
    { key: 'date_archive', label: 'Date archive', defaultVisible: false },
    { key: 'etat', label: 'Etat', defaultVisible: true },
    { key: 'observations', label: 'Observations', defaultVisible: false },
]

const STORAGE_KEY = 'geoman-visible-cols'

function getDefaultVisibility() {
    const map = {}
    ALL_COLS.forEach((col) => { map[col.key] = col.defaultVisible })
    return map
}

export function loadColumnVisibility() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            const defaults = getDefaultVisibility()
            // Merge with defaults to handle new columns
            return { ...defaults, ...parsed }
        }
    } catch { /* ignore */ }
    return getDefaultVisibility()
}

function saveColumnVisibility(visibility) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
}

export default function ColumnsModal({ visibility, onVisibilityChange }) {
    const [local, setLocal] = useState(visibility)

    useEffect(() => {
        setLocal(visibility)
    }, [visibility])

    const handleToggle = (key) => {
        setLocal((prev) => {
            const next = { ...prev, [key]: !prev[key] }
            return next
        })
    }

    const handleSave = () => {
        saveColumnVisibility(local)
        onVisibilityChange(local)
        closeModal('m-columns')
    }

    const handleReset = () => {
        const defaults = getDefaultVisibility()
        setLocal(defaults)
    }

    return (
        <div className="overlay" id="m-columns">
            <div className="modal modal-xs" onClick={(e) => e.stopPropagation()}>
                <div className="mh">
                    <div className="mh-title">Colonnes visibles</div>
                    <button className="mh-close" onClick={() => closeModal('m-columns')}>x</button>
                </div>
                <div className="mb">
                    <div className="col-toggle-list">
                        {ALL_COLS.map((col) => (
                            <label key={col.key} className="col-toggle-item">
                                <input
                                    type="checkbox"
                                    checked={local[col.key] !== false}
                                    onChange={() => handleToggle(col.key)}
                                />
                                {col.label}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="mf">
                    <button className="hbtn hb-ghost" onClick={handleReset}>Reinitialiser</button>
                    <button className="hbtn hb-edit" onClick={handleSave}>Appliquer</button>
                </div>
            </div>
        </div>
    )
}
