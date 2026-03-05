import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { formatCurrency } from '../../lib/formatters';
import { computeDossierStatus } from '../../lib/status';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  'Actif':           '#3b82f6',
  'En retard':       '#ef4444',
  'Échéance proche': '#f59e0b',
  'Solde partiel':   '#a855f7',
  'Terminé':         '#22c55e',
  'En attente':      '#64748b',
  'Bloqué':          '#f97316',
};

export function DashboardModal() {
  const { isDashboardModalOpen, closeDashboardModal } = useModalStore();
  const { dossiers, paiements } = useDataStore();

  const paiementTotals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const p of paiements) t[p.dossier_id] = (t[p.dossier_id] || 0) + p.montant;
    return t;
  }, [paiements]);

  const activeDossiers = dossiers.filter((d) => !d.in_trash);

  // Compute real status for each dossier using computeDossierStatus
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of activeDossiers) {
      const status = computeDossierStatus(d, paiementTotals[d.id] || 0);
      const label =
        status === 'actif' ? 'Actif' :
        status === 'en_retard' ? 'En retard' :
        status === 'echeance_proche' ? 'Échéance proche' :
        status === 'solde_partiel' ? 'Solde partiel' :
        status === 'termine' ? 'Terminé' :
        status === 'en_attente' ? 'En attente' :
        status === 'bloque' ? 'Bloqué' :
        status === 'archive' ? 'Archivé' : 'Actif';
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || '#64748b' }))
      .sort((a, b) => b.value - a.value);
  }, [activeDossiers, paiementTotals]);

  const locationData = useMemo(() =>
    activeDossiers
      .filter((d) => !d.archived && !d.in_trash)
      .reduce((acc, d) => {
        const loc = d.endroit || 'Non spécifié';
        const existing = acc.find((i) => i.name === loc);
        if (existing) existing.value += 1;
        else acc.push({ name: loc, value: 1 });
        return acc;
      }, [] as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
    [activeDossiers]);

  const totalExpected = activeDossiers
    .filter((d) => !d.archived && !d.in_trash)
    .reduce((acc, d) => acc + (d.montant || 0), 0);
  const totalCollected = paiements.reduce((acc, p) => acc + (p.montant || 0), 0);
  const totalRemaining = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const overdueCount = statusCounts.find((s) => s.name === 'En retard')?.value || 0;
  const dueSoonCount = statusCounts.find((s) => s.name === 'Échéance proche')?.value || 0;
  const doneCount = statusCounts.find((s) => s.name === 'Terminé')?.value || 0;

  return (
    <Dialog open={isDashboardModalOpen} onOpenChange={closeDashboardModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tableau de Bord</DialogTitle>
        </DialogHeader>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400 mb-1">Total Dossiers</div>
            <div className="text-2xl font-mono font-bold text-slate-200">{dossiers.length}</div>
            <div className="text-xs text-slate-500 mt-1">dont {dossiers.filter(d=>d.in_trash).length} en corbeille</div>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="text-xs text-slate-400 mb-1">En Retard</div>
            <div className="text-2xl font-mono font-bold text-red-400">{overdueCount}</div>
            <div className="text-xs text-slate-500 mt-1">{dueSoonCount} échéances proches</div>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <div className="text-xs text-slate-400 mb-1">Terminés</div>
            <div className="text-2xl font-mono font-bold text-green-400">{doneCount}</div>
            <div className="text-xs text-slate-500 mt-1">sur {activeDossiers.filter(d=>!d.in_trash&&!d.archived).length} actifs</div>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-xs text-slate-400 mb-1">Taux Encaissement</div>
            <div className="text-2xl font-mono font-bold text-blue-400">{collectionRate}%</div>
            <div className="text-xs text-slate-500 mt-1">{paiements.length} paiement(s)</div>
          </div>
        </div>

        {/* Finance row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-xs text-slate-400 mb-1">Total Attendu</div>
            <div className="text-lg font-mono font-bold text-slate-200">{formatCurrency(totalExpected)}</div>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-center">
            <div className="text-xs text-slate-400 mb-1">Total Encaissé</div>
            <div className="text-lg font-mono font-bold text-green-400">{formatCurrency(totalCollected)}</div>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
            <div className="text-xs text-slate-400 mb-1">Reste à Payer</div>
            <div className="text-lg font-mono font-bold text-red-400">{formatCurrency(totalRemaining)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 h-72">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Répartition par État</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="40%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Dossiers par Endroit (Top 6)</h3>
            <div className="flex-1">
              {locationData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                  Aucune donnée de localisation
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', fontSize: 12 }}
                      formatter={(v) => [`${v} dossier(s)`, '']}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
