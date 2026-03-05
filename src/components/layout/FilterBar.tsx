import { useMemo } from 'react';
import { FilterX } from 'lucide-react';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { useDataStore } from '../../store/dataStore';
import { useFilterStore, ViewMode } from '../../store/filterStore';

export function FilterBar() {
  const { dossiers } = useDataStore();
  const {
    searchQuery, setSearchQuery,
    locationFilter, setLocationFilter,
    depotCadFilter, setDepotCadFilter,
    viewMode, setViewMode,
    includeArchived, setIncludeArchived,
    showRemaining, setShowRemaining,
    resetFilters,
  } = useFilterStore();

  // Build dynamic location options from actual data
  const locationOptions = useMemo(() => {
    const locs = Array.from(
      new Set(dossiers.map((d) => d.endroit).filter(Boolean) as string[])
    ).sort();
    return locs;
  }, [dossiers]);

  const tabs: { key: ViewMode; label: string }[] = [
    { key: 'actifs', label: 'Actifs' },
    { key: 'archives', label: 'Archives' },
    { key: 'corbeille', label: 'Corbeille' },
  ];

  return (
    <div className="flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 flex-wrap">
      {/* Search */}
      <div className="relative w-56">
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full bg-slate-900 pl-3 text-sm"
        />
      </div>

      {/* Location filter */}
      <Select
        className="h-9 w-44 bg-slate-900 text-sm"
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
      >
        <option value="">Tous les endroits</option>
        {locationOptions.map((loc) => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </Select>

      {/* Depot Cadastre filter */}
      <Select
        className="h-9 w-48 bg-slate-900 text-sm"
        value={depotCadFilter}
        onChange={(e) => setDepotCadFilter(e.target.value)}
      >
        <option value="">Dépôt Cadastre (Tous)</option>
        <option value="Depose">Déposé</option>
        <option value="Non depose">Non déposé</option>
        <option value="Depose 2eme fois">Déposé 2ème fois</option>
      </Select>

      {/* View tabs */}
      <div className="flex items-center gap-1 rounded-md bg-slate-900 p-1 border border-slate-800">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant="ghost"
            size="sm"
            className={`h-7 text-xs px-3 ${
              viewMode === tab.key
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setViewMode(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Checkboxes */}
      {viewMode === 'actifs' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-archived"
            checked={includeArchived}
            onCheckedChange={(v) => setIncludeArchived(v as boolean)}
          />
          <label htmlFor="show-archived" className="text-xs font-medium text-slate-300 cursor-pointer">
            Inclure archivés
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id="show-remaining"
          checked={showRemaining}
          onCheckedChange={(v) => setShowRemaining(v as boolean)}
        />
        <label htmlFor="show-remaining" className="text-xs font-medium text-slate-300 cursor-pointer">
          Afficher reste
        </label>
      </div>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        className="h-9 gap-2 text-slate-400 hover:text-slate-200"
        onClick={resetFilters}
      >
        <FilterX className="h-4 w-4" />
        <span>Réinitialiser</span>
      </Button>
    </div>
  );
}
