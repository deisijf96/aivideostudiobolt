import { useEffect, useState } from 'react';
import { LayoutDashboard, FolderPlus, ListOrdered, Settings, ScrollText, Plug, TestTube, Film } from 'lucide-react';
import { type ReactNode } from 'react';

export type Page = 'dashboard' | 'import' | 'projects' | 'queue' | 'settings' | 'logs' | 'connect' | 'test';

const NAV_ITEMS: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'import', label: 'Importar Projeto', icon: <FolderPlus size={20} /> },
  { id: 'projects', label: 'Projetos', icon: <Film size={20} /> },
  { id: 'queue', label: 'Fila de Produção', icon: <ListOrdered size={20} /> },
  { id: 'connect', label: 'Conectar Google Flow', icon: <Plug size={20} /> },
  { id: 'test', label: 'Teste do Flow', icon: <TestTube size={20} /> },
  { id: 'logs', label: 'Logs', icon: <ScrollText size={20} /> },
  { id: 'settings', label: 'Configurações', icon: <Settings size={20} /> },
];

export function Sidebar({ current, onNavigate }: { current: Page; onNavigate: (page: Page) => void }) {
  return (
    <aside className="w-64 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
            <Film size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">AI Video Flow</h1>
            <p className="text-xs text-slate-500 leading-tight">Automation</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              current === item.id
                ? 'bg-cyan-600/15 text-cyan-300 border border-cyan-700/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">Versão 1.0.0</p>
        <p className="text-xs text-slate-700 mt-1">Modo Navegador — V1</p>
      </div>
    </aside>
  );
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function TopBar({ title, children }: { title: string; children?: ReactNode }) {
  const time = useClock();
  return (
    <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="flex items-center gap-4">
        {children}
        <span className="text-sm text-slate-500 tabular-nums">
          {time.toLocaleTimeString('pt-BR')}
        </span>
      </div>
    </header>
  );
}
