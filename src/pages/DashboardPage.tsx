import { useEffect, useState } from 'react';
import { Film, Download, AlertCircle, CheckCircle2, Loader2, Plus, Plug, Settings as SettingsIcon } from 'lucide-react';
import { TopBar, type Page } from '@/components/Sidebar';
import { Card, Button, ProgressBar, StatusBadge } from '@/components/ui';
import { getDashboardStats, fetchProjects } from '@/lib/projectService';
import { loadSettings } from '@/lib/settings';
import type { Project, AppSettings } from '@/lib/types';

export function DashboardPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [stats, setStats] = useState({ totalProjects: 0, totalScenes: 0, completedScenes: 0, failedScenes: 0, downloadedVideos: 0, processingScenes: 0 });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      const [s, projects, sett] = await Promise.all([
        getDashboardStats(),
        fetchProjects(),
        loadSettings(),
      ]);
      setStats(s);
      setRecentProjects(projects.slice(0, 5));
      setSettings(sett);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const flowConnected = settings?.simulation_mode ?? false;

  return (
    <div>
      <TopBar title="Dashboard">
        <Button variant="primary" size="sm" onClick={() => onNavigate('import')}>
          <Plus size={16} /> Novo Projeto
        </Button>
        <Button variant="default" size="sm" onClick={() => onNavigate('connect')}>
          <Plug size={16} /> Conectar Flow
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onNavigate('settings')}>
          <SettingsIcon size={16} />
        </Button>
      </TopBar>

      <div className="p-8 space-y-6">
        {/* Status banner */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className={`w-3 h-3 rounded-full ${flowConnected ? 'bg-emerald-500' : 'bg-slate-600'} animate-pulse`} />
          <span className="text-sm font-medium text-slate-300">
            {flowConnected ? 'Modo Simulação ativo — automação simulada para testes' : 'Google Flow não conectado'}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<Film size={20} />} label="Projetos" value={stats.totalProjects} color="text-cyan-400" />
          <StatCard icon={<Loader2 size={20} />} label="Cenas em Processo" value={stats.processingScenes} color="text-amber-400" />
          <StatCard icon={<CheckCircle2 size={20} />} label="Cenas Concluídas" value={stats.completedScenes} color="text-emerald-400" />
          <StatCard icon={<Download size={20} />} label="Vídeos Baixados" value={stats.downloadedVideos} color="text-teal-400" />
          <StatCard icon={<AlertCircle size={20} />} label="Erros" value={stats.failedScenes} color="text-red-400" />
          <StatCard icon={<Film size={20} />} label="Total de Cenas" value={stats.totalScenes} color="text-slate-400" />
        </div>

        {/* Progress bar */}
        {stats.totalScenes > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300">Progresso Geral</h3>
              <span className="text-sm text-slate-400 tabular-nums">{stats.completedScenes} / {stats.totalScenes}</span>
            </div>
            <ProgressBar value={stats.completedScenes} max={stats.totalScenes} />
          </Card>
        )}

        {/* Recent projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Projetos Recentes</h3>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Nenhum projeto importado ainda.</p>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition-colors cursor-pointer"
                    onClick={() => onNavigate('projects')}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.aspect_ratio} · {p.language}</p>
                    </div>
                    <StatusBadge status={p.status} label={projectStatusLabel(p.status)} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Status da Automação</h3>
            <div className="space-y-3">
              <AutomationRow label="Google Flow" connected={flowConnected} />
              <AutomationRow label="Navegador" connected={false} />
              <AutomationRow label="Modo Simulação" connected={settings?.simulation_mode ?? false} />
              <AutomationRow label="Modo Debug" connected={settings?.debug_mode ?? false} />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Última atividade: {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    </Card>
  );
}

function AutomationRow({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${connected ? 'text-emerald-400' : 'text-slate-600'}`}>
        {connected ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  );
}

function projectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'AGUARDANDO',
    processing: 'EM PRODUÇÃO',
    paused: 'PAUSADO',
    completed: 'CONCLUÍDO',
    failed: 'FALHOU',
  };
  return labels[status] ?? status.toUpperCase();
}
