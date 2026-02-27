import { isArchived, isInTrash } from '../../lib/compat'
import { closeModal } from './Modal.jsx'

function ReminderBlock({ title, list, color }) {
  if (!list.length) return null
  return (
    <div className="db-sec">
      <div className="db-sec-title">{title} ({list.length})</div>
      {list.map((row) => (
        <div key={row.id} className="rp-item">
          <div className="rp-content">
            <div className="rp-name">{row.id} - {row.nom}</div>
            <div className="rp-detail">
              {row.endroit} {row.observations ? `. ${row.observations}` : ''}
            </div>
          </div>
          <div className="rp-badge" style={{ color }}>
            {row.diff < 0 ? `${Math.abs(row.diff)}j retard` : row.diff === 0 ? "Aujourd'hui" : `dans ${row.diff}j`}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RappelsModal({ rows }) {
  const today = new Date()
  const items = rows
    .filter((row) => !isArchived(row) && !isInTrash(row) && row.date_finale)
    .map((row) => ({
      ...row,
      diff: Math.round((new Date(row.date_finale) - today) / 86400000),
    }))
    .sort((a, b) => a.diff - b.diff)

  const overdue = items.filter((row) => row.diff < 0)
  const soon = items.filter((row) => row.diff >= 0 && row.diff <= 7)
  const coming = items.filter((row) => row.diff > 7 && row.diff <= 30)

  return (
    <div className="overlay" id="m-rappels">
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <div className="mh-title">Rappels et alertes</div>
          <button className="mh-close" onClick={() => closeModal('m-rappels')}>x</button>
        </div>
        <div className="mb">
          {!overdue.length && !soon.length && !coming.length ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--t3)' }}>Aucune alerte pour le moment.</div>
          ) : (
            <>
              <ReminderBlock title="En retard" list={overdue} color="var(--red)" />
              <ReminderBlock title="Echeance dans 7 jours" list={soon} color="var(--yellow)" />
              <ReminderBlock title="Prochainement (30j)" list={coming} color="var(--acc)" />
            </>
          )}
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-rappels')}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
