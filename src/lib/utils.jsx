// ── FORMATTERS ────────────────────────────────
export function fmt(v) {
  return Number(v).toLocaleString('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  const map = { pdf: '📄', jpg: '🖼', jpeg: '🖼', png: '🖼', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', zip: '📦' }
  return map[ext] || '📎'
}

// ── ÉTAT CHIPS ────────────────────────────────
export const ETAT_MAP = {
  retard:   { cls: 'c-retard',   label: '⬤ En retard' },
  echeance: { cls: 'c-echeance', label: '⏳ Échéance <7j' },
  partiel:  { cls: 'c-partiel',  label: '◑ Solde partiel' },
  termine:  { cls: 'c-termine',  label: '✓ Terminé' },
  attente:  { cls: 'c-attente',  label: '○ En attente' },
  bloque:   { cls: 'c-bloque',   label: '✕ Bloqué' },
  archive:  { cls: 'c-archive',  label: '↓ Archive' },
}

export function EtatChip({ etat }) {
  const { cls, label } = ETAT_MAP[etat] || ETAT_MAP.attente
  return <span className={`chip ${cls}`}>{label}</span>
}

export function DepotChip({ value }) {
  if (value === 'Déposé')   return <span className="chip c-termine">✓ Déposé</span>
  if (value === 'En cours') return <span className="chip c-echeance">⋯ En cours</span>
  return <span className="chip c-attente">Non déposé</span>
}

export function BoolCell({ value }) {
  return value
    ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>Oui</span>
    : <span style={{ color: 'var(--t4)' }}>—</span>
}

// ── DOWNLOAD HELPER ───────────────────────────
export function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}
