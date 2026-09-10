import { useEffect, useState } from 'react';
import { ListOrdered, Play, Pause, Square, SkipForward, RotateCcw, AlertTriangle } from 'lucide-react';
import { TopBar } from '@/components/Sidebar';
import { Card, Button, StatusBadge, EmptyState } from '@/components/ui';
import { fetchProjects, fetchScenes, fetchQueueItems, updateQueueItem, updateScene } from '@/lib/projectService';
import { getStatusLabel } from '@/lib/statusMessages';
import type { Project, Scene, QueueItem } from '@/lib/types';

export function QueuePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setSelectedId(data[0].id);
    });
  }, []);

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

  const sceneMap = new Map(scenes.map((s) => [s.id, s]));

  const handleSkip = async (item: QueueItem) => {
    await updateQueueItem(item.id, { status: 'skipped' });
    await updateScene(item.scene_id, { image_status: 'skipped', video_status: 'skipped', download_status: 'skipped' });
    const [s, q] = await Promise.all([fetchScenes(selectedId!), fetchQueueItems(selectedId!)]);
    setScenes(s); setQueue(q);
  };

  const handleRetry = async (item: QueueItem) => {
    await updateQueueItem(item.id, { status: 'pending', attempts: 0, error: null });
    await updateScene(item.scene_id, { image_status: 'pending', video_status: 'pending', download_status: 'pending', error_message: null });
    const [s, q] = await Promise.all([fetchScenes(selectedId!), fetchQueueItems(selectedId!)]);
    setScenes(s); setQueue(q);
  };

  if (projects.length === 0) {
    return (
      <div>
        <TopBar title="Fila de Produção" />
        <div className="p-8">
          <Card className="p-8">
            <EmptyState icon={<ListOrdered size={48} />} title="Nenhuma fila disponível" description="Importe um projeto para criar a fila de produção." />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Fila de Produção" />
      <div className="p-8 space-y-6">
        {/* Project selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Projeto:</label>
          <select
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {/* Queue controls */}
        <div className="flex items-center gap-2">
          <Button variant="success" size="sm"><Play size={14} /> Iniciar</Button>
          <Button variant="default" size="sm"><Pause size={14} /> Pausar</Button>
          <Button variant="default" size="sm"><RotateCcw size={14} /> Continuar</Button>
          <Button variant="danger" size="sm"><Square size={14} /> Parar</Button>
        </div>

        {/* Queue table */}
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">ORDEM</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">CENA</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">ETAPA ATUAL</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">TENTATIVAS</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">STATUS</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item, idx) => {
                const scene = sceneMap.get(item.scene_id);
                const hasError = item.status === 'failed';
                return (
                  <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-slate-400">{String(idx + 1).padStart(2, '0')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-mono text-cyan-400">{String(scene?.scene_number ?? 0).padStart(3, '0')}</span>
                        <span className="text-sm text-slate-300 ml-2">{scene?.title ?? 'Sem título'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{item.current_step ? getStatusLabel(item.current_step as never) : '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-slate-400 tabular-nums">{item.attempts} / {item.max_attempts}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={item.status} label={getStatusLabel(item.status as never)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRetry(item)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Reiniciar cena"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          onClick={() => handleSkip(item)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors"
                          title="Pular cena"
                        >
                          <SkipForward size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Error items */}
        {queue.filter((q) => q.status === 'failed').length > 0 && (
          <Card className="p-5 border-red-800/40">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-400" />
              <h4 className="text-sm font-semibold text-red-300">Cenas com Erro</h4>
            </div>
            <div className="space-y-2">
              {queue.filter((q) => q.status === 'failed').map((item) => {
                const scene = sceneMap.get(item.scene_id);
                return (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2 rounded-lg bg-red-950/20 border border-red-900/30">
                    <div>
                      <span className="text-sm font-medium text-red-200">Cena {String(scene?.scene_number ?? 0).padStart(3, '0')}</span>
                      {item.error && <span className="text-xs text-red-400 ml-3">{item.error}</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRetry(item)}>
                      <RotateCcw size={14} /> Tentar novamente
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
