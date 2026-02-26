import { isArchived, isInTrash, sumPayments } from '../lib/compat'
import { fmt } from '../lib/utils.jsx'

export default function StatusBar({ rows, visibleCount }) {
  const actifs = rows.filter((row) => !isArchived(row) && !isInTrash(row)).length
  const archives = rows.filter((row) => isArchived(row)).length
  const corbeille = rows.filter((row) => isInTrash(row)).length
  const attendu = rows.reduce((sum, row) => sum + Number(row.montant || 0), 0)
  const encaisse = rows.reduce((sum, row) => sum + sumPayments(row.paiements, row.encaisse), 0)
  const reste = Math.max(attendu - encaisse, 0)

  return (
    <div id="statusbar">
      <div className="sbi"><span>{visibleCount}</span> affiche(s)</div>
      <div className="sbi">Actifs: <b>{actifs}</b></div>
      <div className="sbi">Archives: <b>{archives}</b></div>
      <div className="sbi">Corbeille: <b>{corbeille}</b></div>
      <div className="sbi sbi-att">Attendu: <b>{fmt(attendu)} DA</b></div>
      <div className="sbi sbi-enc">Encaisse: <b>{fmt(encaisse)} DA</b></div>
      <div className="sbi sbi-res">Reste: <b>{fmt(reste)} DA</b></div>
      <div className="sbi-ver">v4.1 - Compat desktop</div>
    </div>
  )
}
