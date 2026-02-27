import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDossiers } from './hooks/useDossiers'
import { useUndo } from './hooks/useUndo'
import { ToastProvider, useToast } from './hooks/useToast'
import Header, { addToRecents } from './components/Header'
import FilterBar from './components/FilterBar'
import DossierTable from './components/DossierTable'
import StatusBar from './components/StatusBar'
import RightPanel from './components/RightPanel'
import ContextMenu from './components/ContextMenu'
import DossierModal from './components/modals/DossierModal'
import PaiementModal from './components/modals/PaiementModal'
import FichiersModal from './components/modals/FichiersModal'
import DashboardModal from './components/modals/DashboardModal'
import RappelsModal from './components/modals/RappelsModal'
import HistoryModal from './components/modals/HistoryModal'
import ColumnsModal, { loadColumnVisibility } from './components/modals/ColumnsModal'
import SettingsModal, { loadSettings } from './components/modals/SettingsModal'
import { ConfirmModal, ExportModal } from './components/modals/ConfirmExportModal'
import { hasOutstanding, isArchived, isInTrash, isOverdue } from './lib/compat'
import { closeModal, openModal } from './components/modals/Modal'
import './App.css'

function normalizeSortValue(row, field) {
  if (field === 'montant' || field === 'encaisse') return Number(row[field] || 0)
  const value = row[field]
  if (typeof value === 'boolean') return value ? 1 : 0
  return String(value || '').toLowerCase()
}

function GeoMan() {
  const toast = useToast()
  const {
    rows,
    loading,
    connected,
    upsert,
    update,
    moveToTrash,
    restoreFromTrash,
    toggleArchive,
    purge,
  } = useDossiers()

  const { pushUndo, doUndo } = useUndo(toast)

  const [selId, setSelId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [editing, setEditing] = useState(null)
  const [prefill, setPrefill] = useState(null)
  const [sortField, setSortField] = useState('id')
  const [sortAsc, setSortAsc] = useState(true)
  const [showSolde, setShowSolde] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [confirmMode, setConfirmMode] = useState('trash')
  const [columnVisibility, setColumnVisibility] = useState(loadColumnVisibility)
  const [settings, setSettings] = useState(loadSettings)
  const startupDoneRef = useRef(false)
  const [filters, setFilters] = useState({
    search: '',
    endroit: '',
    depot: '',
    vue: 'actifs',
    showAll: false,
  })

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState({ visible: false, x: 0, y: 0, dossier: null })

  const selDossier = rows.find((row) => row.id === selId) || null

  // Startup reminders
  useEffect(() => {
    if (loading || startupDoneRef.current) return
    startupDoneRef.current = true
    const s = loadSettings()
    if (s.showRemindersOnStartup) {
      const overdue = rows.filter((r) => isOverdue(r)).length
      if (overdue > 0) {
        setTimeout(() => openModal('m-rappels'), 600)
      }
    }
  }, [loading, rows])

  const handleNew = useCallback(() => {
    setEditing(null)
    setPrefill(null)
    openModal('m-dossier')
  }, [])

  const handleEdit = useCallback(() => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier a modifier.')
      return
    }
    setEditing(selId)
    setPrefill(null)
    openModal('m-dossier')
    addToRecents(selId)
  }, [selId, toast])

  const handleDuplicate = useCallback(() => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier a dupliquer.')
      return
    }
    const row = rows.find((item) => item.id === selId)
    if (!row) return
    setEditing(null)
    setPrefill({ ...row, id: '', paiements: [], fichiers: [], historique: [] })
    openModal('m-dossier')
  }, [rows, selId, toast])

  const handleConfirmDelete = useCallback(async () => {
    if (!selId) return
    const row = rows.find((item) => item.id === selId)
    if (!row) return

    try {
      if (isInTrash(row)) {
        await purge(selId)
        setSelId(null)
        toast('ok', 'Dossier supprime definitivement.')
      } else {
        await moveToTrash(selId)
        toast('ok', 'Dossier deplace vers la corbeille.')
        pushUndo('Suppression', async () => {
          await restoreFromTrash(selId)
        })
      }
    } catch (error) {
      toast('err', `Erreur: ${error.message}`)
    }
  }, [moveToTrash, purge, restoreFromTrash, rows, selId, toast, pushUndo])

  const handleDelete = useCallback(() => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier.')
      return
    }
    const row = rows.find((item) => item.id === selId)
    if (!row) return

    const s = loadSettings()
    if (s.confirmBeforeDelete || isInTrash(row)) {
      setConfirmMode(isInTrash(row) ? 'purge' : 'trash')
      openModal('m-confirm')
    } else {
      handleConfirmDelete()
    }
  }, [rows, selId, toast, handleConfirmDelete])

  const handleRestore = useCallback(async () => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier.')
      return
    }
    const row = rows.find((item) => item.id === selId)
    if (!row) return

    try {
      if (isInTrash(row)) {
        await restoreFromTrash(selId)
        toast('ok', 'Dossier restaure depuis la corbeille.')
        return
      }
      if (isArchived(row)) {
        await toggleArchive(selId)
        toast('ok', 'Dossier restaure des archives.')
        return
      }
      toast('inf', 'Le dossier est deja actif.')
    } catch (error) {
      toast('err', `Erreur: ${error.message}`)
    }
  }, [restoreFromTrash, rows, selId, toast, toggleArchive])

  const handleArchive = useCallback(async () => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier.')
      return
    }
    const row = rows.find((item) => item.id === selId)
    if (!row) return
    if (isInTrash(row)) {
      toast('err', 'Impossible d archiver un dossier en corbeille.')
      return
    }
    try {
      const wasArchived = isArchived(row)
      await toggleArchive(selId)
      toast('ok', wasArchived ? 'Dossier retire des archives.' : 'Dossier archive.')
      pushUndo(
        wasArchived ? 'Desarchivage' : 'Archivage',
        async () => { await toggleArchive(selId) }
      )
    } catch (error) {
      toast('err', `Erreur: ${error.message}`)
    }
  }, [rows, selId, toast, toggleArchive, pushUndo])

  const handleSaveDossier = useCallback(async (data) => {
    try {
      await upsert(data)
      setSelId(data.id)
      addToRecents(data.id)
      toast('ok', editing ? 'Dossier mis a jour.' : 'Dossier cree.')
    } catch (error) {
      toast('err', `Erreur: ${error.message}`)
    }
  }, [editing, toast, upsert])

  const handleUpdateDossier = useCallback(async (id, patch) => {
    try {
      await update(id, patch)
    } catch (error) {
      toast('err', `Erreur: ${error.message}`)
    }
  }, [toast, update])

  const handleSort = useCallback((field) => {
    const normalized = field === '_n' ? 'id' : field
    if (sortField === normalized) {
      setSortAsc((current) => !current)
      return
    }
    setSortField(normalized)
    setSortAsc(true)
  }, [sortField])

  const handleSelect = useCallback((id, dblclick = false, event = null) => {
    if (dblclick) {
      setSelId(id)
      setSelectedIds(new Set())
      setEditing(id)
      setPrefill(null)
      openModal('m-dossier')
      addToRecents(id)
      return
    }

    if (event?.shiftKey && selId) {
      // Use rows directly for range selection
      const visibleIds = rows.map((r) => r.id)
      const startIdx = visibleIds.indexOf(selId)
      const endIdx = visibleIds.indexOf(id)
      if (startIdx >= 0 && endIdx >= 0) {
        const from = Math.min(startIdx, endIdx)
        const to = Math.max(startIdx, endIdx)
        const range = new Set(visibleIds.slice(from, to + 1))
        setSelectedIds(range)
        setSelId(id)
        return
      }
    }

    if (event?.ctrlKey || event?.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
      setSelId(id)
      return
    }

    setSelectedIds(new Set())
    setSelId((current) => (current === id ? null : id))
  }, [selId, rows])

  const handleTheme = useCallback(() => {
    setDarkMode((dark) => {
      const next = !dark
      const light = {
        '--bg': '#f0f4f8',
        '--s1': '#ffffff',
        '--s2': '#f5f7fb',
        '--s3': '#e8edf5',
        '--b1': '#d1dae8',
        '--b2': '#c0ccdf',
        '--text': '#111827',
        '--t2': '#374151',
        '--t3': '#6b7280',
        '--t4': '#9ca3af',
      }
      if (!next) {
        Object.entries(light).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value)
        })
      } else {
        Object.keys(light).forEach((key) => {
          document.documentElement.style.removeProperty(key)
        })
      }
      return next
    })
  }, [])

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setFilters({
      search: '',
      endroit: '',
      depot: '',
      vue: 'actifs',
      showAll: false,
    })
    setShowSolde(false)
  }, [])

  const handleTrashView = useCallback(() => {
    setFilters((prev) => ({ ...prev, vue: 'corbeille' }))
  }, [])

  const requireSel = useCallback((fn) => () => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier.')
      return
    }
    addToRecents(selId)
    fn()
  }, [selId, toast])

  const handleContextMenu = useCallback((event, dossier) => {
    setCtxMenu({ visible: true, x: event.clientX, y: event.clientY, dossier })
  }, [])

  const handleSelectDossier = useCallback((id) => {
    setSelId(id)
    setSelectedIds(new Set())
    addToRecents(id)
  }, [])

  // Overdue warning
  useEffect(() => {
    const overdue = rows.filter((row) => isOverdue(row)).length
    if (overdue > 0) {
      const timer = setTimeout(() => {
        toast('err', `${overdue} dossier(s) en retard.`)
      }, 800)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [rows, toast])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (event) => {
      // Ignore if typing in an input
      const tag = event.target?.tagName?.toLowerCase()
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select'

      if (event.key === 'Escape') {
        closeModal('all')
        setCtxMenu((prev) => ({ ...prev, visible: false }))
        if (!isInput) handleReset()
      }

      if (isInput) return

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        handleNew()
      }
      if (event.key === 'F2') {
        event.preventDefault()
        handleEdit()
      }
      if (event.key === 'F5') {
        event.preventDefault()
        openModal('m-dashboard')
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        openModal('m-rappels')
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        openModal('m-export')
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        window.print()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        doUndo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !event.shiftKey) {
        // Don't override Ctrl+A in input
        if (!isInput) {
          event.preventDefault()
          handleArchive()
        }
      }
      if (event.key === 'Delete' && selId) {
        if (event.ctrlKey && event.shiftKey) {
          event.preventDefault()
          handleTrashView()
        } else {
          handleDelete()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDelete, handleNew, handleEdit, handleArchive, handleReset, handleTrashView, doUndo, selId])

  const filtered = useMemo(() => {
    const { search, endroit, depot, vue, showAll } = filters
    return rows
      .filter((row) => {
        if (vue === 'actifs') {
          if (isInTrash(row)) return false
          if (!showAll && isArchived(row)) return false
        }
        if (vue === 'archives' && !isArchived(row)) return false
        if (vue === 'corbeille' && !isInTrash(row)) return false
        if (vue === 'retard' && !isOverdue(row)) return false
        if (vue === 'impayes' && !hasOutstanding(row)) return false

        if (endroit && row.endroit !== endroit) return false
        if (depot && row.depot_cad !== depot) return false
        if (!search) return true

        const query = search.toLowerCase()
        return (
          String(row.id || '').toLowerCase().includes(query) ||
          String(row.nom || '').toLowerCase().includes(query) ||
          String(row.endroit || '').toLowerCase().includes(query) ||
          String(row.telephone || '').toLowerCase().includes(query) ||
          String(row.observations || '').toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        const va = normalizeSortValue(a, sortField)
        const vb = normalizeSortValue(b, sortField)
        if (va < vb) return sortAsc ? -1 : 1
        if (va > vb) return sortAsc ? 1 : -1
        return 0
      })
  }, [filters, rows, sortAsc, sortField])

  const endroits = useMemo(
    () => [...new Set(rows.map((row) => row.endroit).filter(Boolean))].sort(),
    [rows]
  )

  // Context menu items
  const ctxItems = useMemo(() => {
    if (!ctxMenu.dossier) return []
    return [
      { label: 'Modifier', shortcut: 'F2', onClick: () => { setSelId(ctxMenu.dossier.id); setEditing(ctxMenu.dossier.id); setPrefill(null); openModal('m-dossier') } },
      { label: 'Dupliquer', onClick: () => { setSelId(ctxMenu.dossier.id); handleDuplicate() } },
      { separator: true },
      { label: 'Paiements', onClick: () => { setSelId(ctxMenu.dossier.id); openModal('m-paiement') } },
      { label: 'Fichiers', onClick: () => { setSelId(ctxMenu.dossier.id); openModal('m-fichiers') } },
      { label: 'Historique', onClick: () => { setSelId(ctxMenu.dossier.id); openModal('m-history') } },
      { separator: true },
      { label: 'Archiver', shortcut: 'Ctrl+A', onClick: () => { setSelId(ctxMenu.dossier.id); handleArchive() } },
      { label: 'Supprimer', shortcut: 'Del', danger: true, onClick: () => { setSelId(ctxMenu.dossier.id); handleDelete() } },
    ]
  }, [ctxMenu.dossier, handleDuplicate, handleArchive, handleDelete])

  return (
    <>
      {loading && (
        <div id="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">Connexion Supabase...</div>
        </div>
      )}

      <Header
        connected={connected}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onTrashView={handleTrashView}
        onFichiers={requireSel(() => openModal('m-fichiers'))}
        onPaiement={requireSel(() => openModal('m-paiement'))}
        onArchive={handleArchive}
        onDashboard={() => openModal('m-dashboard')}
        onRappels={() => openModal('m-rappels')}
        onExport={() => openModal('m-export')}
        onColumns={() => openModal('m-columns')}
        onSettings={() => openModal('m-settings')}
        onHistory={requireSel(() => openModal('m-history'))}
        onDuplicate={handleDuplicate}
        onTheme={handleTheme}
        darkMode={darkMode}
        rows={rows}
        selId={selId}
        onSelectDossier={handleSelectDossier}
      />

      <FilterBar
        filters={filters}
        endroits={endroits}
        onChange={handleFilterChange}
        onReset={handleReset}
        showSolde={showSolde}
        onToggleSolde={() => setShowSolde((current) => !current)}
      />

      <div id="content">
        <DossierTable
          rows={filtered}
          selId={selId}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
          showSolde={showSolde}
          columnVisibility={columnVisibility}
          onContextMenu={handleContextMenu}
        />
        <RightPanel dossier={selDossier} />
      </div>

      <StatusBar rows={rows} visibleCount={filtered.length} />

      <div id="legend">
        <span className="lg-lbl">Legende:</span>
        {[
          ['#ff4d6d', 'En retard'],
          ['#ffd166', 'Echeance <7j'],
          ['#9b72ff', 'Solde partiel'],
          ['#00d68f', 'Termine'],
          ['#4f6480', 'En attente'],
          ['#ff8c42', 'Bloque'],
          ['#2e3f56', 'Archive'],
        ].map(([color, label]) => (
          <span key={label} className="lg">
            <span className="lg-d" style={{ background: color }} /> {label}
          </span>
        ))}
      </div>

      <DossierModal editing={editing} rows={rows} onSave={handleSaveDossier} prefill={prefill} />
      <PaiementModal dossier={selDossier} onUpdate={handleUpdateDossier} />
      <FichiersModal dossier={selDossier} onUpdate={handleUpdateDossier} />
      <DashboardModal rows={rows} />
      <RappelsModal rows={rows} />
      <HistoryModal dossier={selDossier} />
      <ColumnsModal visibility={columnVisibility} onVisibilityChange={setColumnVisibility} />
      <SettingsModal onSettingsChange={setSettings} />
      <ConfirmModal dossier={selDossier} mode={confirmMode} onConfirm={handleConfirmDelete} />
      <ExportModal rows={rows} onImportDone={(count) => toast('ok', `${count} dossiers importes.`)} />

      <ContextMenu
        x={ctxMenu.x}
        y={ctxMenu.y}
        visible={ctxMenu.visible}
        onClose={() => setCtxMenu((prev) => ({ ...prev, visible: false }))}
        items={ctxItems}
      />
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
