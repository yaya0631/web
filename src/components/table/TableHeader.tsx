import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import { Checkbox } from '../ui/checkbox';
import { useFilterStore } from '../../store/filterStore';
import { useMemo } from 'react';
import { computeDossierStatus } from '../../lib/status';

interface TableHeaderProps {
  filteredCount: number;
  totalCount: number;
}

export function TableHeader({ filteredCount, totalCount }: TableHeaderProps) {
  const { columnVisibility } = useAppStore();
  const { dossiers, paiements, selectedDossierIds, setSelectedDossierIds, clearSelection } = useDataStore();
  const { viewMode, includeArchived, searchQuery, locationFilter, depotCadFilter } = useFilterStore();

  // Re-derive filtered IDs for select-all
  const filteredIds = useMemo(() => {
    let list = dossiers;
    if (viewMode === 'actifs') list = list.filter((d) => !d.in_trash && (!d.archived || includeArchived));
    else if (viewMode === 'archives') list = list.filter((d) => d.archived && !d.in_trash);
    else list = list.filter((d) => d.in_trash);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.nom.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          (d.endroit && d.endroit.toLowerCase().includes(q)) ||
          (d.telephone && d.telephone.includes(q))
      );
    }
    if (locationFilter) list = list.filter((d) => d.endroit === locationFilter);
    if (depotCadFilter) list = list.filter((d) => d.depot_cad === depotCadFilter);
    return list.map((d) => d.id);
  }, [dossiers, viewMode, includeArchived, searchQuery, locationFilter, depotCadFilter]);

  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedDossierIds.includes(id));
  const someSelected = filteredIds.some((id) => selectedDossierIds.includes(id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDossierIds(filteredIds);
    } else {
      clearSelection();
    }
  };

  return (
    <div className="sticky top-0 z-10 flex h-10 w-full items-center border-b border-slate-800 bg-slate-900 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
      <div className="w-10 shrink-0">
        <Checkbox
          checked={allSelected}
          data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
          onCheckedChange={handleSelectAll}
        />
      </div>
      <div className="w-12 shrink-0 text-center">#</div>
      {columnVisibility.id && <div className="w-32 shrink-0">ID Dossier</div>}
      {columnVisibility.nom && <div className="w-48 shrink-0">Nom Client</div>}
      {columnVisibility.endroit && <div className="w-40 shrink-0">Endroit</div>}
      {columnVisibility.telephone && <div className="w-32 shrink-0">Téléphone</div>}
      {columnVisibility.date_finale && <div className="w-32 shrink-0">Date Finale</div>}
      {columnVisibility.montant && <div className="w-32 shrink-0 text-right">Montant</div>}
      {columnVisibility.acte && <div className="w-20 shrink-0 text-center">Acte</div>}
      {columnVisibility.regul && <div className="w-20 shrink-0 text-center">Régul</div>}
      {columnVisibility.agricole && <div className="w-20 shrink-0 text-center">Agricole</div>}
      {columnVisibility.depot_cad && <div className="w-32 shrink-0">Dépôt CAD</div>}
      {columnVisibility.depot_domain && <div className="w-32 shrink-0">Dépôt Domain</div>}
      {columnVisibility.etat && <div className="w-32 shrink-0">État</div>}
      {columnVisibility.observations && <div className="flex-1 min-w-[200px]">Observations</div>}
      {filteredCount < totalCount && (
        <div className="ml-auto text-slate-500 normal-case">
          {filteredCount}/{totalCount}
        </div>
      )}
    </div>
  );
}
