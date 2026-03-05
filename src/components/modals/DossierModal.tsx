import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { Dossier, DossierEtat } from '../../types';

const dossierSchema = z.object({
  id: z.string().min(1, 'ID est requis'),
  nom: z.string().min(1, 'Nom est requis'),
  endroit: z.string().nullable(),
  telephone: z.string().nullable(),
  date_finale: z.string().nullable(),
  montant: z.number().min(0, 'Le montant doit être positif'),
  acte: z.boolean(),
  regul: z.boolean(),
  agricole: z.boolean(),
  depot_cad: z.enum(['Depose', 'Non depose', 'Depose 2eme fois']).nullable(),
  depot_domain: z.string().nullable(),
  etat: z.enum(['actif', 'termine', 'bloque', 'en_attente', 'en_retard', 'echeance_proche', 'solde_partiel', 'archive']),
  observations: z.string().nullable(),
});

type DossierFormValues = z.infer<typeof dossierSchema>;

export function DossierModal() {
  const { isDossierModalOpen, closeDossierModal } = useModalStore();
  const { selectedDossierIds, dossiers, addDossier, updateDossier } = useDataStore();

  const isEditing = selectedDossierIds.length === 1;
  const selectedDossier = isEditing ? dossiers.find(d => d.id === selectedDossierIds[0]) : null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DossierFormValues>({
    resolver: zodResolver(dossierSchema),
    defaultValues: {
      id: `D-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
      nom: '',
      endroit: '',
      telephone: '',
      date_finale: '',
      montant: 0,
      acte: false,
      regul: false,
      agricole: false,
      depot_cad: null,
      depot_domain: '',
      etat: 'actif',
      observations: '',
    },
  });

  useEffect(() => {
    if (isDossierModalOpen) {
      if (isEditing && selectedDossier) {
        reset({
          id: selectedDossier.id,
          nom: selectedDossier.nom,
          endroit: selectedDossier.endroit || '',
          telephone: selectedDossier.telephone || '',
          date_finale: selectedDossier.date_finale ? selectedDossier.date_finale.split('T')[0] : '',
          montant: selectedDossier.montant,
          acte: selectedDossier.acte,
          regul: selectedDossier.regul,
          agricole: selectedDossier.agricole,
          depot_cad: selectedDossier.depot_cad,
          depot_domain: selectedDossier.depot_domain || '',
          etat: selectedDossier.etat,
          observations: selectedDossier.observations || '',
        });
      } else {
        reset({
          id: `D-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
          nom: '',
          endroit: '',
          telephone: '',
          date_finale: '',
          montant: 0,
          acte: false,
          regul: false,
          agricole: false,
          depot_cad: null,
          depot_domain: '',
          etat: 'actif',
          observations: '',
        });
      }
    }
  }, [isDossierModalOpen, isEditing, selectedDossier, reset]);

  const onSubmit = async (data: DossierFormValues) => {
    try {
      const dossierData: Dossier = {
        ...data,
        endroit: data.endroit || null,
        telephone: data.telephone || null,
        date_finale: data.date_finale || null,
        depot_domain: data.depot_domain || null,
        observations: data.observations || null,
        archived: data.etat === 'archive',
        in_trash: false,
        date_archive: data.etat === 'archive' ? new Date().toISOString() : null,
        created_at: isEditing && selectedDossier ? selectedDossier.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isEditing && selectedDossier) {
        updateDossier(selectedDossier.id, dossierData);
        toast.success('Dossier mis à jour avec succès');
      } else {
        addDossier(dossierData);
        toast.success('Dossier créé avec succès');
      }
      closeDossierModal();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du dossier');
    }
  };

  return (
    <Dialog open={isDossierModalOpen} onOpenChange={closeDossierModal}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le Dossier' : 'Nouveau Dossier'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">ID Dossier</label>
              <Input {...register('id')} disabled={isEditing} />
              {errors.id && <p className="text-xs text-red-500">{errors.id.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Nom du Client *</label>
              <Input {...register('nom')} />
              {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Endroit</label>
              <Input {...register('endroit')} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Téléphone</label>
              <Input {...register('telephone')} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Date Finale</label>
              <Input type="date" {...register('date_finale')} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Montant (DA)</label>
              <Input type="number" step="0.01" {...register('montant', { valueAsNumber: true })} />
              {errors.montant && <p className="text-xs text-red-500">{errors.montant.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Dépôt Cadastre</label>
              <Select {...register('depot_cad')}>
                <option value="">Sélectionner...</option>
                <option value="Depose">Déposé</option>
                <option value="Non depose">Non déposé</option>
                <option value="Depose 2eme fois">Déposé 2ème fois</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Dépôt Domain</label>
              <Input {...register('depot_domain')} />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-xs font-medium text-slate-400">État</label>
              <Select {...register('etat')}>
                <option value="actif">Actif</option>
                <option value="en_attente">En attente</option>
                <option value="bloque">Bloqué</option>
                <option value="termine">Terminé</option>
                <option value="archive">Archivé</option>
              </Select>
            </div>

            <div className="col-span-2 flex gap-6 p-4 bg-slate-900 rounded-md border border-slate-800">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="acte" 
                  checked={watch('acte')} 
                  onCheckedChange={(checked) => setValue('acte', checked as boolean)} 
                />
                <label htmlFor="acte" className="text-sm font-medium text-slate-300">Acte</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="regul" 
                  checked={watch('regul')} 
                  onCheckedChange={(checked) => setValue('regul', checked as boolean)} 
                />
                <label htmlFor="regul" className="text-sm font-medium text-slate-300">Régularisation</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="agricole" 
                  checked={watch('agricole')} 
                  onCheckedChange={(checked) => setValue('agricole', checked as boolean)} 
                />
                <label htmlFor="agricole" className="text-sm font-medium text-slate-300">Agricole</label>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-xs font-medium text-slate-400">Observations</label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                {...register('observations')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDossierModal}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
