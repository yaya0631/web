import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../lib/formatters';
import { History as HistoryIcon, Edit2, Plus, DollarSign, FileText, Archive, Trash2, RotateCcw } from 'lucide-react';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'Création du dossier':  <Plus className="h-3 w-3" />,
  'Mise à jour du dossier': <Edit2 className="h-3 w-3" />,
  'Paiement ajouté':      <DollarSign className="h-3 w-3" />,
  'Paiement supprimé':    <DollarSign className="h-3 w-3" />,
  'Fichier ajouté':       <FileText className="h-3 w-3" />,
};

const ACTION_COLORS: Record<string, string> = {
  'Création du dossier':    'bg-blue-500',
  'Mise à jour du dossier': 'bg-slate-500',
  'Paiement ajouté':        'bg-green-500',
  'Paiement supprimé':      'bg-red-500',
  'Fichier ajouté':         'bg-purple-500',
};

function formatDetails(details: Record<string, unknown> | null): string | null {
  if (!details) return null;
  // Show a human-readable summary instead of raw JSON
  const entries = Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const label = k === 'montant' ? 'Montant' :
                    k === 'date' ? 'Date' :
                    k === 'note' ? 'Note' :
                    k === 'nom' ? 'Fichier' :
                    k === 'taille' ? 'Taille' :
                    k === 'nom_fichier' ? 'Fichier' : k;
      return `${label}: ${v}`;
    });
  return entries.length > 0 ? entries.join(' · ') : null;
}

export function HistoryModal() {
  const { isHistoryModalOpen, closeHistoryModal } = useModalStore();
  const { selectedDossierIds, dossiers, historique } = useDataStore();

  const dossierId = selectedDossierIds[0];
  const dossier = dossiers.find((d) => d.id === dossierId);
  const dossierHistory = historique
    .filter((h) => h.dossier_id === dossierId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!dossier) return null;

  return (
    <Dialog open={isHistoryModalOpen} onOpenChange={closeHistoryModal}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique — {dossier.nom} ({dossier.id})</DialogTitle>
        </DialogHeader>

        {dossierHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <HistoryIcon className="mx-auto h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">Aucun historique pour ce dossier.</p>
            <p className="text-xs text-slate-600 mt-1">
              L'historique se crée automatiquement lors des modifications, paiements et uploads.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-0 pb-2">
            {dossierHistory.map((item, i) => {
              const dotColor = ACTION_COLORS[item.action] || 'bg-slate-500';
              const icon = ACTION_ICONS[item.action] || <HistoryIcon className="h-3 w-3" />;
              const details = formatDetails(item.details as Record<string, unknown> | null);

              return (
                <div key={item.id} className="relative pl-8 py-3">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[13px] top-4 flex h-6 w-6 items-center justify-center rounded-full ${dotColor} text-white ring-4 ring-slate-950`}>
                    {icon}
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-200">{item.action}</span>
                      <span className="text-xs font-mono text-slate-500">{formatDate(item.created_at)}</span>
                    </div>
                    {details && (
                      <p className="text-xs text-slate-400">{details}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
