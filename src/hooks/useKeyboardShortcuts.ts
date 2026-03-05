import { useEffect } from 'react';
import { useModalStore } from '../store/modalStore';
import { useDataStore } from '../store/dataStore';
import { useAppStore } from '../store/appStore';
import { useFilterStore } from '../store/filterStore';
import { toast } from 'sonner';

export function useKeyboardShortcuts() {
  const { openDossierModal, openDashboardModal, openRemindersModal, closeAllModals } = useModalStore();
  const { selectedDossierIds, updateDossier } = useDataStore();
  const { confirmBeforeDelete } = useAppStore();
  const { setSearchQuery } = useFilterStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Ctrl+N: New dossier
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openDossierModal();
      }

      // Ctrl+F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        // Signal Navbar to open search — we do it via store
        setSearchQuery('');
        document.querySelector<HTMLInputElement>('input[placeholder*="Rechercher"]')?.focus();
      }

      // F2: Edit selected dossier
      if (e.key === 'F2') {
        e.preventDefault();
        if (selectedDossierIds.length === 1) openDossierModal();
      }

      // F5: Dashboard
      if (e.key === 'F5') {
        e.preventDefault();
        openDashboardModal();
      }

      // Ctrl+R: Reminders
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        openRemindersModal();
      }

      // Ctrl+A: Archive selected
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        if (selectedDossierIds.length > 0) {
          selectedDossierIds.forEach((id) =>
            updateDossier(id, { archived: true, date_archive: new Date().toISOString() })
          );
          toast.success(`${selectedDossierIds.length} dossier(s) archivé(s)`);
        }
      }

      // Delete: Move to trash (respects confirmBeforeDelete setting)
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedDossierIds.length === 0) return;
        const proceed = () => {
          selectedDossierIds.forEach((id) => updateDossier(id, { in_trash: true }));
          toast.success(`${selectedDossierIds.length} dossier(s) mis à la corbeille`);
        };
        if (confirmBeforeDelete) {
          const confirmed = window.confirm(
            `Déplacer ${selectedDossierIds.length} dossier(s) vers la corbeille ?`
          );
          if (confirmed) proceed();
        } else {
          proceed();
        }
      }

      // Escape: Close modals
      if (e.key === 'Escape') closeAllModals();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openDossierModal, openDashboardModal, openRemindersModal, closeAllModals,
    selectedDossierIds, updateDossier, confirmBeforeDelete, setSearchQuery,
  ]);
}
