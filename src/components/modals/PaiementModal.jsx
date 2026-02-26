import { useState, useEffect } from 'react'
import { fmt, todayStr } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

export default function PaiementModal({ dossier, onUpdate }) {
  const [amt, setAmt]   = useState('')
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')

  useEffect(() => {
    setAmt(''); setDate(todayStr()); setNote('')
  }, [dossier?.id])

  if (!dossier) return null

  const enc   = dossier.encaisse || 0
  const tot   = dossier.montant  || 0
  const reste = tot - enc
  const pct   = tot > 0 ? Math.min(100, (enc / tot) * 100) : 0

  const handleAdd = async () => {
    const amount = parseFloat(amt)
    if (!amount || amount <= 0) { alert('Montant invalide.'); return }
    const paiements = [...(dossier.paiements || []), { montant: amount, date, note }]
    const encaisse  = enc + amount
    const etat = encaisse >= tot ? 'termine' : encaisse > 0 ? 'partiel' : dossier.etat
    await onUpdate(dossier.id, { paiements, encaisse, etat })
    setAmt(''); setNote('')
  }

  const handleRemove = async (idx) => {
    const paiements = [...(dossier.paiements || [])]
    const encaisse  = Math.max(0, enc - paiements[idx].montant)
    paiements.splice(idx, 1)
    await onUpdate(dossier.id, { paiements, encaisse })
  }

  return (
    <div className="overlay" id="m-paiement">
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">💳 Paiements</div>
            <div className="mh-sub">{dossier.id} — {dossier.nom}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-paiement')}>✕</button>
        </div>
        <div className="mb">
          {/* Summary */}
          <div className="pay-summary">
            <div className="pay-row"><span className="pl">Montant total</span><span className="pv">{fmt(tot)} DA</span></div>
            <div className="pay-row"><span className="pl">Encaissé</span><span className="pv" style={{color:'var(--green)'}}>{fmt(enc)} DA</span></div>
            <div className="pay-row">
              <span className="pl">Reste</span>
              <span className="pv" style={{color: reste > 0 ? 'var(--red)' : 'var(--green)'}}>{fmt(reste)} DA</span>
            </div>
            <div className="pay-progress"><div className="pay-progress-fill" style={{width:`${pct}%`}} /></div>
            <div style={{textAlign:'right',fontSize:11,color:'var(--t3)',fontFamily:'var(--mono)'}}>{pct.toFixed(1)}% encaissé</div>
          </div>

          {/* Form */}
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div className="fg">
              <label className="fl-f">Montant versé (DA) *</label>
              <input className="fc" type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="fg">
              <label className="fl-f">Date</label>
              <input className="fc" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl-f">Remarque</label>
              <input className="fc" value={note} onChange={e => setNote(e.target.value)} placeholder="Optionnel…" />
            </div>
          </div>

          {/* History */}
          {dossier.paiements?.length > 0 && (
            <div style={{marginTop:16}}>
              <div style={{fontSize:'10.5px',fontWeight:700,color:'var(--t4)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Historique</div>
              {dossier.paiements.map((p, i) => (
                <div key={i} className="pay-hist-item">
                  <div>
                    <span style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--green)'}}>{fmt(p.montant)} DA</span>
                    <span style={{color:'var(--t3)',fontSize:11,marginLeft:8}}>{p.date}</span>
                    {p.note && <span style={{color:'var(--t4)',fontSize:11,marginLeft:6}}>— {p.note}</span>}
                  </div>
                  <button onClick={() => handleRemove(i)} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',fontSize:14}}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-paiement')}>Fermer</button>
          <button className="hbtn hb-pay" onClick={handleAdd}>＋ Ajouter versement</button>
        </div>
      </div>
    </div>
  )
}
