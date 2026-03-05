import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { useDataStore } from '../../store/dataStore';
import { useFilterStore } from '../../store/filterStore';
import { TableRow } from './TableRow';
import { TableHeader } from './TableHeader';
import { computeDossierStatus } from '../../lib/status';
import { Loader2, FolderOpen } from 'lucide-react';

export function DossierTable() {
  const { dossiers, paiements, isLoadingDossiers } = useDataStore();
  const { searchQuery, locationFilter, depotCadFilter, viewMode, includeArchived } = useFilterStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredDossiers = useMemo(() => {
    let list = dossiers;

    // View mode
    if (viewMode === 'actifs') {
      list = list.filter((d) => !d.in_trash && (!d.archived || includeArchived));
    } else if (viewMode === 'archives') {
      list = list.filter((d) => d.archived && !d.in_trash);
    } else if (viewMode === 'corbeille') {
      list = list.filter((d) => d.in_trash);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.nom.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          (d.endroit && d.endroit.toLowerCase().includes(q)) ||
          (d.telephone && d.telephone.includes(q)) ||
          (d.observations && d.observations.toLowerCase().includes(q))
      );
    }

    // Location
    if (locationFilter) {
      list = list.filter((d) => d.endroit === locationFilter);
    }

    // Depot cad
    if (depotCadFilter) {
      list = list.filter((d) => d.depot_cad === depotCadFilter);
    }

    return list;
  }, [dossiers, viewMode, includeArchived, searchQuery, locationFilter, depotCadFilter]);

  // Precompute payment totals per dossier for status calculation
  const paiementTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const p of paiements) {
      totals[p.dossier_id] = (totals[p.dossier_id] || 0) + p.montant;
    }
    return totals;
  }, [paiements]);

  const rowVirtualizer = useVirtualizer({
    count: filteredDossiers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  if (isLoadingDossiers) {
    return (
      <div className="flex flex-1 flex-col bg-slate-950">
        <TableHeader filteredCount={0} totalCount={0} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Chargement des dossiers...</span>
          </div>
        </div>
      </div>
    );
  }

  if (filteredDossiers.length === 0) {
    return (
      <div className="flex flex-1 flex-col bg-slate-950">
        <TableHeader filteredCount={0} totalCount={dossiers.length} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <FolderOpen className="h-12 w-12 opacity-20" />
            <span className="text-sm">
              {dossiers.length === 0
                ? 'Aucun dossier. Cliquez sur "Nouveau" pour commencer.'
                : 'Aucun dossier ne correspond aux filtres.'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-slate-950 flex flex-col">
      <TableHeader filteredCount={filteredDossiers.length} totalCount={dossiers.length} />
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const dossier = filteredDossiers[virtualRow.index];
            return (
              <TableRow
                key={dossier.id}
                dossier={dossier}
                index={virtualRow.index}
                totalPaiements={paiementTotals[dossier.id] || 0}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
