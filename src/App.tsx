import { useState, useEffect } from 'react';
import { Sidebar, type Page } from '@/components/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { ImportPage } from '@/pages/ImportPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { QueuePage } from '@/pages/QueuePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LogsPage } from '@/pages/LogsPage';
import { ConnectPage } from '@/pages/ConnectPage';
import { TestPage } from '@/pages/TestPage';

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); setPage('projects'); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); setPage('queue'); }
      if (e.ctrlKey && e.key === 'r') { e.preventDefault(); setPage('projects'); }
      if (e.key === 'Escape') { /* safe stop — handled by engine */ }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar current={page} onNavigate={setPage} />
      <main className="flex-1 min-w-0">
        {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
        {page === 'import' && <ImportPage onNavigate={setPage} />}
        {page === 'projects' && <ProjectsPage onNavigate={setPage} />}
        {page === 'queue' && <QueuePage />}
        {page === 'settings' && <SettingsPage />}
        {page === 'logs' && <LogsPage />}
        {page === 'connect' && <ConnectPage />}
        {page === 'test' && <TestPage />}
      </main>
    </div>
  );
}

export default App;
