import { X, FileText, DollarSign, History, MapPin, Phone, Calendar, User, Archive, Trash2 } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useModalStore } from '../../store/modalStore';
import { Button } from '../ui/button';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { computeDossierStatus, statusColors, statusLabels } from '../../lib/status';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function DetailSidebar() {
  const { selectedDossierIds, dossiers, paiements, clearSelection, updateDossier } = useDataStore();
  const { openPaymentModal, openHistoryModal, openFilesModal } = useModalStore();

  if (selectedDossierIds.length !== 1) {
    return (
      <div className="w-80 shrink-0 border-l border-slate-800 bg-slate-900 p-4 flex flex-col items-center justify-center text-slate-500">
        <FileText className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm text-center">Sélectionnez un seul dossier pour voir les détails.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={clearSelection}>
          Désélectionner
        </Button>
      </div>
    );
  }

  const dossier = dossiers.find((d) => d.id === selectedDossierIds[0]);
  if (!dossier) return null;

  const dossierPayments = paiements.filter((p) => p.dossier_id === dossier.id);
  const totalEncaisse = dossierPayments.reduce((acc, p) => acc + p.montant, 0);
  const totalReste = dossier.montant - totalEncaisse;
  const status = computeDossierStatus(dossier, totalEncaisse);
  const colorClass = statusColors[status];

  const handleArchive = () => {
    updateDossier(dossier.id, { archived: true, date_archive: new Date().toISOString() });
    toast.success('Dossier archivé');
  };

  const handleTrash = () => {
    updateDossier(dossier.id, { in_trash: true });
    toast.success('Dossier mis à la corbeille');
    clearSelection();
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('Fiche Dossier', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Réf: ${dossier.id}`, 14, 30);

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const info = [
      ['Client', dossier.nom],
      ['Endroit', dossier.endroit || '-'],
      ['Téléphone', dossier.telephone || '-'],
      ['Date Finale', formatDate(dossier.date_finale)],
      ['État', statusLabels[status]],
      ['Montant Total', formatCurrency(dossier.montant)],
      ['Montant Encaissé', formatCurrency(totalEncaisse)],
      ['Reste à Payer', formatCurrency(Math.max(0, totalReste))],
      ['Acte', dossier.acte ? 'Oui' : 'Non'],
      ['Régularisation', dossier.regul ? 'Oui' : 'Non'],
      ['Agricole', dossier.agricole ? 'Oui' : 'Non'],
      ['Dépôt Cadastre', dossier.depot_cad || '-'],
      ['Dépôt Domain', dossier.depot_domain || '-'],
    ];

    autoTable(doc, {
      startY: 38,
      head: [['Champ', 'Valeur']],
      body: info,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    });

    if (dossier.observations) {
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text('Observations:', 14, finalY);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const lines = doc.splitTextToSize(dossier.observations, 180);
      doc.text(lines, 14, finalY + 7);
    }

    if (dossierPayments.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      autoTable(doc, {
        startY: finalY,
        head: [['Date', 'Montant', 'Note']],
        body: dossierPayments.map((p) => [formatDate(p.date), formatCurrency(p.montant), p.note || '-']),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
      });
    }

    doc.save(`dossier-${dossier.id}.pdf`);
    toast.success('PDF généré avec succès');
  };

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-slate-800 bg-slate-900 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h2 className="font-semibold text-slate-200">Détails du Dossier</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={clearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-5">
        {/* Status badge */}
        <div>
          <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', colorClass)}>
            {statusLabels[status]}
          </span>
        </div>

        {/* Client Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Informations Client</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="font-medium text-slate-200">{dossier.nom}</div>
                <div className="text-xs font-mono text-blue-400">{dossier.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-300">{dossier.endroit || '-'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-300">{dossier.telephone || '-'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-300">{formatDate(dossier.date_finale)}</span>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Finances</h3>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Montant Total</span>
              <span className="font-mono font-medium text-slate-200">{formatCurrency(dossier.montant)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Encaissé</span>
              <span className="font-mono font-medium text-green-400">{formatCurrency(totalEncaisse)}</span>
            </div>
            <div className="h-px bg-slate-800 my-1" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Reste</span>
              <span className={cn('font-mono font-medium', totalReste > 0 ? 'text-red-400' : 'text-green-400')}>
                {formatCurrency(Math.max(0, totalReste))}
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2 text-xs h-8" onClick={openPaymentModal}>
            <DollarSign className="h-3 w-3" />
            Gérer les paiements
          </Button>
        </div>

        {/* Files */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fichiers Joints</h3>
          <Button variant="secondary" className="w-full gap-2 text-xs h-8" onClick={openFilesModal}>
            <FileText className="h-3 w-3" />
            Gérer les fichiers
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Actions Rapides</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" className="h-8 text-xs gap-2" onClick={openHistoryModal}>
              <History className="h-3 w-3" />
              Historique
            </Button>
            <Button variant="secondary" size="sm" className="h-8 text-xs gap-2" onClick={handleGeneratePDF}>
              <FileText className="h-3 w-3" />
              Générer PDF
            </Button>
            {!dossier.archived && (
              <Button variant="secondary" size="sm" className="h-8 text-xs gap-2" onClick={handleArchive}>
                <Archive className="h-3 w-3" />
                Archiver
              </Button>
            )}
            {!dossier.in_trash && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-2 text-red-400 hover:text-red-300"
                onClick={handleTrash}
              >
                <Trash2 className="h-3 w-3" />
                Corbeille
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
