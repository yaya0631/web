import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { formatCurrency, formatDate } from '../../lib/formatters';

const paymentSchema = z.object({
  date: z.string().min(1, 'La date est requise'),
  montant: z.number().min(1, 'Le montant doit être supérieur à 0'),
  note: z.string().nullable(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function PaymentModal() {
  const { isPaymentModalOpen, closePaymentModal } = useModalStore();
  const { selectedDossierIds, dossiers, paiements, addPaiement, deletePaiement } = useDataStore();
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dossierId = selectedDossierIds[0];
  const dossier = dossiers.find((d) => d.id === dossierId);
  const dossierPayments = paiements
    .filter((p) => p.dossier_id === dossierId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalEncaisse = dossierPayments.reduce((acc, p) => acc + p.montant, 0);
  const totalAttendu = dossier?.montant || 0;
  const totalReste = totalAttendu - totalEncaisse;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      montant: totalReste > 0 ? totalReste : 0,
      note: '',
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    if (!dossierId) return;
    try {
      await addPaiement({
        dossier_id: dossierId,
        date: data.date,
        montant: data.montant,
        note: data.note || null,
      });
      toast.success('Paiement ajouté avec succès');
      setIsAdding(false);
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        montant: Math.max(0, totalReste - data.montant),
        note: '',
      });
    } catch {
      // error already toasted in store
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePaiement(id);
      toast.success('Paiement supprimé');
    } catch {
      // error already toasted
    } finally {
      setDeletingId(null);
    }
  };

  if (!dossier) return null;

  return (
    <Dialog open={isPaymentModalOpen} onOpenChange={closePaymentModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paiements — {dossier.nom} ({dossier.id})</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400 mb-1">Total Attendu</div>
            <div className="text-xl font-mono font-medium text-slate-200">{formatCurrency(totalAttendu)}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400 mb-1">Total Encaissé</div>
            <div className="text-xl font-mono font-medium text-green-400">{formatCurrency(totalEncaisse)}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400 mb-1">Reste à Payer</div>
            <div className={`text-xl font-mono font-medium ${totalReste > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(Math.max(0, totalReste))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-slate-300">Historique des paiements</h3>
          {!isAdding && (
            <Button size="sm" onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un paiement
            </Button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit(onSubmit)} className="mb-6 rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-3 space-y-1">
                <label className="text-xs text-slate-400">Date</label>
                <Input type="date" {...register('date')} className="h-8 text-sm" />
                {errors.date && <span className="text-xs text-red-500">{errors.date.message}</span>}
              </div>
              <div className="col-span-3 space-y-1">
                <label className="text-xs text-slate-400">Montant (DA)</label>
                <Input type="number" step="0.01" {...register('montant', { valueAsNumber: true })} className="h-8 text-sm" />
                {errors.montant && <span className="text-xs text-red-500">{errors.montant.message}</span>}
              </div>
              <div className="col-span-4 space-y-1">
                <label className="text-xs text-slate-400">Note (optionnelle)</label>
                <Input {...register('note')} className="h-8 text-sm" />
              </div>
              <div className="col-span-2 flex items-end gap-2 h-[52px]">
                <Button type="submit" size="sm" className="h-8 flex-1" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter'}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setIsAdding(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="rounded-md border border-slate-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Montant</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dossierPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Aucun paiement enregistré pour ce dossier.
                  </td>
                </tr>
              ) : (
                dossierPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-mono text-slate-300">{formatDate(payment.date)}</td>
                    <td className="px-4 py-3 font-mono text-right text-green-400">{formatCurrency(payment.montant)}</td>
                    <td className="px-4 py-3 text-slate-400">{payment.note || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-400"
                        onClick={() => handleDelete(payment.id)}
                        disabled={deletingId === payment.id}
                      >
                        {deletingId === payment.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
