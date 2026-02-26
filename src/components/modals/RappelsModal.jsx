import { closeModal } from './Modal.jsx'

export default function RappelsModal({ rows }) {
  const today = new Date()
  const items = rows
    .filter(d => !d.archive && d.date_finale)
    .map(d => ({ ...d, diff: Math.round((new Date(d.date_finale) - today) / 864e5) }))
    .sort((a, b) => a.diff - b.diff)

  const overdue = items.filter(d => d.diff < 0)
  const soon    = items.filter(d => d.diff >= 0 && d.diff <= 7)
  const coming  = items.filter(d => d.diff > 7 && d.diff <= 30)

  const Block = ({ icon, title, list, color }) => {
    if (!list.length) return null
    return (
      <div className="db-sec">
        <div className="db-sec-title">{icon} {title} ({list.length})</div>
        {list.map(d => (
          <div key={d.id} className="rp-item">
            <div className="rp-icon">{icon}</div>
            <div className="rp-content">
              <div className="rp-name">{d.id} — {d.nom}</div>
              <div className="rp-detail">{d.endroit} {d.observations ? `· ${d.observations}` : ''}</div>
            </div>
            <div className="rp-badge" style={{color}}>
              {d.diff < 0 ? `${Math.abs(d.diff)}j retard` : d.diff === 0 ? "Aujourd'hui" : `dans ${d.diff}j`}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overlay" id="m-rappels">
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div className="mh-title">🔔 Rappels &amp; Alertes</div>
          <button className="mh-close" onClick={() => closeModal('m-rappels')}>✕</button>
        </div>
        <div className="mb">
          {!overdue.length && !soon.length && !coming.length
            ? <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>✅ Aucune alerte pour le moment.</div>
            : <>
                <Block icon="🔴" title="En retard"           list={overdue} color="var(--red)"    />
                <Block icon="🟡" title="Échéance dans 7 jours" list={soon}  color="var(--yellow)" />
                <Block icon="🔵" title="Prochainement (30j)" list={coming}  color="var(--acc)"    />
              </>
          }
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-rappels')}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
