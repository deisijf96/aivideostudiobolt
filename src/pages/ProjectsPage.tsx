import { useEffect, useState } from 'react';
import { Film, ChevronRight, Trash2, Download, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { TopBar, type Page } from '@/components/Sidebar';
import { Card, Button, StatusBadge, StatusIcon, ProgressBar, EmptyState } from '@/components/ui';
import { fetchProjects, fetchScenes, fetchQueueItems, deleteProject, exportProject, updateProject } from '@/lib/projectService';
import { loadSettings } from '@/lib/settings';
import { createProvider } from '@/lib/flowAdapter';
import { AutomationEngine, type EngineEvent } from '@/lib/automationEngine';
import { log } from '@/lib/logger';
import type { Project, Scene, QueueItem, AppSettings } from '@/lib/types';
import { getStatusLabel } from '@/lib/statusMessages';

export function ProjectsPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [engine, setEngine] = useState<AutomationEngine | null>(null);
  const [running, setRunning] = useState(false);
  const [liveScenes, setLiveScenes] = useState<Record<string, string>>({});

  const loadProjects = async () => {
    const data = await fetchProjects();
    setProjects(data);
    if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
  };

  useEffect(() => { loadProjects(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    const load = async () => {
      const [s, q] = await Promise.all([fetchScenes(selectedId), fetchQueueItems(selectedId)]);
      setScenes(s);
      setQueue(q);
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [selectedId]);

  useEffect(() => { loadSettings().then(setSettings); }, []);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;

  const handleStart = async () => {
    if (!selectedProject || !settings) return;
    const provider = createProvider(settings);
    const eng = new AutomationEngine(provider, settings);

    eng.on((event: EngineEvent) => {
      if (event.type === 'scene_status') {
        setLiveScenes((prev) => ({ ...prev, [event.sceneId]: event.message }));
      }
      if (event.type === 'project_complete') {
        setRunning(false);
        loadProjects();
      }
      if (event.type === 'error') {
        setRunning(false);
      }
    });

    setEngine(eng);
    setRunning(true);
    await updateProject(selectedProject.id, { status: 'processing' });
    const currentScenes = await fetchScenes(selectedProject.id);
    const currentQueue = await fetchQueueItems(selectedProject.id);
    setScenes(currentScenes);
    await eng.processQueue(selectedProject.id, currentScenes, currentQueue);
    loadProjects();
  };

  const handlePause = () => { engine?.pause(); setRunning(false); };
  const handleResume = () => { engine?.resume(); setRunning(true); };
  const handleStop = () => {
    if (confirm('Tem certeza que deseja interromper a produção?')) {
      engine?.stop();
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    if (confirm(`Excluir o projeto "${selectedProject.title}"? Esta ação não pode ser desfeita.`)) {
      await deleteProject(selectedProject.id);
      setSelectedId(null);
      loadProjects();
    }
  };

  const handleExport = async () => {
    if (!selectedProject) return;
    const data = await exportProject(selectedProject.id);
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedProject.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (projects.length === 0) {
    return (
      <div>
        <TopBar title="Projetos" />
        <div className="p-8">
          <Card className="p-8">
            <EmptyState
              icon={<Film size={48} />}
              title="Nenhum projeto importado"
              description="Importe um projeto do AI Video Studio para começar a automação."
            />
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => onNavigate('import')}>Importar Projeto</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const completedCount = scenes.filter((s) => s.download_status === 'completed').length;

  return (
    <div>
      <TopBar title="Projetos" />
      <div className="flex h-[calc(100vh-65px)]">
        {/* Project list */}
        <div className="w-72 shrink-0 border-r border-slate-800 overflow-y-auto p-3 space-y-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedId === p.id ? 'bg-cyan-600/15 border border-cyan-700/30' : 'hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200 truncate">{p.title}</span>
                <ChevronRight size={14} className="text-slate-600 shrink-0" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{p.aspect_ratio} · {p.language}</p>
            </button>
          ))}
        </div>

        {/* Project detail */}
        {selectedProject && (
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedProject.title}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-slate-400">{scenes.length} cenas</span>
                  <span className="text-sm text-slate-400">{selectedProject.aspect_ratio}</span>
                  <span className="text-sm text-slate-400">{selectedProject.visual_style ?? 'N/A'}</span>
                  <span className="text-sm text-slate-400">{selectedProject.language}</span>
                  <StatusBadge status={selectedProject.status} label={getStatusLabel(selectedProject.status as never)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleExport}><Download size={14} /> Exportar</Button>
                <Button variant="ghost" size="sm" onClick={handleDelete}><Trash2 size={14} /> Excluir</Button>
              </div>
            </div>

            {/* Progress */}
            {scenes.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-300">Progresso da Produção</h4>
                  <span className="text-sm text-slate-400 tabular-nums">{completedCount} / {scenes.length}</span>
                </div>
                <ProgressBar value={completedCount} max={scenes.length} />
              </Card>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2">
              {!running ? (
                <Button variant="success" onClick={handleStart}><Play size={16} /> Iniciar Produção</Button>
              ) : (
                <Button variant="default" onClick={handlePause}><Pause size={16} /> Pausar</Button>
              )}
              {running && <Button variant="danger" onClick={handleStop}>Parar</Button>}
              {!running && <Button variant="ghost" onClick={handleResume}><Play size={16} /> Continuar</Button>}
              <Button variant="ghost"><SkipForward size={16} /> Pular Cena</Button>
              <Button variant="ghost"><RotateCcw size={16} /> Reprocessar</Button>
            </div>

            {/* Scene table */}
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">CENA</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">TÍTULO</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">IMAGEM</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">VÍDEO</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">DOWNLOAD</th>
                    <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {scenes.map((scene) => {
                    const liveMsg = liveScenes[scene.id];
                    return (
                      <tr key={scene.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-cyan-400">{String(scene.scene_number).padStart(3, '0')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-200">{scene.title ?? 'Sem título'}</span>
                        </td>
                        <td className="px-4 py-3 text-center"><StatusIcon status={scene.image_status} /></td>
                        <td className="px-4 py-3 text-center"><StatusIcon status={scene.video_status} /></td>
                        <td className="px-4 py-3 text-center"><StatusIcon status={scene.download_status} /></td>
                        <td className="px-4 py-3 text-center">
                          {liveMsg ? (
                            <span className="text-xs text-amber-300">{liveMsg}</span>
                          ) : (
                            <StatusBadge status={scene.download_status} label={getStatusLabel(scene.download_status)} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* Production map */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Mapa de Produção</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {scenes.map((scene) => (
                  <Card key={scene.id} className="p-4">
                    <p className="text-xs font-mono text-cyan-400 mb-2">CENA {String(scene.scene_number).padStart(3, '0')}</p>
                    <p className="text-xs text-slate-400 truncate mb-3">{scene.title ?? 'Sem título'}</p>
                    <div className="space-y-1.5">
                      <MapRow label="Imagem" status={scene.image_status} />
                      <MapRow label="Vídeo" status={scene.video_status} />
                      <MapRow label="Download" status={scene.download_status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MapRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <StatusIcon status={status} />
    </div>
  );
}
