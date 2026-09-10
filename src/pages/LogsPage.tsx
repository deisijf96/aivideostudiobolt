import { useEffect, useState } from 'react';
import { ScrollText, Trash2, Download } from 'lucide-react';
import { TopBar } from '@/components/Sidebar';
import { Card, Button, EmptyState } from '@/components/ui';
import { fetchLogs, clearLogs } from '@/lib/logger';
import { fetchProjects } from '@/lib/projectService';
import type { Project } from '@/lib/types';

export function LogsPage() {
  const [logs, setLogs] = useState<{ id: string; level: string; message: string; technical_details: string | null; category: string | null; created_at: string; scene_id: string | null }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

  const loadLogs = async () => {
    const data = await fetchLogs(selectedProject || undefined, 200);
    setLogs(data);
  };

  useEffect(() => {
    fetchProjects().then((data) => setProjects(data));
  }, []);

  useEffect(() => {
    loadLogs();
    const id = setInterval(loadLogs, 3000);
    return () => clearInterval(id);
  }, [selectedProject]);

  const handleClear = async () => {
    if (confirm('Limpar todos os logs?')) {
      await clearLogs(selectedProject || undefined);
      loadLogs();
    }
  };

  const handleExport = () => {
    const text = logs.map((l) => `[${new Date(l.created_at).toLocaleString('pt-BR')}] [${l.level.toUpperCase()}] ${l.message}${l.technical_details ? `\n  ${l.technical_details}` : ''}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const levelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-amber-400';
      case 'debug': return 'text-slate-500';
      default: return 'text-slate-300';
    }
  };

  return (
    <div>
      <TopBar title="Logs">
        <Button variant="ghost" size="sm" onClick={handleExport}><Download size={14} /> Exportar</Button>
        <Button variant="ghost" size="sm" onClick={handleClear}><Trash2 size={14} /> Limpar</Button>
      </TopBar>
      <div className="p-8 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Projeto:</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {logs.length === 0 ? (
          <Card className="p-8">
            <EmptyState icon={<ScrollText size={48} />} title="Nenhum log registrado" description="Os logs de automação aparecerão aqui quando o processamento começar." />
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto font-mono text-xs">
              {logs.map((entry) => (
                <div key={entry.id} className="flex gap-3 px-4 py-2 border-b border-slate-800/40 hover:bg-slate-800/30">
                  <span className="text-slate-600 shrink-0 tabular-nums">
                    {new Date(entry.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                  <span className={`shrink-0 font-semibold uppercase ${levelColor(entry.level)}`}>
                    {entry.level}
                  </span>
                  {entry.category && (
                    <span className="shrink-0 text-slate-500 text-[10px] mt-0.5">{entry.category}</span>
                  )}
                  <span className="text-slate-300">{entry.message}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
