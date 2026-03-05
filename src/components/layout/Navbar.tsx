import { FolderOpen, Settings, LogOut, Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useModalStore } from '../../store/modalStore';
import { useFilterStore } from '../../store/filterStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';

export function Navbar() {
  const { openSettingsModal } = useModalStore();
  // searchQuery is shared with FilterBar via filterStore
  const { searchQuery, setSearchQuery } = useFilterStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // If FilterBar has a query, keep search open
  useEffect(() => {
    if (searchQuery) setSearchOpen(true);
  }, [searchQuery]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error('Erreur lors de la déconnexion');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
      <div className="flex items-center gap-2 text-blue-500">
        <FolderOpen className="h-5 w-5" />
        <span className="font-bold tracking-tight text-slate-100">GeoMan</span>
      </div>

      <div className="flex items-center gap-2">
        {searchOpen && (
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un dossier..."
              className="h-8 w-64 bg-slate-900 text-sm pr-8"
              onKeyDown={(e) => e.key === 'Escape' && handleClearSearch()}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={handleClearSearch}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${searchOpen ? 'text-blue-400' : 'text-slate-400'}`}
          onClick={() => searchOpen ? handleClearSearch() : setSearchOpen(true)}
          title="Rechercher (Ctrl+F)"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400"
          onClick={openSettingsModal}
          title="Paramètres"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-slate-800 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-400"
          onClick={handleLogout}
          title="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
