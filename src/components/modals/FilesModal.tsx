import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, UploadCloud, File as FileIcon, Image as ImageIcon, FileText, Loader2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useModalStore } from '../../store/modalStore';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../lib/formatters';
import { supabase } from '../../lib/supabase';

const STORAGE_BUCKET = 'dossier-files';

export function FilesModal() {
  const { isFilesModalOpen, closeFilesModal } = useModalStore();
  const { selectedDossierIds, dossiers, fichiers, uploadFichier, deleteFichier } = useDataStore();
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dossierId = selectedDossierIds[0];
  const dossier = dossiers.find((d) => d.id === dossierId);
  const dossierFiles = fichiers.filter((f) => f.dossier_id === dossierId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !dossierId) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFichier(file, dossierId);
      }
      toast.success(`${files.length} fichier(s) uploadé(s)`);
    } catch {
      // error already toasted
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    setDeletingId(id);
    try {
      await deleteFichier(id, storagePath);
      toast.success('Fichier supprimé');
    } catch {
      // error already toasted
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (storagePath: string, nomFichier: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomFichier;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileIcon className="h-5 w-5 text-slate-400" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-400" />;
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-400" />;
    return <FileIcon className="h-5 w-5 text-slate-400" />;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!dossier) return null;

  return (
    <Dialog open={isFilesModalOpen} onOpenChange={closeFilesModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fichiers — {dossier.nom} ({dossier.id})</DialogTitle>
        </DialogHeader>

        <div className="mb-6 rounded-lg border border-slate-800 border-dashed bg-slate-900/50 p-8 text-center relative">
          <UploadCloud className="mx-auto h-10 w-10 text-slate-500 mb-4" />
          <p className="text-sm text-slate-300 mb-2">Glissez-déposez vos fichiers ici ou</p>
          <div className="relative inline-block">
            <Button variant="secondary" size="sm" disabled={isUploading}>
              {isUploading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Upload en cours...</>
              ) : (
                'Parcourir les fichiers'
              )}
            </Button>
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Nécessite le bucket <code className="text-blue-400">'dossier-files'</code> dans Supabase Storage
          </p>
        </div>

        <div className="rounded-md border border-slate-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium w-10"></th>
                <th className="px-4 py-3 font-medium">Nom du fichier</th>
                <th className="px-4 py-3 font-medium">Taille</th>
                <th className="px-4 py-3 font-medium">Date d'ajout</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dossierFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Aucun fichier joint à ce dossier.
                  </td>
                </tr>
              ) : (
                dossierFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 text-center">{getFileIcon(file.type_mime)}</td>
                    <td className="px-4 py-3 font-medium text-slate-200 truncate max-w-[200px]">
                      {file.nom_fichier}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{formatSize(file.taille)}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{formatDate(file.uploaded_at)}</td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-400"
                        onClick={() => handleDownload(file.storage_path, file.nom_fichier)}
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-400"
                        onClick={() => handleDelete(file.id, file.storage_path)}
                        disabled={deletingId === file.id}
                        title="Supprimer"
                      >
                        {deletingId === file.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
