import { fileIcon } from '../lib/utils.jsx'

export default function RightPanel({ dossier }) {
  if (!dossier) return (
    <div id="right-panel">
      <div className="rp-title">Fichiers joints</div>
      <div className="rp-empty">Sélectionnez un dossier</div>
    </div>
  )

  return (
    <div id="right-panel">
      <div className="rp-title">Fichiers joints</div>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>{dossier.id}</div>
      {!dossier.fichiers?.length
        ? <div className="rp-empty">Aucun fichier</div>
        : dossier.fichiers.map((f, i) => (
            <div key={i} className="rp-file">
              <span>{fileIcon(f.name)}</span>
              <span>{f.name}</span>
            </div>
          ))
      }
    </div>
  )
}
