import { CSSProperties } from 'react';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import { useModalStore } from '../../store/modalStore';
import { useFilterStore } from '../../store/filterStore';
import { Dossier } from '../../types';
import { Checkbox } from '../ui/checkbox';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { computeDossierStatus, statusColors, statusLabels } from '../../lib/status';
import { cn } from '../../lib/utils';
import { Check, X, Edit2, Copy, DollarSign, FileText, History, Archive, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../ui/context-menu';

interface TableRowProps {
  dossier: Dossier;
  index: number;
  style: CSSProperties;
  totalPaiements: number;
}

function generateId(): string {
  return `D-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export function TableRow({ dossier, index, style, totalPaiements }: TableRowProps) {
  const { columnVisibility } = useAppStore();
  const { showRemaining } = useFilterStore();
  const { selectedDossierIds, toggleDossierSelection, setSelectedDossierIds, updateDossier, addDossier } =
    useDataStore();
  const { openDossierModal, openPaymentModal, openFilesModal, openHistoryModal } = useModalStore();

  const isSelected = selectedDossierIds.includes(dossier.id);
  const status = computeDossierStatus(dossier, totalPaiements);
  const colorClass = statusColors[status];

  const displayMontant = showRemaining
    ? Math.max(0, dossier.montant - totalPaiements)
    : dossier.montant;

  const handleContextMenu = () => {
    if (!isSelected) setSelectedDossierIds([dossier.id]);
  };

  const handleDoubleClick = () => {
    setSelectedDossierIds([dossier.id]);
    openDossierModal();
  };

  const handleDuplicate = () => {
    const newDossier: Dossier = {
      ...dossier,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addDossier(newDossier);
    toast.success('Dossier dupliqué avec succès');
  };

  const handleArchive = () => {
    updateDossier(dossier.id, { archived: true, date_archive: new Date().toISOString() });
    toast.success('Dossier archivé');
  };

  const handleTrash = () => {
    updateDossier(dossier.id, { in_trash: true });
    toast.success('Dossier mis à la corbeille');
  };

  const handleRestore = () => {
    updateDossier(dossier.id, { in_trash: false, archived: false, date_archive: null });
    toast.success('Dossier restauré');
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild onContextMenu={handleContextMenu}>
        <div
          style={style}
          className={cn(
            'flex items-center border-b border-slate-800/50 px-4 text-sm transition-colors hover:bg-slate-800/50 cursor-pointer',
            isSelected ? 'bg-slate-800' : index % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-950'
          )}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) toggleDossierSelection(dossier.id);
            else setSelectedDossierIds([dossier.id]);
          }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="w-10 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={() => toggleDossierSelection(dossier.id)} />
          </div>
          <div className="w-12 shrink-0 text-center font-mono text-xs text-slate-500">{index + 1}</div>

          {columnVisibility.id && (
            <div className="w-32 shrink-0 font-mono text-blue-400 text-xs truncate">{dossier.id}</div>
          )}
          {columnVisibility.nom && (
            <div className="w-48 shrink-0 truncate font-medium text-slate-200">{dossier.nom}</div>
          )}
          {columnVisibility.endroit && (
            <div className="w-40 shrink-0 truncate text-slate-400">{dossier.endroit || '-'}</div>
          )}
          {columnVisibility.telephone && (
            <div className="w-32 shrink-0 font-mono text-slate-400">{dossier.telephone || '-'}</div>
          )}
          {columnVisibility.date_finale && (
            <div className="w-32 shrink-0 font-mono text-slate-400">{formatDate(dossier.date_finale)}</div>
          )}
          {columnVisibility.montant && (
            <div className={cn('w-32 shrink-0 text-right font-mono', showRemaining ? 'text-red-400' : 'text-slate-300')}>
              {formatCurrency(displayMontant)}
            </div>
          )}
          {columnVisibility.acte && (
            <div className="w-20 shrink-0 flex justify-center">
              {dossier.acte ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-slate-600" />}
            </div>
          )}
          {columnVisibility.regul && (
            <div className="w-20 shrink-0 flex justify-center">
              {dossier.regul ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-slate-600" />}
            </div>
          )}
          {columnVisibility.agricole && (
            <div className="w-20 shrink-0 flex justify-center">
              {dossier.agricole ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-slate-600" />}
            </div>
          )}
          {columnVisibility.depot_cad && (
            <div className="w-32 shrink-0 text-slate-400">{dossier.depot_cad || '-'}</div>
          )}
          {columnVisibility.depot_domain && (
            <div className="w-32 shrink-0 text-slate-400">{dossier.depot_domain || '-'}</div>
          )}
          {columnVisibility.etat && (
            <div className="w-32 shrink-0">
              <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold', colorClass)}>
                {statusLabels[status]}
              </span>
            </div>
          )}
          {columnVisibility.observations && (
            <div className="flex-1 min-w-[200px] truncate text-slate-500">{dossier.observations || '-'}</div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={() => { setSelectedDossierIds([dossier.id]); openDossierModal(); }}>
          <Edit2 className="mr-2 h-4 w-4" />Modifier
          <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />Dupliquer
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => { setSelectedDossierIds([dossier.id]); openPaymentModal(); }}>
          <DollarSign className="mr-2 h-4 w-4" />Paiements
        </ContextMenuItem>
        <ContextMenuItem onClick={() => { setSelectedDossierIds([dossier.id]); openFilesModal(); }}>
          <FileText className="mr-2 h-4 w-4" />Fichiers
        </ContextMenuItem>
        <ContextMenuItem onClick={() => { setSelectedDossierIds([dossier.id]); openHistoryModal(); }}>
          <History className="mr-2 h-4 w-4" />Historique
        </ContextMenuItem>
        <ContextMenuSeparator />
        {(dossier.in_trash || dossier.archived) ? (
          <ContextMenuItem onClick={handleRestore} className="text-green-400 focus:text-green-400">
            <RotateCcw className="mr-2 h-4 w-4" />Restaurer
          </ContextMenuItem>
        ) : (
          <>
            <ContextMenuItem onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />Archiver
              <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleTrash} className="text-red-400 focus:text-red-400">
              <Trash2 className="mr-2 h-4 w-4" />Supprimer
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
