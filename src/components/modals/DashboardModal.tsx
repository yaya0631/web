import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { formatCurrency } from '../../lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function DashboardModal() {
  const { isDashboardModalOpen, closeDashboardModal } = useModalStore();
  const { dossiers, paiements } = useDataStore();

  const activeDossiers = dossiers.filter(d => !d.archived && !d.in_trash);
  const overdueDossiers = dossiers.filter(d => d.etat === 'en_retard' && !d.archived && !d.in_trash);
  const completedDossiers = dossiers.filter(d => d.etat === 'termine' && !d.archived && !d.in_trash);

  const totalExpected = activeDossiers.reduce((acc, d) => acc + d.montant, 0);
  const totalCollected = paiements.reduce((acc, p) => acc + p.montant, 0);
  const totalRemaining = totalExpected - totalCollected;

  const statusData = [
    { name: 'Actifs', value: activeDossiers.length, color: '#3b82f6' },
    { name: 'En retard', value: overdueDossiers.length, color: '#ef4444' },
    { name: 'Terminés', value: completedDossiers.length, color: '#22c55e' },
  ];

  const locationData = activeDossiers.reduce((acc, d) => {
    const loc = d.endroit || 'Non spécifié';
    const existing = acc.find(item => item.name === loc);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: loc, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <Dialog open={isDashboardModalOpen} onOpenChange={closeDashboardModal}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Tableau de Bord</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400 mb-1">Total Dossiers</div>
            <div className="text-2xl font-mono font-medium text-slate-200">{dossiers.length}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400 mb-1">Dossiers Actifs</div>
            <div className="text-2xl font-mono font-medium text-blue-400">{activeDossiers.length}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400 mb-1">En Retard</div>
            <div className="text-2xl font-mono font-medium text-red-400">{overdueDossiers.length}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-400 mb-1">Terminés</div>
            <div className="text-2xl font-mono font-medium text-green-400">{completedDossiers.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400 mb-1">Total Attendu</div>
            <div className="text-xl font-mono font-medium text-slate-200">{formatCurrency(totalExpected)}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400 mb-1">Total Encaissé</div>
            <div className="text-xl font-mono font-medium text-green-400">{formatCurrency(totalCollected)}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-center">
            <div className="text-sm text-slate-400 mb-1">Reste à Payer</div>
            <div className="text-xl font-mono font-medium text-red-400">{formatCurrency(totalRemaining)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 h-64">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Répartition par État</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Top Endroits</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
