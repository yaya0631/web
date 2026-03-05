import { Navbar } from '../components/layout/Navbar';
import { CommandBar } from '../components/layout/CommandBar';
import { FilterBar } from '../components/layout/FilterBar';
import { StatusBar } from '../components/layout/StatusBar';
import { Legend } from '../components/layout/Legend';
import { DossierTable } from '../components/table/DossierTable';
import { DetailSidebar } from '../components/sidebar/DetailSidebar';
import { MobileView } from '../components/mobile/MobileView';
import { useDataStore } from '../store/dataStore';
import { useEffect, useState } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export function MainPage() {
  const { selectedDossierIds } = useDataStore();
  const hasSelection = selectedDossierIds.length > 0;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <Navbar />
        <MobileView />
        <StatusBar />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Navbar />
      <CommandBar />
      <FilterBar />
      <div className="flex flex-1 overflow-hidden">
        <DossierTable />
        {hasSelection && <DetailSidebar />}
      </div>
      <Legend />
      <StatusBar />
    </div>
  );
}
