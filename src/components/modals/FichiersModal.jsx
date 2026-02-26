import { fileIcon, todayStr } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

export default function FichiersModal({ dossier, onUpdate }) {
  if (!dossier) return null

  const handleAdd = async (e) => {
    const fichiers = [...(dossier.fichiers || [])]
    Array.from(e.target.files).forEach(f => {
      fichiers.push({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB`, addedAt: todayStr() })
    })
    await onUpdate(dossier.id, { fichiers })
    e.target.value = ''
  }

  const handleRemove = async (idx) => {
    const fichiers = [...(dossier.fichiers || [])]
    fichiers.splice(idx, 1)
    await onUpdate(dossier.id, { fichiers })
  }

  return (
    <div className="overlay" id="m-fichiers">
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">📁 Fichiers Joints</div>
            <div className="mh-sub">{dossier.id} — {dossier.nom}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-fichiers')}>✕</button>
        </div>
        <div className="mb">
          <label className="hbtn hb-ghost" style={{cursor:'pointer',marginBottom:14,display:'inline-flex'}}>
            ＋ Ajouter des fichiers
            <input type="file" style={{display:'none'}} multiple onChange={handleAdd} />
          </label>

          {!dossier.fichiers?.length
            ? <p style={{color:'var(--t3)',fontSize:'12.5px'}}>Aucun fichier joint.</p>
            : dossier.fichiers.map((f, i) => (
                <div key={i} className="rp-file" style={{marginBottom:8,justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,overflow:'hidden'}}>
                    <span>{fileIcon(f.name)}</span>
                    <span style={{color:'var(--text)',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</span>
                    <span style={{color:'var(--t4)',fontSize:11,whiteSpace:'nowrap'}}>{f.size}</span>
                  </div>
                  <button onClick={() => handleRemove(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:15,flexShrink:0}}>✕</button>
                </div>
              ))
          }
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-fichiers')}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
