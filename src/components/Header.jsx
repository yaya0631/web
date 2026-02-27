import { useState, useRef, useEffect, useCallback } from 'react'

const RECENTS_KEY = 'geoman-recents'
const MAX_RECENTS = 10

export default function Header({
  connected,
  onNew,
  onEdit,
  onDelete,
  onRestore,
  onTrashView,
  onFichiers,
  onPaiement,
  onArchive,
  onDashboard,
  onRappels,
  onExport,
  onTheme,
  onColumns,
  onSettings,
  onHistory,
  onDuplicate,
  darkMode,
  rows,
  onSelectDossier,
}) {
  const [showRecents, setShowRecents] = useState(false)
  const recentsRef = useRef(null)

  // Load recents from localStorage
  const getRecents = useCallback(() => {
    try {
      const saved = localStorage.getItem(RECENTS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  }, [])

  // Close recents on outside click
  useEffect(() => {
    if (!showRecents) return
    const handler = (e) => {
      if (recentsRef.current && !recentsRef.current.contains(e.target)) {
        setShowRecents(false)
      }
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [showRecents])

  const recents = getRecents()
  const recentRows = recents
    .map((id) => rows?.find((r) => r.id === id))
    .filter(Boolean)
    .slice(0, MAX_RECENTS)

  return (
    <div id="header">
      <div className="logo-mark">
        <div className="logo-icon">GM</div>
        <div className="logo-text">Geo<span>Man</span></div>
      </div>

      <button className="hbtn hb-new" onClick={onNew}>Nouveau</button>
      <button className="hbtn hb-edit" onClick={onEdit}>Modifier</button>
      <button className="hbtn hb-del" onClick={onDelete}>Corbeille / Purge</button>
      <button className="hbtn hb-ghost" onClick={onRestore}>Restaurer</button>
      <button className="hbtn hb-ghost" onClick={onDuplicate}>Dupliquer</button>
      <div className="hsep" />
      <button className="hbtn hb-file" onClick={onFichiers}>Fichiers</button>
      <button className="hbtn hb-pay" onClick={onPaiement}>Paiements</button>
      <button className="hbtn hb-arch" onClick={onArchive}>Archiver</button>
      <button className="hbtn hb-ghost" onClick={onHistory}>Historique</button>
      <div className="hsep" />
      <button className="hbtn hb-ghost" onClick={onDashboard}>Tableau de bord</button>
      <button className="hbtn hb-ghost" onClick={onRappels}>Rappels</button>
      <button className="hbtn hb-ghost" onClick={onTrashView}>Corbeille</button>
      <button className="hbtn hb-ghost" onClick={onExport}>Import/Export</button>
      <button className="hbtn hb-ghost" onClick={onColumns}>Colonnes</button>

      <div className="h-right">
        <div className="recents-wrap" ref={recentsRef}>
          <button
            className="hbtn hb-ghost"
            onClick={(e) => { e.stopPropagation(); setShowRecents((v) => !v) }}
          >
            Recents
          </button>
          {showRecents && (
            <div className="recents-dropdown">
              {recentRows.length === 0 ? (
                <div className="recents-empty">Aucun dossier recent</div>
              ) : (
                recentRows.map((r) => (
                  <div
                    key={r.id}
                    className="recents-item"
                    onClick={() => {
                      onSelectDossier(r.id)
                      setShowRecents(false)
                    }}
                  >
                    <span className="recents-id">{r.id}</span>
                    <span>{r.nom}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div id="sb-status">
          <div className={`sb-dot ${connected ? 'ok' : 'err'}`} />
          <span>{connected ? 'Connecte' : 'Erreur'}</span>
        </div>
        <div className="hsep" />
        <button className="hbtn hb-ghost" onClick={onSettings}>Parametres</button>
        <button className="hbtn hb-ghost" onClick={onTheme}>
          {darkMode ? 'Mode clair' : 'Mode sombre'}
        </button>
      </div>
    </div>
  )
}

// Helper to add a dossier ID to recents
export function addToRecents(dossierId) {
  if (!dossierId) return
  try {
    const saved = localStorage.getItem(RECENTS_KEY)
    let recents = saved ? JSON.parse(saved) : []
    recents = recents.filter((id) => id !== dossierId)
    recents.unshift(dossierId)
    if (recents.length > MAX_RECENTS) recents = recents.slice(0, MAX_RECENTS)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents))
  } catch { /* ignore */ }
}
