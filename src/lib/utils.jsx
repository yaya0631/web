export function fmt(value) {
  return Number(value || 0).toLocaleString('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function fileIcon(name = '') {
  const ext = String(name).split('.').pop().toLowerCase()
  const map = {
    pdf: '[PDF]',
    jpg: '[IMG]',
    jpeg: '[IMG]',
    png: '[IMG]',
    webp: '[IMG]',
    doc: '[DOC]',
    docx: '[DOC]',
    xls: '[XLS]',
    xlsx: '[XLS]',
    zip: '[ZIP]',
  }
  return map[ext] || '[FILE]'
}

export const ETAT_MAP = {
  retard: { cls: 'c-retard', label: 'Retard' },
  echeance: { cls: 'c-echeance', label: 'Echeance < 7j' },
  partiel: { cls: 'c-partiel', label: 'Paiement partiel' },
  termine: { cls: 'c-termine', label: 'Termine' },
  attente: { cls: 'c-attente', label: 'En attente' },
  bloque: { cls: 'c-bloque', label: 'Bloque' },
  archive: { cls: 'c-archive', label: 'Archive' },
  corbeille: { cls: 'c-bloque', label: 'Corbeille' },
  en_cours: { cls: 'c-attente', label: 'En cours' },
}

export function EtatChip({ etat }) {
  const current = ETAT_MAP[etat] || ETAT_MAP.en_cours
  return <span className={`chip ${current.cls}`}>{current.label}</span>
}

export function DepotChip({ value }) {
  if (value === 'Depose') {
    return <span className="chip c-termine">Depose</span>
  }
  if (value === 'Depose 2eme fois') {
    return <span className="chip c-echeance">Depose 2eme</span>
  }
  return <span className="chip c-attente">Non depose</span>
}

export function BoolCell({ value }) {
  return value
    ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>Oui</span>
    : <span style={{ color: 'var(--t4)' }}>-</span>
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}
