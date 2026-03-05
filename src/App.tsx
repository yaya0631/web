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
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Persist the "reminders shown" flag in sessionStorage so tab switches don't reset it
const REMINDERS_SHOWN_KEY = 'geoman_reminders_shown';

export default function App() {
  const { fetchDossiers, fetchPaiements, fetchFichiers, fetchHistorique } = useDataStore();
  const { theme, showRemindersOnStartup } = useAppStore();
  const { openRemindersModal } = useModalStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        // Clear reminders flag on fresh login so it shows once per session
        sessionStorage.removeItem(REMINDERS_SHOWN_KEY);
      }
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset link in their email
        setIsPasswordReset(true);
      }
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

  // Show reminders modal ONCE per browser session (survives tab switches)
  useEffect(() => {
    if (session && showRemindersOnStartup && !sessionStorage.getItem(REMINDERS_SHOWN_KEY)) {
      sessionStorage.setItem(REMINDERS_SHOWN_KEY, '1');
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

  // Password reset flow — user arrived via the email link
  if (isPasswordReset) {
    return (
      <>
        <ResetPasswordPage onDone={() => setIsPasswordReset(false)} />
        <Toaster theme="dark" position="bottom-right" />
      </>
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
