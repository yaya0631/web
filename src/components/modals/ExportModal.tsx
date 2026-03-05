import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { computeDossierStatus, statusLabels } from '../../lib/status';
import { Dossier } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

type ExportFormat = 'pdf' | 'csv';
type ExportScope = 'all' | 'selected';

const COLUMN_LABELS: Record<string, string> = {
  id: 'ID Dossier',
  nom: 'Nom Client',
  endroit: 'Endroit',
  telephone: 'Téléphone',
  date_finale: 'Date Finale',
  montant: 'Montant (DA)',
  acte: 'Acte',
  regul: 'Régul',
  agricole: 'Agricole',
  depot_cad: 'Dépôt CAD',
  depot_domain: 'Dépôt Domain',
  etat: 'État',
  observations: 'Observations',
};

function dossierToRow(d: Dossier, totalPaiements: number): Record<string, string> {
  return {
    id: d.id,
    nom: d.nom,
    endroit: d.endroit || '',
    telephone: d.telephone || '',
    date_finale: formatDate(d.date_finale),
    montant: formatCurrency(d.montant),
    acte: d.acte ? 'Oui' : 'Non',
    regul: d.regul ? 'Oui' : 'Non',
    agricole: d.agricole ? 'Oui' : 'Non',
    depot_cad: d.depot_cad || '',
    depot_domain: d.depot_domain || '',
    etat: statusLabels[computeDossierStatus(d, totalPaiements)],
    observations: d.observations || '',
  };
}

export function ExportModal() {
  const { isExportModalOpen, closeExportModal } = useModalStore();
  const { dossiers, selectedDossierIds, paiements } = useDataStore();
  const { columnVisibility } = useAppStore();

  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [onlyVisibleCols, setOnlyVisibleCols] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const paiementTotals: Record<string, number> = {};
  for (const p of paiements) {
    paiementTotals[p.dossier_id] = (paiementTotals[p.dossier_id] || 0) + p.montant;
  }

  const getExportDossiers = (): Dossier[] => {
    if (exportScope === 'selected' && selectedDossierIds.length > 0) {
      return dossiers.filter((d) => selectedDossierIds.includes(d.id));
    }
    return dossiers.filter((d) => !d.in_trash);
  };

  const getColumns = (): string[] => {
    const allCols = Object.keys(COLUMN_LABELS);
    return onlyVisibleCols ? allCols.filter((col) => columnVisibility[col]) : allCols;
  };

  const exportToPDF = (exportDossiers: Dossier[], columns: string[]) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('GeoMan — Export Dossiers', 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')} • ${exportDossiers.length} dossier(s)`,
      14,
      23
    );

    const headers = columns.map((col) => COLUMN_LABELS[col]);
    const rows = exportDossiers.map((d) => {
      const row = dossierToRow(d, paiementTotals[d.id] || 0);
      return columns.map((col) => row[col]);
    });

    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: rows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: [148, 163, 184], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`geoman-export-${Date.now()}.pdf`);
  };

  const exportToCSV = (exportDossiers: Dossier[], columns: string[]) => {
    const data = exportDossiers.map((d) => {
      const row = dossierToRow(d, paiementTotals[d.id] || 0);
      const filtered: Record<string, string> = {};
      for (const col of columns) filtered[COLUMN_LABELS[col]] = row[col];
      return filtered;
    });

    const csv = Papa.unparse(data, { delimiter: ';' });
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility with French chars
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geoman-export-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportDossiers = getExportDossiers();
      const columns = getColumns();

      if (exportDossiers.length === 0) {
        toast.error('Aucun dossier à exporter');
        return;
      }

      if (exportFormat === 'pdf') {
        exportToPDF(exportDossiers, columns);
      } else {
        exportToCSV(exportDossiers, columns);
      }

      toast.success(`Export ${exportFormat.toUpperCase()} de ${exportDossiers.length} dossier(s) généré`);
      closeExportModal();
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isExportModalOpen} onOpenChange={closeExportModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter les données</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Format d'exportation</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${
                  exportFormat === 'pdf'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
                onClick={() => setExportFormat('pdf')}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">Document PDF</span>
              </button>
              <button
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 transition-colors ${
                  exportFormat === 'csv'
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
                onClick={() => setExportFormat('csv')}
              >
                <Table className="h-6 w-6" />
                <span className="text-sm font-medium">Excel (CSV)</span>
              </button>
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Portée</h3>
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="text-blue-500"
                />
                <span className="text-sm text-slate-300">
                  Tous les dossiers ({dossiers.filter((d) => !d.in_trash).length})
                </span>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer ${selectedDossierIds.length === 0 ? 'opacity-40' : ''}`}>
                <input
                  type="radio"
                  name="exportScope"
                  checked={exportScope === 'selected'}
                  onChange={() => setExportScope('selected')}
                  disabled={selectedDossierIds.length === 0}
                  className="text-blue-500"
                />
                <span className="text-sm text-slate-300">
                  Dossiers sélectionnés ({selectedDossierIds.length})
                </span>
              </label>
            </div>
          </div>

          {/* Columns */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="visible-cols"
              checked={onlyVisibleCols}
              onCheckedChange={(v) => setOnlyVisibleCols(v as boolean)}
            />
            <label htmlFor="visible-cols" className="text-sm text-slate-400 cursor-pointer">
              N'exporter que les colonnes visibles
            </label>
          </div>

          <Button className="w-full gap-2" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Exportation en cours...</>
            ) : (
              <><Download className="h-4 w-4" />Exporter</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
