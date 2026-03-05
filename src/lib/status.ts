import { isBefore, isWithinInterval, addDays, parseISO } from 'date-fns';
import { Dossier, DossierEtat } from '../types';

export function computeDossierStatus(dossier: Partial<Dossier>, totalPaiements: number = 0): DossierEtat {
  if (dossier.archived) return 'archive';
  if (dossier.etat === 'bloque') return 'bloque';
  if (dossier.etat === 'en_attente') return 'en_attente';
  if (dossier.etat === 'termine') return 'termine';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dossier.date_finale) {
    const deadline = parseISO(dossier.date_finale);
    if (isBefore(deadline, today)) {
      return 'en_retard';
    }
    if (isWithinInterval(deadline, { start: today, end: addDays(today, 7) })) {
      return 'echeance_proche';
    }
  }

  if (dossier.montant && totalPaiements > 0 && totalPaiements < dossier.montant) {
    return 'solde_partiel';
  }

  return 'actif';
}

export const statusColors: Record<DossierEtat, string> = {
  en_retard: 'bg-red-500/10 text-red-500 border-red-500/20',
  echeance_proche: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  solde_partiel: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  termine: 'bg-green-500/10 text-green-500 border-green-500/20',
  en_attente: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  bloque: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  archive: 'bg-slate-800 text-slate-500 border-slate-700',
  actif: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export const statusLabels: Record<DossierEtat, string> = {
  en_retard: 'En retard',
  echeance_proche: 'Échéance proche',
  solde_partiel: 'Solde partiel',
  termine: 'Terminé',
  en_attente: 'En attente',
  bloque: 'Bloqué',
  archive: 'Archivé',
  actif: 'Actif',
};
