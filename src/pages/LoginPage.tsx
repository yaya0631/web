import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'login' | 'signup' | 'reset';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [resetSent, setResetSent] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/web/`,
        });
        if (error) throw error;
        setResetSent(true);
        toast.success('Email de réinitialisation envoyé !');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Compte créé avec succès ! Vous êtes maintenant connecté.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Connexion réussie');
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">GeoMan</h2>
          <p className="text-sm text-slate-400">
            {mode === 'login' && 'Connectez-vous à votre compte'}
            {mode === 'signup' && 'Créez votre compte'}
            {mode === 'reset' && 'Réinitialiser le mot de passe'}
          </p>
        </div>

        {resetSent ? (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
            <p className="text-sm text-green-400">
              Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
            </p>
            <button
              className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              onClick={() => { setResetSent(false); setMode('login'); }}
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800"
                />
              </div>

              {mode !== 'reset' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300" htmlFor="password">
                      Mot de passe
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Chargement...'
                : mode === 'login' ? 'Se connecter'
                : mode === 'signup' ? 'Créer le compte'
                : 'Envoyer le lien de réinitialisation'}
            </Button>

            <div className="flex flex-col items-center gap-2 text-center">
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Pas encore de compte ? Créer un compte
                </button>
              )}
              {mode === 'signup' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Déjà un compte ? Se connecter
                </button>
              )}
              {mode === 'reset' && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Retour à la connexion
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
