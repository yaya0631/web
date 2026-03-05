import { Plus, Edit2, Copy, Trash2, Archive, Download, Upload, Clock, PieChart, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { useDataStore } from '../../store/dataStore';
import { useModalStore } from '../../store/modalStore';
import { useAppStore } from '../../store/appStore';
import { toast } from 'sonner';
import { Dossier } from '../../types';

function generateId(): string {
  return `D-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export function CommandBar() {
  const { selectedDossierIds, dossiers, addDossier, updateDossier, fetchDossiers, fetchPaiements } = useDataStore();
  const { confirmBeforeDelete } = useAppStore();
  const {
    openDossierModal, openDashboardModal, openRemindersModal,
    openExportModal, openFilesModal,
  } = useModalStore();

  const hasSelection = selectedDossierIds.length > 0;
  const isSingleSelection = selectedDossierIds.length === 1;

  const handleDuplicate = () => {
    if (!isSingleSelection) return;
    const src = dossiers.find((d) => d.id === selectedDossierIds[0]);
    if (!src) return;
    const newDossier: Dossier = {
      ...src,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addDossier(newDossier);
    toast.success('Dossier dupliqué avec succès');
  };

  const handleArchive = () => {
    selectedDossierIds.forEach((id) =>
      updateDossier(id, { archived: true, date_archive: new Date().toISOString() })
    );
    toast.success(`${selectedDossierIds.length} dossier(s) archivé(s)`);
  };

  const handleTrash = () => {
    const proceed = () => {
      selectedDossierIds.forEach((id) => updateDossier(id, { in_trash: true }));
      toast.success(`${selectedDossierIds.length} dossier(s) mis à la corbeille`);
    };
    if (confirmBeforeDelete && selectedDossierIds.length > 0) {
      if (window.confirm(`Déplacer ${selectedDossierIds.length} dossier(s) vers la corbeille ?`)) proceed();
    } else {
      proceed();
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchDossiers(), fetchPaiements()]);
    toast.success('Données actualisées');
  };

  return (
    <div className="flex h-12 items-center gap-1 border-b border-slate-800 bg-slate-900 px-2">
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" onClick={openDossierModal}>
        <Plus className="h-4 w-4 text-blue-400" />
        <span>Nouveau</span>
      </Button>
      <div className="h-4 w-px bg-slate-700 mx-1" />

      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" disabled={!isSingleSelection} onClick={openDossierModal}>
        <Edit2 className="h-4 w-4" />
        <span>Modifier</span>
      </Button>
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" disabled={!isSingleSelection} onClick={handleDuplicate}>
        <Copy className="h-4 w-4" />
        <span>Dupliquer</span>
      </Button>

      <div className="h-4 w-px bg-slate-700 mx-1" />

      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" disabled={!hasSelection} onClick={handleArchive}>
        <Archive className="h-4 w-4 text-purple-400" />
        <span>Archiver</span>
      </Button>
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300 hover:text-red-400" disabled={!hasSelection} onClick={handleTrash}>
        <Trash2 className="h-4 w-4 text-red-400" />
        <span>Supprimer</span>
      </Button>

      <div className="h-4 w-px bg-slate-700 mx-1" />

      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" disabled={!isSingleSelection} onClick={openFilesModal}>
        <Upload className="h-4 w-4 text-teal-400" />
        <span>Fichiers</span>
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" onClick={handleRefresh} title="Actualiser (F5)">
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" onClick={openRemindersModal}>
        <Clock className="h-4 w-4 text-yellow-500" />
        <span>Rappels</span>
      </Button>
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" onClick={openDashboardModal}>
        <PieChart className="h-4 w-4 text-green-400" />
        <span>Tableau de bord</span>
      </Button>
      <div className="h-4 w-px bg-slate-700 mx-1" />
      <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-300" onClick={openExportModal}>
        <Download className="h-4 w-4" />
        <span>Exporter</span>
      </Button>
    </div>
  );
}
