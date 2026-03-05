import { useState, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useModalStore } from '../../store/modalStore';
import { useFilterStore } from '../../store/filterStore';
import { computeDossierStatus, statusColors, statusLabels } from '../../lib/status';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dossier } from '../../types';
import {
  Plus, Search, Filter, DollarSign, FileText,
  History, Archive, Trash2, RotateCcw, ChevronRight,
  MapPin, Phone, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'actifs' | 'archives' | 'corbeille';

export function MobileView() {
  const { dossiers, paiements, updateDossier, setSelectedDossierIds } = useDataStore();
  const { openDossierModal, openPaymentModal, openFilesModal, openHistoryModal } = useModalStore();
  const { searchQuery, setSearchQuery } = useFilterStore();
  const [viewMode, setViewMode] = useState<ViewMode>('actifs');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const paiementTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const p of paiements) t[p.dossier_id] = (t[p.dossier_id] || 0) + p.montant;
    return t;
  }, [paiements]);

  const filtered = useMemo(() => {
    let list = dossiers;
    if (viewMode === 'actifs') list = list.filter((d) => !d.in_trash && !d.archived);
    else if (viewMode === 'archives') list = list.filter((d) => d.archived && !d.in_trash);
    else list = list.filter((d) => d.in_trash);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) => d.nom.toLowerCase().includes(q) || (d.endroit || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [dossiers, viewMode, searchQuery]);

  const selectedDossier = selectedId ? dossiers.find((d) => d.id === selectedId) : null;

  const handleSelect = (d: Dossier) => {
    setSelectedId(d.id);
    setSelectedDossierIds([d.id]);
  };

  const handleRestore = (d: Dossier) => {
    updateDossier(d.id, { in_trash: false, archived: false, date_archive: null });
    toast.success('Dossier restauré');
    setSelectedId(null);
  };

  // Detail view
  if (selectedDossier) {
    const total = paiementTotals[selectedDossier.id] || 0;
    const status = computeDossierStatus(selectedDossier, total);
    const reste = selectedDossier.montant - total;

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3">
          <Button variant="ghost" size="sm" className="text-blue-400 px-0" onClick={() => setSelectedId(null)}>
            ← Retour
          </Button>
          <span className="font-medium text-slate-200 truncate">{selectedDossier.nom}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div className="flex gap-2 flex-wrap">
            <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', statusColors[status])}>
              {statusLabels[status]}
            </span>
            <span className="font-mono text-xs text-blue-400 bg-blue-500/10 rounded-full px-2 py-1">{selectedDossier.id}</span>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-slate-300">{selectedDossier.endroit || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-slate-300">{selectedDossier.telephone || '-'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-slate-300">{formatDate(selectedDossier.date_finale)}</span>
            </div>
          </div>

          {/* Finances */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Montant total</span>
              <span className="font-mono text-slate-200">{formatCurrency(selectedDossier.montant)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Encaissé</span>
              <span className="font-mono text-green-400">{formatCurrency(total)}</span>
            </div>
            <div className="h-px bg-slate-800" />
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-400">Reste</span>
              <span className={cn('font-mono', reste > 0 ? 'text-red-400' : 'text-green-400')}>
                {formatCurrency(Math.max(0, reste))}
              </span>
            </div>
          </div>

          {/* Observations */}
          {selectedDossier.observations && (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Observations</p>
              <p className="text-sm text-slate-300">{selectedDossier.observations}</p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="gap-2" onClick={() => { openDossierModal(); }}>
              <FileText className="h-4 w-4" />Modifier
            </Button>
            <Button variant="secondary" className="gap-2" onClick={openPaymentModal}>
              <DollarSign className="h-4 w-4" />Paiements
            </Button>
            <Button variant="secondary" className="gap-2" onClick={openFilesModal}>
              <FileText className="h-4 w-4" />Fichiers
            </Button>
            <Button variant="secondary" className="gap-2" onClick={openHistoryModal}>
              <History className="h-4 w-4" />Historique
            </Button>

            {(selectedDossier.in_trash || selectedDossier.archived) ? (
              <Button
                className="col-span-2 gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => handleRestore(selectedDossier)}
              >
                <RotateCcw className="h-4 w-4" />Restaurer
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    updateDossier(selectedDossier.id, { archived: true, date_archive: new Date().toISOString() });
                    toast.success('Dossier archivé');
                    setSelectedId(null);
                  }}
                >
                  <Archive className="h-4 w-4" />Archiver
                </Button>
                <Button
                  variant="secondary"
                  className="gap-2 text-red-400"
                  onClick={() => {
                    updateDossier(selectedDossier.id, { in_trash: true });
                    toast.success('Dossier mis à la corbeille');
                    setSelectedId(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />Corbeille
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Mobile toolbar */}
      <div className="border-b border-slate-800 bg-slate-900 px-3 py-2 space-y-2">
        {showSearch && (
          <Input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="h-8 bg-slate-950 text-sm"
            onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
          />
        )}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-md bg-slate-950 p-1">
            {(['actifs', 'archives', 'corbeille'] as ViewMode[]).map((m) => (
              <button
                key={m}
                className={cn(
                  'rounded px-3 py-1 text-xs font-medium transition-colors capitalize',
                  viewMode === m ? 'bg-slate-700 text-white' : 'text-slate-400'
                )}
                onClick={() => setViewMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setShowSearch((v) => !v)}>
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={openDossierModal}>
              <Plus className="h-4 w-4" />Nouveau
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FileText className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Aucun dossier</p>
          </div>
        ) : (
          filtered.map((dossier) => {
            const total = paiementTotals[dossier.id] || 0;
            const status = computeDossierStatus(dossier, total);
            return (
              <div
                key={dossier.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 active:bg-slate-800 cursor-pointer"
                onClick={() => handleSelect(dossier)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-200 truncate">{dossier.nom}</span>
                    <span className={cn('shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold', statusColors[status])}>
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {dossier.endroit && <span>{dossier.endroit}</span>}
                    <span className="font-mono text-blue-400">{dossier.id}</span>
                  </div>
                  <div className="mt-1 flex gap-3 text-xs">
                    <span className="text-slate-400">{formatCurrency(dossier.montant)}</span>
                    {total > 0 && <span className="text-green-400">Encaissé: {formatCurrency(total)}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
