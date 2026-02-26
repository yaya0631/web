import { getDisplayState, hasOutstanding, isArchived, isInTrash, isOverdue, sumPayments } from '../../lib/compat'
import { ETAT_MAP, fmt } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

export default function DashboardModal({ rows }) {
  const activeRows = rows.filter((row) => !isInTrash(row))
  const total = activeRows.length
  const actifs = activeRows.filter((row) => !isArchived(row)).length
  const archives = activeRows.filter((row) => isArchived(row)).length
  const corbeille = rows.filter((row) => isInTrash(row)).length
  const attendu = activeRows.reduce((sum, row) => sum + Number(row.montant || 0), 0)
  const encaisse = activeRows.reduce((sum, row) => sum + sumPayments(row.paiements, row.encaisse), 0)
  const pct = attendu > 0 ? ((encaisse / attendu) * 100).toFixed(1) : '0.0'
  const urgent = activeRows.filter((row) => isOverdue(row)).length
  const impayes = activeRows.filter((row) => hasOutstanding(row)).length

  const byState = {}
  const byEndroit = {}
  activeRows.forEach((row) => {
    const state = getDisplayState(row)
    byState[state] = (byState[state] || 0) + 1
    if (row.endroit) byEndroit[row.endroit] = (byEndroit[row.endroit] || 0) + 1
  })

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="overlay" id="m-dashboard">
      <div className="modal" style={{ width: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">Tableau de bord</div>
            <div className="mh-sub">{dateStr}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-dashboard')}>x</button>
        </div>
        <div className="mb">
          <div className="db-grid">
            {[
              { val: total, lbl: 'Total dossiers', color: 'var(--acc)' },
              { val: actifs, lbl: 'Actifs', color: 'var(--green)' },
              { val: archives, lbl: 'Archives', color: 'var(--orange)' },
              { val: corbeille, lbl: 'Corbeille', color: 'var(--red)' },
              { val: fmt(attendu), lbl: 'Attendu (DA)', color: 'var(--yellow)' },
              { val: fmt(encaisse), lbl: 'Encaisse (DA)', color: 'var(--green)', bar: pct },
              { val: fmt(Math.max(attendu - encaisse, 0)), lbl: 'Reste (DA)', color: 'var(--red)' },
              { val: urgent, lbl: 'Retards', color: 'var(--orange)' },
              { val: impayes, lbl: 'Impayes', color: 'var(--purple)' },
            ].map(({ val, lbl, color, bar }) => (
              <div key={lbl} className="db-card">
                <div className="db-val" style={{ color }}>{val}</div>
                <div className="db-lbl">{lbl}</div>
                {bar !== undefined && (
                  <div className="db-bar">
                    <div className="db-bar-fill" style={{ width: `${bar}%`, background: 'var(--green)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="db-sec">
              <div className="db-sec-title">Etat des dossiers</div>
              {Object.entries(byState).map(([state, count]) => (
                <div key={state} className="db-row">
                  <span className="drl">{ETAT_MAP[state]?.label || state}</span>
                  <span className="drv" style={{ color: 'var(--text)' }}>{count}</span>
                </div>
              ))}
            </div>
            <div className="db-sec">
              <div className="db-sec-title">Par endroit</div>
              {Object.entries(byEndroit).sort((a, b) => b[1] - a[1]).map(([endroit, count]) => (
                <div key={endroit} className="db-row">
                  <span className="drl">{endroit}</span>
                  <span className="drv" style={{ color: 'var(--acc)' }}>{count}</span>
                </div>
              ))}
              <div className="db-row" style={{ marginTop: 8 }}>
                <span className="drl">Taux recouvrement</span>
                <span className="drv" style={{ color: 'var(--green)' }}>{pct}%</span>
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
