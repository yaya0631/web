export type DossierEtat = 'actif' | 'termine' | 'bloque' | 'en_attente' | 'en_retard' | 'echeance_proche' | 'solde_partiel' | 'archive';

export interface Dossier {
  id: string;
  nom: string;
  endroit: string | null;
  telephone: string | null;
  date_finale: string | null;
  montant: number;
  acte: boolean;
  regul: boolean;
  agricole: boolean;
  depot_cad: 'Depose' | 'Non depose' | 'Depose 2eme fois' | null;
  depot_domain: string | null;
  etat: DossierEtat;
  observations: string | null;
  archived: boolean;
  in_trash: boolean;
  date_archive: string | null;
  created_at: string;
  updated_at: string;
}

export interface Paiement {
  id: string;
  dossier_id: string;
  date: string;
  montant: number;
  note: string | null;
  created_at: string;
}

export interface Fichier {
  id: string;
  dossier_id: string;
  nom_fichier: string;
  storage_path: string;
  taille: number | null;
  type_mime: string | null;
  uploaded_at: string;
}

export interface Historique {
  id: string;
  dossier_id: string;
  action: string;
  details: any;
  created_at: string;
}
