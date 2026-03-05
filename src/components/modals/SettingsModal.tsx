import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useModalStore } from '../../store/modalStore';
import { useAppStore } from '../../store/appStore';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Moon, Sun, Bell } from 'lucide-react';

export function SettingsModal() {
  const { isSettingsModalOpen, closeSettingsModal } = useModalStore();
  const { 
    theme, setTheme, 
    showRemindersOnStartup, setShowRemindersOnStartup,
    confirmBeforeDelete, setConfirmBeforeDelete,
    columnVisibility, setColumnVisibility 
  } = useAppStore();

  const columns = [
    { id: 'id', label: 'ID Dossier' },
    { id: 'nom', label: 'Nom Client' },
    { id: 'endroit', label: 'Endroit' },
    { id: 'telephone', label: 'Téléphone' },
    { id: 'date_finale', label: 'Date Finale' },
    { id: 'montant', label: 'Montant' },
    { id: 'acte', label: 'Acte' },
    { id: 'regul', label: 'Régularisation' },
    { id: 'agricole', label: 'Agricole' },
    { id: 'depot_cad', label: 'Dépôt Cadastre' },
    { id: 'depot_domain', label: 'Dépôt Domain' },
    { id: 'etat', label: 'État' },
    { id: 'observations', label: 'Observations' },
  ];

  return (
    <Dialog open={isSettingsModalOpen} onOpenChange={closeSettingsModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8">
          {/* General Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Général</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-200">Thème</label>
                    <p className="text-xs text-slate-500">Mode sombre ou clair</p>
                  </div>
                  <div className="flex bg-slate-900 rounded-md p-1 border border-slate-800">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-7 px-2 ${theme === 'light' ? 'bg-slate-800 text-slate-200' : 'text-slate-500'}`}
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-7 px-2 ${theme === 'dark' ? 'bg-slate-800 text-slate-200' : 'text-slate-500'}`}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-200">Rappels au démarrage</label>
                    <p className="text-xs text-slate-500">Afficher les échéances à l'ouverture</p>
                  </div>
                  <Checkbox 
                    checked={showRemindersOnStartup} 
                    onCheckedChange={(c) => setShowRemindersOnStartup(c as boolean)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-slate-200">Confirmation de suppression</label>
                    <p className="text-xs text-slate-500">Demander avant de supprimer</p>
                  </div>
                  <Checkbox 
                    checked={confirmBeforeDelete} 
                    onCheckedChange={(c) => setConfirmBeforeDelete(c as boolean)} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columns Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Colonnes Visibles</h3>
            <div className="bg-slate-900 rounded-md border border-slate-800 p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {columns.map((col) => (
                <div key={col.id} className="flex items-center gap-3">
                  <Checkbox 
                    id={`col-${col.id}`}
                    checked={columnVisibility[col.id]}
                    onCheckedChange={(checked) => setColumnVisibility(col.id, checked as boolean)}
                  />
                  <label htmlFor={`col-${col.id}`} className="text-sm text-slate-300 cursor-pointer">
                    {col.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
