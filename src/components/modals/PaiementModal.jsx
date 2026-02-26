import { useEffect, useMemo, useState } from 'react'
import { nextReceiptNumber, normalizePayments, sumPayments } from '../../lib/compat'
import { fmt, todayStr } from '../../lib/utils.jsx'
import { closeModal } from './Modal.jsx'

const STAGES = [
  'Acompte',
  'Travaux terrain',
  'Depot CAD',
  'Remise dossier',
  'Solde final',
  'Autre',
]

const MODES = ['Especes', 'Cheque', 'Virement', 'CCP', 'Autre']

export default function PaiementModal({ dossier, onUpdate }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [stage, setStage] = useState(STAGES[0])
  const [mode, setMode] = useState(MODES[0])

  useEffect(() => {
    setAmount('')
    setDate(todayStr())
    setNote('')
    setStage(STAGES[0])
    setMode(MODES[0])
  }, [dossier?.id])

  const history = useMemo(() => normalizePayments(dossier?.paiements), [dossier?.paiements])
  const totalPaid = sumPayments(history, dossier?.encaisse)
  const total = Number(dossier?.montant || 0)
  const remaining = Math.max(total - totalPaid, 0)
  const pct = total > 0 ? Math.min(100, (totalPaid / total) * 100) : 0

  if (!dossier) return null

  const handleAdd = async () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      alert('Montant invalide.')
      return
    }
    const receipt = nextReceiptNumber(history)
    const payment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      montant_paye: parsed,
      date_paiement: date,
      etape: stage,
      notes: note || null,
      date_creation: new Date().toISOString(),
      receipt_number: receipt,
      mode_paiement: mode,
    }
    const paiements = [...history, payment]
    const encaisse = sumPayments(paiements, 0)
    const etat = encaisse >= total && total > 0 ? 'Termine' : dossier.etat
    await onUpdate(dossier.id, { paiements, encaisse, etat })
    setAmount('')
    setNote('')
  }

  const handleRemove = async (paymentId) => {
    const paiements = history.filter((item) => item.id !== paymentId)
    const encaisse = sumPayments(paiements, 0)
    await onUpdate(dossier.id, { paiements, encaisse })
  }

  return (
    <div className="overlay" id="m-paiement">
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="mh">
          <div>
            <div className="mh-title">Paiements</div>
            <div className="mh-sub">{dossier.id} - {dossier.nom}</div>
          </div>
          <button className="mh-close" onClick={() => closeModal('m-paiement')}>x</button>
        </div>
        <div className="mb">
          <div className="pay-summary">
            <div className="pay-row">
              <span className="pl">Montant total</span>
              <span className="pv">{fmt(total)} DA</span>
            </div>
            <div className="pay-row">
              <span className="pl">Encaisse</span>
              <span className="pv" style={{ color: 'var(--green)' }}>{fmt(totalPaid)} DA</span>
            </div>
            <div className="pay-row">
              <span className="pl">Reste</span>
              <span className="pv" style={{ color: remaining > 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(remaining)} DA</span>
            </div>
            <div className="pay-progress">
              <div className="pay-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--mono)' }}>
              {pct.toFixed(1)}% encaisse
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="fg">
              <label className="fl-f">Montant verse (DA) *</label>
              <input className="fc" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="fg">
              <label className="fl-f">Date</label>
              <input className="fc" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl-f">Jalon</label>
              <select className="fc" value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">Mode paiement</label>
              <select className="fc" value={mode} onChange={(e) => setMode(e.target.value)}>
                {MODES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl-f">Note</label>
              <input className="fc" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optionnel..." />
            </div>
          </div>

          {history.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
                Historique
              </div>
              {history.map((p) => (
                <div key={p.id} className="pay-hist-item">
                  <div>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green)' }}>{fmt(p.montant_paye)} DA</span>
                    <span style={{ color: 'var(--t3)', fontSize: 11, marginLeft: 8 }}>{p.date_paiement}</span>
                    <span style={{ color: 'var(--t2)', fontSize: 11, marginLeft: 8 }}>{p.etape}</span>
                    <span style={{ color: 'var(--t3)', fontSize: 11, marginLeft: 8 }}>{p.mode_paiement}</span>
                    {p.receipt_number && (
                      <span style={{ color: 'var(--acc)', fontSize: 11, marginLeft: 8 }}>{p.receipt_number}</span>
                    )}
                    {p.notes && (
                      <span style={{ color: 'var(--t4)', fontSize: 11, marginLeft: 8 }}>- {p.notes}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(p.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14 }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mf">
          <button className="hbtn hb-ghost" onClick={() => closeModal('m-paiement')}>Fermer</button>
          <button className="hbtn hb-pay" onClick={handleAdd}>Ajouter versement</button>
        </div>
      </div>
    </div>
  )
}
