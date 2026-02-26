import { useState, useMemo, useEffect, useCallback } from 'react'
import { useDossiers } from './hooks/useDossiers'
import { ToastProvider, useToast } from './hooks/useToast'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import DossierTable from './components/DossierTable'
import StatusBar from './components/StatusBar'
import RightPanel from './components/RightPanel'
import DossierModal from './components/modals/DossierModal'
import PaiementModal from './components/modals/PaiementModal'
import FichiersModal from './components/modals/FichiersModal'
import DashboardModal from './components/modals/DashboardModal'
import RappelsModal from './components/modals/RappelsModal'
import { ConfirmModal, ExportModal } from './components/modals/ConfirmExportModal'
import { openModal, closeModal } from './components/modals/Modal'
import './App.css'

function GeoMan() {
  const toast = useToast()
  const { rows, loading, connected, upsert, update, remove } = useDossiers()

  // ── UI STATE ──────────────────────────────
  const [selId,     setSelId]     = useState(null)
  const [editing,   setEditing]   = useState(null) // null = new, string = id
  const [sortField, setSortField] = useState('id')
  const [sortAsc,   setSortAsc]   = useState(true)
  const [showSolde, setShowSolde] = useState(false)
  const [darkMode,  setDarkMode]  = useState(true)
  const [filters,   setFilters]   = useState({
    search: '', endroit: '', depot: '', vue: 'actifs', showAll: false,
  })

  // ── KEYBOARD SHORTCUTS ────────────────────
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'))
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); handleNew() }
      if (e.key === 'Delete' && selId) handleDelete()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selId])

  // ── URGENT CHECK ──────────────────────────
  useEffect(() => {
    if (!rows.length) return
    const today = new Date()
    const n = rows.filter(d => !d.archive && d.date_finale && new Date(d.date_finale) < today).length
    if (n > 0) setTimeout(() => toast('err', `⚠️ ${n} dossier(s) en retard !`), 800)
  }, [rows.length])

  // ── FILTERED + SORTED DATA ────────────────
  const filtered = useMemo(() => {
    const { search, endroit, depot, vue, showAll } = filters
    return rows
      .filter(d => {
        if (vue === 'actifs'   && d.archive && !showAll) return false
        if (vue === 'archives' && !d.archive) return false
        if (endroit && d.endroit !== endroit) return false
        if (depot   && d.depot_cad !== depot) return false
        if (search) {
          const q = search.toLowerCase()
          return (d.id||'').toLowerCase().includes(q)
            || (d.nom||'').toLowerCase().includes(q)
            || (d.endroit||'').toLowerCase().includes(q)
            || (d.telephone||'').includes(q)
        }
        return true
      })
      .sort((a, b) => {
        let va = a[sortField] ?? '', vb = b[sortField] ?? ''
        if (typeof va === 'boolean') { va = va?1:0; vb = vb?1:0 }
        if (['montant','encaisse'].includes(sortField)) { va = +va||0; vb = +vb||0 }
        if (va < vb) return sortAsc ? -1 : 1
        if (va > vb) return sortAsc ?  1 : -1
        return 0
      })
  }, [rows, filters, sortField, sortAsc])

  const endroits = useMemo(() =>
    [...new Set(rows.map(d => d.endroit).filter(Boolean))].sort()
  , [rows])

  const selDossier = rows.find(d => d.id === selId) || null

  // ── FILTER HANDLERS ───────────────────────
  const handleFilterChange = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const handleReset = () => {
    setFilters({ search: '', endroit: '', depot: '', vue: 'actifs', showAll: false })
    setShowSolde(false)
  }

  // ── SORT ──────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortAsc(a => !a)
    else { setSortField(field); setSortAsc(true) }
  }

  // ── ROW SELECT ────────────────────────────
  const handleSelect = (id, dblclick = false) => {
    setSelId(prev => prev === id ? null : id)
    if (dblclick) handleEdit()
  }

  // ── CRUD ACTIONS ──────────────────────────
  const handleNew = () => {
    setEditing(null)
    openModal('m-dossier')
  }

  const handleEdit = useCallback(() => {
    if (!selId) { toast('err', 'Sélectionnez un dossier à modifier.'); return }
    setEditing(selId)
    openModal('m-dossier')
  }, [selId, toast])

  const handleDelete = useCallback(() => {
    if (!selId) { toast('err', 'Sélectionnez un dossier.'); return }
    openModal('m-confirm')
  }, [selId, toast])

  const handleSaveDossier = async (data) => {
    try {
      await upsert(data)
      setSelId(data.id)
      toast('ok', editing ? 'Dossier mis à jour.' : 'Dossier créé.')
    } catch (e) { toast('err', 'Erreur : ' + e.message) }
  }

  const handleConfirmDelete = async () => {
    try {
      await remove(selId)
      setSelId(null)
      toast('ok', 'Dossier supprimé.')
    } catch (e) { toast('err', 'Erreur : ' + e.message) }
  }

  const handleArchive = async () => {
    if (!selId) { toast('err', 'Sélectionnez un dossier.'); return }
    const d = rows.find(x => x.id === selId)
    const newArch = !d.archive
    try {
      await update(selId, {
        archive:      newArch,
        etat:         newArch ? 'archive' : 'attente',
        date_archive: newArch ? new Date().toISOString().split('T')[0] : null,
      })
      toast('ok', newArch ? 'Dossier archivé.' : 'Dossier restauré.')
    } catch (e) { toast('err', 'Erreur : ' + e.message) }
  }

  const handleUpdateDossier = async (id, patch) => {
    try {
      await update(id, patch)
    } catch (e) { toast('err', 'Erreur : ' + e.message) }
  }

  // ── MODAL OPENERS ─────────────────────────
  const requireSel = (fn) => () => {
    if (!selId) { toast('err', 'Sélectionnez un dossier.'); return }
    fn()
  }

  // ── THEME ─────────────────────────────────
  const handleTheme = () => {
    setDarkMode(d => {
      const next = !d
      const light = {
        '--bg':'#f0f4f8','--s1':'#ffffff','--s2':'#f5f7fb','--s3':'#e8edf5',
        '--b1':'#d1dae8','--b2':'#c0ccdf','--text':'#111827',
        '--t2':'#374151','--t3':'#6b7280','--t4':'#9ca3af',
      }
      if (!next) {
        Object.entries(light).forEach(([k,v]) => document.documentElement.style.setProperty(k, v))
      } else {
        Object.keys(light).forEach(k => document.documentElement.style.removeProperty(k))
      }
      return next
    })
  }

  return (
    <>
      {/* Loading overlay on first mount */}
      {loading && (
        <div id="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">Connexion Supabase…</div>
        </div>
      )}

      <Header
        connected={connected}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFichiers={requireSel(() => openModal('m-fichiers'))}
        onPaiement={requireSel(() => openModal('m-paiement'))}
        onArchive={handleArchive}
        onDashboard={() => openModal('m-dashboard')}
        onRappels={() => openModal('m-rappels')}
        onExport={() => openModal('m-export')}
        onTheme={handleTheme}
        darkMode={darkMode}
      />

      <FilterBar
        filters={filters}
        endroits={endroits}
        onChange={handleFilterChange}
        onReset={handleReset}
        showSolde={showSolde}
        onToggleSolde={() => setShowSolde(s => !s)}
      />

      <div id="content">
        <DossierTable
          rows={filtered}
          selId={selId}
          onSelect={handleSelect}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
          showSolde={showSolde}
        />
        <RightPanel dossier={selDossier} />
      </div>

      <StatusBar rows={rows} visibleCount={filtered.length} />

      <div id="legend">
        <span className="lg-lbl">Légende :</span>
        {[
          ['#ff4d6d','En retard'],['#ffd166','Échéance <7j'],
          ['#9b72ff','Solde partiel'],['#00d68f','Terminé'],
          ['#4f6480','En attente'],['#ff8c42','Bloqué'],['#2e3f56','Archive'],
        ].map(([c, l]) => (
          <span key={l} className="lg">
            <span className="lg-d" style={{background:c}} /> {l}
          </span>
        ))}
      </div>

      {/* MODALS */}
      <DossierModal editing={editing} rows={rows} onSave={handleSaveDossier} />
      <PaiementModal dossier={selDossier} onUpdate={handleUpdateDossier} />
      <FichiersModal dossier={selDossier} onUpdate={handleUpdateDossier} />
      <DashboardModal rows={rows} />
      <RappelsModal rows={rows} />
      <ConfirmModal dossier={selDossier} onConfirm={handleConfirmDelete} />
      <ExportModal rows={rows} onImportDone={n => toast('ok', `${n} dossiers importés.`)} />
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <GeoMan />
    </ToastProvider>
  )
}
