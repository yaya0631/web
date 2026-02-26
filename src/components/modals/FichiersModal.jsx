import { normalizeFiles } from '../../lib/compat'
import { fileIcon, todayStr } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

export default function FichiersModal({ dossier, onUpdate }) {
  if (!dossier) return null
  const files = normalizeFiles(dossier.fichiers, dossier.id)

  const handleAdd = async (event) => {
    const next = [...files]
    Array.from(event.target.files || []).forEach((file) => {
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nom_fichier: file.name,
        chemin_fichier: `web://${dossier.id}/${file.name}`,
        date_ajout: todayStr(),
        size: `${(file.size / 1024).toFixed(1)} KB`,
      })
    })
    await onUpdate(dossier.id, { fichiers: next })
    event.target.value = ''
  }

  const handleRemove = async (fileId) => {
    const next = files.filter((file) => file.id !== fileId)
    await onUpdate(dossier.id, { fichiers: next })
  }

  return (
    <div className="overlay" id="m-fichiers">
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">Fichiers joints</div>
            <div className="mh-sub">{dossier.id} - {dossier.nom}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-fichiers')}>x</button>
        </div>
        <div className="mb">
          <label className="hbtn hb-ghost" style={{ cursor: 'pointer', marginBottom: 14, display: 'inline-flex' }}>
            Ajouter des fichiers
            <input type="file" style={{ display: 'none' }} multiple onChange={handleAdd} />
          </label>

          {!files.length ? (
            <p style={{ color: 'var(--t3)', fontSize: '12.5px' }}>Aucun fichier joint.</p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="rp-file" style={{ marginBottom: 8, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <span>{fileIcon(file.nom_fichier)}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.nom_fichier}
                  </span>
                  <span style={{ color: 'var(--t4)', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {file.size || file.date_ajout}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(file.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 15, flexShrink: 0 }}
                >
                  x
                </button>
              </div>
            ))
          )}
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-fichiers')}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
