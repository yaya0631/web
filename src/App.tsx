import { Toaster } from 'sonner';
import { MainPage } from './pages/MainPage';
import { LoginPage } from './pages/LoginPage';
import { useDataStore } from './store/dataStore';
import { useAppStore } from './store/appStore';
import { useEffect, useState } from 'react';
import { DossierModal } from './components/modals/DossierModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { DashboardModal } from './components/modals/DashboardModal';
import { RemindersModal } from './components/modals/RemindersModal';
import { FilesModal } from './components/modals/FilesModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ExportModal } from './components/modals/ExportModal';
import { useModalStore } from './store/modalStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const { fetchDossiers, fetchPaiements, fetchFichiers, fetchHistorique } = useDataStore();
  const { theme, showRemindersOnStartup } = useAppStore();
  const { openRemindersModal } = useModalStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useKeyboardShortcuts();

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Online/offline detection
  useEffect(() => {
    const { setIsOnline } = useDataStore.getState();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchDossiers();
      fetchPaiements();
      fetchFichiers();
      fetchHistorique();
    }
  }, [session, fetchDossiers, fetchPaiements, fetchFichiers, fetchHistorique]);

  // Show reminders modal on startup if enabled
  useEffect(() => {
    if (session && showRemindersOnStartup) {
      const timer = setTimeout(() => openRemindersModal(), 800);
      return () => clearTimeout(timer);
    }
  }, [session, showRemindersOnStartup, openRemindersModal]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LoginPage />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

  return (
    <>
      <MainPage />
      <DossierModal />
      <PaymentModal />
      <FilesModal />
      <HistoryModal />
      <DashboardModal />
      <RemindersModal />
      <SettingsModal />
      <ExportModal />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}
