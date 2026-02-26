import { normalizeFiles } from '../lib/compat'
import { fileIcon } from '../lib/utils.jsx'

export default function RightPanel({ dossier }) {
  if (!dossier) {
    return (
      <div id="right-panel">
        <div className="rp-title">Fichiers joints</div>
        <div className="rp-empty">Selectionnez un dossier</div>
      </div>
    )
  }

  const files = normalizeFiles(dossier.fichiers, dossier.id)

  return (
    <div id="right-panel">
      <div className="rp-title">Fichiers joints</div>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>{dossier.id}</div>
      {!files.length ? (
        <div className="rp-empty">Aucun fichier</div>
      ) : (
        files.map((file) => (
          <div key={file.id} className="rp-file">
            <span>{fileIcon(file.nom_fichier)}</span>
            <span>{file.nom_fichier}</span>
          </div>
        ))
      )}
    </div>
  )
}
