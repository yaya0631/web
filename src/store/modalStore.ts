import { create } from 'zustand';

interface ModalState {
  isDossierModalOpen: boolean;
  isPaymentModalOpen: boolean;
  isFilesModalOpen: boolean;
  isDashboardModalOpen: boolean;
  isRemindersModalOpen: boolean;
  isHistoryModalOpen: boolean;
  isExportModalOpen: boolean;
  isSettingsModalOpen: boolean;
  
  openDossierModal: () => void;
  closeDossierModal: () => void;
  
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  
  openFilesModal: () => void;
  closeFilesModal: () => void;
  
  openDashboardModal: () => void;
  closeDashboardModal: () => void;
  
  openRemindersModal: () => void;
  closeRemindersModal: () => void;
  
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
  
  openExportModal: () => void;
  closeExportModal: () => void;
  
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  
  closeAllModals: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isDossierModalOpen: false,
  isPaymentModalOpen: false,
  isFilesModalOpen: false,
  isDashboardModalOpen: false,
  isRemindersModalOpen: false,
  isHistoryModalOpen: false,
  isExportModalOpen: false,
  isSettingsModalOpen: false,
  
  openDossierModal: () => set({ isDossierModalOpen: true }),
  closeDossierModal: () => set({ isDossierModalOpen: false }),
  
  openPaymentModal: () => set({ isPaymentModalOpen: true }),
  closePaymentModal: () => set({ isPaymentModalOpen: false }),
  
  openFilesModal: () => set({ isFilesModalOpen: true }),
  closeFilesModal: () => set({ isFilesModalOpen: false }),
  
  openDashboardModal: () => set({ isDashboardModalOpen: true }),
  closeDashboardModal: () => set({ isDashboardModalOpen: false }),
  
  openRemindersModal: () => set({ isRemindersModalOpen: true }),
  closeRemindersModal: () => set({ isRemindersModalOpen: false }),
  
  openHistoryModal: () => set({ isHistoryModalOpen: true }),
  closeHistoryModal: () => set({ isHistoryModalOpen: false }),
  
  openExportModal: () => set({ isExportModalOpen: true }),
  closeExportModal: () => set({ isExportModalOpen: false }),
  
  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),
  
  closeAllModals: () => set({
    isDossierModalOpen: false,
    isPaymentModalOpen: false,
    isFilesModalOpen: false,
    isDashboardModalOpen: false,
    isRemindersModalOpen: false,
    isHistoryModalOpen: false,
    isExportModalOpen: false,
    isSettingsModalOpen: false,
  }),
}));
