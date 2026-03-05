import { create } from 'zustand';
import { Dossier, Paiement, Fichier, Historique } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const STORAGE_BUCKET = 'dossier-files';

interface DataState {
  dossiers: Dossier[];
  isLoadingDossiers: boolean;
  fetchDossiers: () => Promise<void>;
  setDossiers: (dossiers: Dossier[]) => void;
  addDossier: (dossier: Dossier) => Promise<void>;
  updateDossier: (id: string, fields: Partial<Dossier>) => Promise<void>;
  removeDossier: (id: string) => Promise<void>;

  paiements: Paiement[];
  fetchPaiements: () => Promise<void>;
  setPaiements: (paiements: Paiement[]) => void;
  addPaiement: (data: Omit<Paiement, 'id' | 'created_at'>) => Promise<void>;
  deletePaiement: (id: string) => Promise<void>;

  fichiers: Fichier[];
  fetchFichiers: () => Promise<void>;
  setFichiers: (fichiers: Fichier[]) => void;
  uploadFichier: (file: File, dossierId: string) => Promise<void>;
  deleteFichier: (id: string, storagePath: string) => Promise<void>;

  historique: Historique[];
  fetchHistorique: () => Promise<void>;
  setHistorique: (historique: Historique[]) => void;

  selectedDossierIds: string[];
  setSelectedDossierIds: (ids: string[]) => void;
  toggleDossierSelection: (id: string) => void;
  clearSelection: () => void;

  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('User not authenticated');
  return data.user.id;
}

async function logHistory(
  dossierId: string,
  userId: string,
  action: string,
  details: Record<string, unknown>
) {
  await supabase.from('historique').insert([
    { dossier_id: dossierId, user_id: userId, action, details },
  ]);
}

export const useDataStore = create<DataState>((set, get) => ({
  dossiers: [],
  isLoadingDossiers: false,

  fetchDossiers: async () => {
    set({ isLoadingDossiers: true });
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ dossiers: data || [] });
    } catch (error: any) {
      console.error('Error fetching dossiers:', error);
      toast.error('Erreur lors du chargement des dossiers');
    } finally {
      set({ isLoadingDossiers: false });
    }
  },

  setDossiers: (dossiers) => set({ dossiers }),

  addDossier: async (dossier) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('dossiers')
        .insert([{ ...dossier, user_id: userId }])
        .select();
      if (error) throw error;
      set((state) => ({ dossiers: [data[0], ...state.dossiers] }));
      await logHistory(dossier.id, userId, 'Création du dossier', dossier as any);
    } catch (error: any) {
      console.error('Error adding dossier:', error);
      toast.error('Erreur lors de la création du dossier');
      throw error;
    }
  },

  updateDossier: async (id, updatedFields) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('dossiers')
        .update({ ...updatedFields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      if (error) throw error;
      set((state) => ({
        dossiers: state.dossiers.map((d) => (d.id === id ? data[0] : d)),
      }));
      await logHistory(id, userId, 'Mise à jour du dossier', updatedFields as any);
    } catch (error: any) {
      console.error('Error updating dossier:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  },

  removeDossier: async (id) => {
    try {
      const { error } = await supabase.from('dossiers').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        dossiers: state.dossiers.filter((d) => d.id !== id),
        selectedDossierIds: state.selectedDossierIds.filter((sid) => sid !== id),
      }));
    } catch (error: any) {
      console.error('Error deleting dossier:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  },

  paiements: [],

  fetchPaiements: async () => {
    try {
      const { data, error } = await supabase
        .from('paiements')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      set({ paiements: data || [] });
    } catch (error: any) {
      console.error('Error fetching paiements:', error);
    }
  },

  setPaiements: (paiements) => set({ paiements }),

  addPaiement: async (paiementData) => {
    try {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('paiements')
        .insert([{ ...paiementData, user_id: userId }])
        .select();
      if (error) throw error;
      set((state) => ({ paiements: [data[0], ...state.paiements] }));
      await logHistory(paiementData.dossier_id, userId, 'Paiement ajouté', {
        montant: paiementData.montant,
        date: paiementData.date,
        note: paiementData.note,
      });
    } catch (error: any) {
      console.error('Error adding paiement:', error);
      toast.error("Erreur lors de l'ajout du paiement");
      throw error;
    }
  },

  deletePaiement: async (id) => {
    try {
      const paiement = get().paiements.find((p) => p.id === id);
      const { error } = await supabase.from('paiements').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ paiements: state.paiements.filter((p) => p.id !== id) }));
      if (paiement) {
        const userId = await getUserId();
        await logHistory(paiement.dossier_id, userId, 'Paiement supprimé', {
          montant: paiement.montant,
        });
      }
    } catch (error: any) {
      console.error('Error deleting paiement:', error);
      toast.error('Erreur lors de la suppression du paiement');
      throw error;
    }
  },

  fichiers: [],

  fetchFichiers: async () => {
    try {
      const { data, error } = await supabase.from('fichiers').select('*');
      if (error) throw error;
      set({ fichiers: data || [] });
    } catch (error: any) {
      console.error('Error fetching fichiers:', error);
    }
  },

  setFichiers: (fichiers) => set({ fichiers }),

  uploadFichier: async (file, dossierId) => {
    try {
      const userId = await getUserId();
      const ext = file.name.split('.').pop();
      const storagePath = `${userId}/${dossierId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('fichiers')
        .insert([{
          dossier_id: dossierId,
          user_id: userId,
          nom_fichier: file.name,
          storage_path: storagePath,
          taille: file.size,
          type_mime: file.type || null,
          uploaded_at: new Date().toISOString(),
        }])
        .select();
      if (error) throw error;

      set((state) => ({ fichiers: [...state.fichiers, data[0]] }));
      await logHistory(dossierId, userId, 'Fichier ajouté', { nom: file.name, taille: file.size });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Erreur upload. Vérifiez que le bucket 'dossier-files' existe dans Supabase Storage.");
      throw error;
    }
  },

  deleteFichier: async (id, storagePath) => {
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      const { error } = await supabase.from('fichiers').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ fichiers: state.fichiers.filter((f) => f.id !== id) }));
    } catch (error: any) {
      console.error('Error deleting fichier:', error);
      toast.error('Erreur lors de la suppression du fichier');
      throw error;
    }
  },

  historique: [],

  fetchHistorique: async () => {
    try {
      const { data, error } = await supabase
        .from('historique')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ historique: data || [] });
    } catch (error: any) {
      console.error('Error fetching historique:', error);
    }
  },

  setHistorique: (historique) => set({ historique }),

  selectedDossierIds: [],
  setSelectedDossierIds: (ids) => set({ selectedDossierIds: ids }),
  toggleDossierSelection: (id) =>
    set((state) => ({
      selectedDossierIds: state.selectedDossierIds.includes(id)
        ? state.selectedDossierIds.filter((sid) => sid !== id)
        : [...state.selectedDossierIds, id],
    })),
  clearSelection: () => set({ selectedDossierIds: [] }),

  isOnline: navigator.onLine,
  setIsOnline: (isOnline) => set({ isOnline }),
}));
