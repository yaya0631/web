import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../lib/formatters';
import { History as HistoryIcon } from 'lucide-react';

export function HistoryModal() {
  const { isHistoryModalOpen, closeHistoryModal } = useModalStore();
  const { selectedDossierIds, dossiers, historique } = useDataStore();

  const dossierId = selectedDossierIds[0];
  const dossier = dossiers.find(d => d.id === dossierId);
  const dossierHistory = historique.filter(h => h.dossier_id === dossierId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!dossier) return null;

  return (
    <Dialog open={isHistoryModalOpen} onOpenChange={closeHistoryModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historique - {dossier.nom} ({dossier.id})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {dossierHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <HistoryIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Aucun historique disponible pour ce dossier.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-800 ml-3 space-y-6 pb-4">
              {dossierHistory.map((item) => (
                <div key={item.id} className="relative pl-6">
                  <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-950" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">{item.action}</span>
                      <span className="text-xs font-mono text-slate-500">{formatDate(item.created_at)}</span>
                    </div>
                    {item.details && (
                      <div className="text-sm text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800/50 mt-1">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {JSON.stringify(item.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
