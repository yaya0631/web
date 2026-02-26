import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const [selId, setSelId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [sortField, setSortField] = useState('id')
  const [sortAsc, setSortAsc] = useState(true)
  const [showSolde, setShowSolde] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [confirmMode, setConfirmMode] = useState('trash')
  const [filters, setFilters] = useState({
    search: '',
    endroit: '',
    depot: '',
    vue: 'actifs',
    showAll: false,
  })

  const selDossier = rows.find((row) => row.id === selId) || null

  const handleNew = useCallback(() => {
    setEditing(null)
    openModal('m-dossier')
  }, [])

  const handleEdit = useCallback(() => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier a modifier.')
      return
    }
    setEditing(selId)
    openModal('m-dossier')
  }, [selId, toast])

  const handleDelete = useCallback(() => {
    if (!selId) {
      toast('err', 'Selectionnez un dossier.')
      return
    }
    const row = rows.find((item) => item.id === selId)
    if (!row) return
    setConfirmMode(isInTrash(row) ? 'purge' : 'trash')
    openModal('m-confirm')
  }, [rows, selId, toast])

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
      await toggleArchive(selId)
      toast('ok', isArchived(row) ? 'Dossier retire des archives.' : 'Dossier archive.')
    } catch (error) {
      toast('err', `Erreur: ${error.message}`)
    }
  }, [rows, selId, toast, toggleArchive])

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
      }
    } catch (error) {
      toast('err', `Erreur: ${error.message}`)
    }
  }, [moveToTrash, purge, rows, selId, toast])

  const handleSaveDossier = useCallback(async (data) => {
    try {
      await upsert(data)
      setSelId(data.id)
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

  const handleSelect = useCallback((id, dblclick = false) => {
    if (dblclick) {
      setSelId(id)
      setEditing(id)
      openModal('m-dossier')
      return
    }
    setSelId((current) => (current === id ? null : id))
  }, [])

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
    fn()
  }, [selId, toast])

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

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') {
        closeModal('all')
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        handleNew()
      }
      if (event.key === 'Delete' && selId) {
        handleDelete()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDelete, handleNew, selId])

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
          String(row.telephone || '').toLowerCase().includes(query)
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
        onTheme={handleTheme}
        darkMode={darkMode}
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

      <DossierModal editing={editing} rows={rows} onSave={handleSaveDossier} />
      <PaiementModal dossier={selDossier} onUpdate={handleUpdateDossier} />
      <FichiersModal dossier={selDossier} onUpdate={handleUpdateDossier} />
      <DashboardModal rows={rows} />
      <RappelsModal rows={rows} />
      <ConfirmModal dossier={selDossier} mode={confirmMode} onConfirm={handleConfirmDelete} />
      <ExportModal rows={rows} onImportDone={(count) => toast('ok', `${count} dossiers importes.`)} />
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
