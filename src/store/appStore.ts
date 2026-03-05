import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  showRemindersOnStartup: boolean;
  setShowRemindersOnStartup: (show: boolean) => void;
  confirmBeforeDelete: boolean;
  setConfirmBeforeDelete: (confirm: boolean) => void;
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (columnId: string, visible: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      showRemindersOnStartup: true,
      setShowRemindersOnStartup: (show) => set({ showRemindersOnStartup: show }),
      confirmBeforeDelete: true,
      setConfirmBeforeDelete: (confirm) => set({ confirmBeforeDelete: confirm }),
      columnVisibility: {
        id: true,
        nom: true,
        endroit: true,
        telephone: true,
        date_finale: true,
        montant: true,
        acte: true,
        regul: true,
        agricole: true,
        depot_cad: true,
        depot_domain: true,
        etat: true,
        observations: true,
      },
      setColumnVisibility: (columnId, visible) =>
        set((state) => ({
          columnVisibility: { ...state.columnVisibility, [columnId]: visible },
        })),
    }),
    {
      name: 'geoman-settings',
    }
  )
);
