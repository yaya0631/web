import { statusColors, statusLabels } from '../../lib/status';
import { DossierEtat } from '../../types';

export function Legend() {
  const statuses: DossierEtat[] = [
    'en_retard',
    'echeance_proche',
    'solde_partiel',
    'termine',
    'en_attente',
    'bloque',
    'archive',
    'actif'
  ];

  return (
    <div className="flex h-6 shrink-0 items-center gap-4 border-t border-slate-800 bg-slate-950 px-4 text-[10px] font-medium uppercase tracking-wider text-slate-500">
      {statuses.map(status => (
        <div key={status} className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${statusColors[status].split(' ')[0]}`} />
          <span>{statusLabels[status]}</span>
        </div>
      ))}
    </div>
  );
}
