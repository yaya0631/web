import { Database, Wifi, WifiOff } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { formatCurrency } from '../../lib/formatters';
import { useMemo } from 'react';

export function StatusBar() {
  const { isOnline, dossiers, paiements } = useDataStore();

  const stats = useMemo(() => {
    const totalActifs = dossiers.filter((d) => !d.archived && !d.in_trash).length;
    const totalArchives = dossiers.filter((d) => d.archived && !d.in_trash).length;
    const totalCorbeille = dossiers.filter((d) => d.in_trash).length;
    const totalAttendu = dossiers
      .filter((d) => !d.in_trash)
      .reduce((acc, d) => acc + (d.montant || 0), 0);
    const totalEncaisse = paiements.reduce((acc, p) => acc + (p.montant || 0), 0);
    const totalReste = totalAttendu - totalEncaisse;
    return { totalActifs, totalArchives, totalCorbeille, totalAttendu, totalEncaisse, totalReste };
  }, [dossiers, paiements]);

  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950 px-4 text-xs font-mono text-slate-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
            {isOnline ? 'Connecté' : 'Hors ligne'}
          </span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          <span>{dossiers.length} Enregistrements</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <span>Actifs: {stats.totalActifs}</span>
        <span>Archives: {stats.totalArchives}</span>
        <span>Corbeille: {stats.totalCorbeille}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Attendu:</span>
          <span className="font-medium text-slate-300">{formatCurrency(stats.totalAttendu)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Encaissé:</span>
          <span className="font-medium text-green-400">{formatCurrency(stats.totalEncaisse)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Reste:</span>
          <span className="font-medium text-red-400">{formatCurrency(stats.totalReste)}</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <span>v1.0.0</span>
      </div>
    </div>
  );
}
