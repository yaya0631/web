import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../lib/formatters';
import { computeDossierStatus } from '../../lib/status';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';

export function RemindersModal() {
  const { isRemindersModalOpen, closeRemindersModal } = useModalStore();
  const { dossiers, paiements } = useDataStore();

  const paiementTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const p of paiements) {
      totals[p.dossier_id] = (totals[p.dossier_id] || 0) + p.montant;
    }
    return totals;
  }, [paiements]);

  const activeDossiers = dossiers.filter((d) => !d.archived && !d.in_trash);

  const overdueDossiers = activeDossiers.filter(
    (d) => computeDossierStatus(d, paiementTotals[d.id] || 0) === 'en_retard'
  );
  const dueSoonDossiers = activeDossiers.filter(
    (d) => computeDossierStatus(d, paiementTotals[d.id] || 0) === 'echeance_proche'
  );

  return (
    <Dialog open={isRemindersModalOpen} onOpenChange={closeRemindersModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Rappels et Échéances</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overdue */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-500 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Dossiers en retard ({overdueDossiers.length})
            </h3>
            {overdueDossiers.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 italic">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Aucun dossier en retard.
              </div>
            ) : (
              <div className="rounded-md border border-red-500/20 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-red-500/10 text-xs uppercase text-red-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">ID</th>
                      <th className="px-4 py-2 font-medium">Client</th>
                      <th className="px-4 py-2 font-medium">Endroit</th>
                      <th className="px-4 py-2 font-medium text-right">Date Finale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-500/10">
                    {overdueDossiers.map((d) => (
                      <tr key={d.id} className="hover:bg-red-500/5">
                        <td className="px-4 py-2 font-mono text-xs text-slate-300">{d.id}</td>
                        <td className="px-4 py-2 font-medium text-slate-200">{d.nom}</td>
                        <td className="px-4 py-2 text-slate-400">{d.endroit || '-'}</td>
                        <td className="px-4 py-2 font-mono text-right text-red-400">{formatDate(d.date_finale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Due soon */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-500 mb-3">
              <Clock className="h-4 w-4" />
              Échéances proches — 7 jours ({dueSoonDossiers.length})
            </h3>
            {dueSoonDossiers.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 italic">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Aucune échéance proche.
              </div>
            ) : (
              <div className="rounded-md border border-yellow-500/20 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-yellow-500/10 text-xs uppercase text-yellow-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">ID</th>
                      <th className="px-4 py-2 font-medium">Client</th>
                      <th className="px-4 py-2 font-medium">Endroit</th>
                      <th className="px-4 py-2 font-medium text-right">Date Finale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-500/10">
                    {dueSoonDossiers.map((d) => (
                      <tr key={d.id} className="hover:bg-yellow-500/5">
                        <td className="px-4 py-2 font-mono text-xs text-slate-300">{d.id}</td>
                        <td className="px-4 py-2 font-medium text-slate-200">{d.nom}</td>
                        <td className="px-4 py-2 text-slate-400">{d.endroit || '-'}</td>
                        <td className="px-4 py-2 font-mono text-right text-yellow-400">{formatDate(d.date_finale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
