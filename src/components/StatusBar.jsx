import { fmt } from '../lib/utils.jsx'

export default function StatusBar({ rows, visibleCount }) {
  const actifs = rows.filter(d => !d.archive).length
  const arch   = rows.filter(d =>  d.archive).length
  const att    = rows.reduce((s, d) => s + (d.montant  || 0), 0)
  const enc    = rows.reduce((s, d) => s + (d.encaisse || 0), 0)

  return (
    <div id="statusbar">
      <div className="sbi"><span>{visibleCount}</span> affiché(s)</div>
      <div className="sbi">Actifs : <b>{actifs}</b></div>
      <div className="sbi">Archives : <b>{arch}</b></div>
      <div className="sbi sbi-att">Attendu : <b>{fmt(att)} DA</b></div>
      <div className="sbi sbi-enc">Encaissé : <b>{fmt(enc)} DA</b></div>
      <div className="sbi sbi-res">Reste : <b>{fmt(att - enc)} DA</b></div>
      <div className="sbi-ver">v4.0 · Supabase</div>
    </div>
  )
}
