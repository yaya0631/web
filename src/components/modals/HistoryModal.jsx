import { closeModal } from './Modal.jsx'

export default function HistoryModal({ dossier }) {
    if (!dossier) return null

    const history = Array.isArray(dossier.historique) ? dossier.historique : []

    return (
        <div className="overlay" id="m-history">
            <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                <div className="mh">
                    <div>
                        <div className="mh-title">Historique</div>
                        <div className="mh-sub">{dossier.id} - {dossier.nom}</div>
                    </div>
                    <button className="mh-close" onClick={() => closeModal('m-history')}>x</button>
                </div>
                <div className="mb">
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 30, color: 'var(--t3)' }}>
                            Aucun historique enregistre.
                        </div>
                    ) : (
                        [...history].reverse().map((entry, i) => (
                            <div key={i} className="hist-item">
                                <span className="hist-time">{entry.date || '-'}</span>
                                <span className="hist-action">{entry.action || '-'}</span>
                                {entry.details && <div className="hist-detail">{entry.details}</div>}
                            </div>
                        ))
                    )}
                </div>
                <div className="mf">
                    <button className="hbtn hb-ghost" onClick={() => closeModal('m-history')}>Fermer</button>
                </div>
            </div>
        </div>
    )
}
