import { fmt } from '../../lib/utils.jsx'
import { EtatChip } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

export default function DashboardModal({ rows }) {
  const total  = rows.length
  const actifs = rows.filter(d => !d.archive).length
  const arch   = rows.filter(d =>  d.archive).length
  const att    = rows.reduce((s, d) => s + (d.montant  || 0), 0)
  const enc    = rows.reduce((s, d) => s + (d.encaisse || 0), 0)
  const pct    = att > 0 ? ((enc / att) * 100).toFixed(1) : 0

  const byEtat = {}, byEnd = {}
  rows.forEach(d => {
    byEtat[d.etat] = (byEtat[d.etat] || 0) + 1
    if (d.endroit) byEnd[d.endroit] = (byEnd[d.endroit] || 0) + 1
  })

  const today  = new Date()
  const urgent = rows.filter(d => {
    if (!d.date_finale || d.archive) return false
    const diff = (new Date(d.date_finale) - today) / 864e5
    return diff >= 0 && diff <= 7
  }).length

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  return (
    <div className="overlay" id="m-dashboard">
      <div className="modal" style={{width:720}} onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">📊 Tableau de Bord</div>
            <div className="mh-sub">{dateStr}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-dashboard')}>✕</button>
        </div>
        <div className="mb">
          {/* Cards */}
          <div className="db-grid">
            {[
              { val: total,      lbl: 'Total Dossiers', color: 'var(--acc)' },
              { val: actifs,     lbl: 'Actifs',         color: 'var(--green)' },
              { val: arch,       lbl: 'Archivés',       color: 'var(--orange)' },
              { val: fmt(att),   lbl: 'Attendu (DA)',   color: 'var(--yellow)' },
              { val: fmt(enc),   lbl: 'Encaissé (DA)',  color: 'var(--green)', bar: pct },
              { val: fmt(att-enc), lbl: 'Reste (DA)',   color: 'var(--red)' },
            ].map(({ val, lbl, color, bar }) => (
              <div key={lbl} className="db-card">
                <div className="db-val" style={{color}}>{val}</div>
                <div className="db-lbl">{lbl}</div>
                {bar !== undefined && (
                  <div className="db-bar">
                    <div className="db-bar-fill" style={{width:`${bar}%`,background:'var(--green)'}} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div className="db-sec">
              <div className="db-sec-title">État des dossiers</div>
              {Object.entries(byEtat).map(([k, v]) => (
                <div key={k} className="db-row">
                  <span className="drl"><EtatChip etat={k} /></span>
                  <span className="drv" style={{color:'var(--text)'}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="db-sec">
              <div className="db-sec-title">Par endroit &amp; alertes</div>
              {Object.entries(byEnd).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
                <div key={k} className="db-row">
                  <span className="drl">{k}</span>
                  <span className="drv" style={{color:'var(--acc)'}}>{v}</span>
                </div>
              ))}
              <div className="db-row" style={{marginTop:8}}>
                <span className="drl">🚨 Urgent (&lt;7j)</span>
                <span className="drv" style={{color:'var(--yellow)'}}>{urgent}</span>
              </div>
              <div className="db-row">
                <span className="drl">💰 Taux recouvrement</span>
                <span className="drv" style={{color:'var(--green)'}}>{pct}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-dashboard')}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
