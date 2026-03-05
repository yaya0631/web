import { create } from 'zustand';

export type ViewMode = 'actifs' | 'archives' | 'corbeille';

interface FilterState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  locationFilter: string;
  setLocationFilter: (l: string) => void;
  depotCadFilter: string;
  setDepotCadFilter: (d: string) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  includeArchived: boolean;
  setIncludeArchived: (v: boolean) => void;
  showRemaining: boolean;
  setShowRemaining: (v: boolean) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  locationFilter: '',
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  depotCadFilter: '',
  setDepotCadFilter: (depotCadFilter) => set({ depotCadFilter }),
  viewMode: 'actifs',
  setViewMode: (viewMode) => set({ viewMode }),
  includeArchived: false,
  setIncludeArchived: (includeArchived) => set({ includeArchived }),
  showRemaining: false,
  setShowRemaining: (showRemaining) => set({ showRemaining }),
  resetFilters: () =>
    set({
      searchQuery: '',
      locationFilter: '',
      depotCadFilter: '',
      viewMode: 'actifs',
      includeArchived: false,
      showRemaining: false,
    }),
}));
