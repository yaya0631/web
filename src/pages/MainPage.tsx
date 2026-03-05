import { Navbar } from '../components/layout/Navbar';
import { CommandBar } from '../components/layout/CommandBar';
import { FilterBar } from '../components/layout/FilterBar';
import { StatusBar } from '../components/layout/StatusBar';
import { Legend } from '../components/layout/Legend';
import { DossierTable } from '../components/table/DossierTable';
import { DetailSidebar } from '../components/sidebar/DetailSidebar';
import { useDataStore } from '../store/dataStore';

export function MainPage() {
  const { selectedDossierIds } = useDataStore();
  const hasSelection = selectedDossierIds.length > 0;

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
