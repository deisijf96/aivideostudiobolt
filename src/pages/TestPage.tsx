import { useEffect, useState } from 'react';
import { TestTube, Loader2, CheckCircle2, XCircle, Play, AlertCircle, Info } from 'lucide-react';
import { TopBar } from '@/components/Sidebar';
import { Card, Button, StatusBadge } from '@/components/ui';
import { loadSettings, saveSetting } from '@/lib/settings';
import { createProvider } from '@/lib/flowAdapter';
import { log } from '@/lib/logger';
import type { AppSettings, Scene } from '@/lib/types';

interface TestResult {
  step: string;
  label: string;
  status: 'idle' | 'running' | 'pass' | 'fail';
  detail?: string;
}

const TEST_STEPS: Omit<TestResult, 'status'>[] = [
  { step: 'page', label: 'Página carregada' },
  { step: 'login', label: 'Login detectado' },
  { step: 'editor', label: 'Editor detectado' },
  { step: 'prompt', label: 'Prompt detectado' },
  { step: 'image_gen', label: 'Geração de imagem detectada' },
  { step: 'result', label: 'Resultado disponível' },
  { step: 'video_gen', label: 'Geração de vídeo detectada' },
  { step: 'download', label: 'Download disponível' },
];

export function TestPage() {
  const [results, setResults] = useState<TestResult[]>(TEST_STEPS.map((s) => ({ ...s, status: 'idle' })));
  const [running, setRunning] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [singleSceneRunning, setSingleSceneRunning] = useState(false);
  const [singleSceneResult, setSingleSceneResult] = useState<string | null>(null);
  const [singleSceneLog, setSingleSceneLog] = useState<string[]>([]);

  useEffect(() => { loadSettings().then(setSettings); }, []);

  const isSimulation = settings?.simulation_mode ?? false;

  const handleEnableSimulation = async () => {
    await saveSetting('simulation_mode', true);
    const updated = await loadSettings();
    setSettings(updated);
  };

  const handleTestConnection = async () => {
    const sett = settings ?? await loadSettings();
    setSettings(sett);
    setRunning(true);
    setResults(TEST_STEPS.map((s) => ({ ...s, status: 'idle' })));

    const provider = createProvider(sett);

    const steps: { step: string; label: string; fn: () => Promise<boolean> }[] = [
      { step: 'page', label: 'Página carregada', fn: () => provider.detectPageLoaded() },
      { step: 'login', label: 'Login detectado', fn: () => provider.checkLogin() },
      { step: 'editor', label: 'Editor detectado', fn: () => provider.detectPageLoaded() },
      { step: 'prompt', label: 'Prompt detectado', fn: () => provider.detectPromptAvailable() },
      { step: 'image_gen', label: 'Geração de imagem detectada', fn: () => provider.detectImageGeneratorAvailable() },
      { step: 'result', label: 'Resultado disponível', fn: () => provider.detectResultAvailable() },
      { step: 'video_gen', label: 'Geração de vídeo detectada', fn: () => provider.detectVideoGeneratorAvailable() },
      { step: 'download', label: 'Download disponível', fn: () => provider.detectDownloadAvailable() },
    ];

    for (const step of steps) {
      setResults((prev) => prev.map((r) => r.step === step.step ? { ...r, status: 'running' } : r));
      try {
        const ok = await step.fn();
        setResults((prev) => prev.map((r) => r.step === step.step ? { ...r, status: ok ? 'pass' : 'fail', detail: ok ? undefined : 'Não detectado' } : r));
        await log(`Teste "${step.label}": ${ok ? 'OK' : 'Falhou'}`, { level: ok ? 'info' : 'warn' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro';
        setResults((prev) => prev.map((r) => r.step === step.step ? { ...r, status: 'fail', detail: msg } : r));
        await log(`Teste "${step.label}" falhou: ${msg}`, { level: 'error' });
      }
    }

    setRunning(false);
  };

  const handleTestSingleScene = async () => {
    setSingleSceneRunning(true);
    setSingleSceneResult(null);
    setSingleSceneLog([]);

    const sett = settings ?? await loadSettings();
    const provider = createProvider(sett);
    const mockScene: Scene = {
      id: 'test-single', project_id: 'test', scene_number: 1, title: 'Cena de Teste',
      image_prompt: 'Uma menina encontrando um cachorro na chuva, estilo cinematográfico',
      animation_prompt: 'A menina se aproxima do cachorro, movimento suave da câmera',
      reference_image_path: null, image_status: 'pending', video_status: 'pending',
      download_status: 'pending', image_path: null, video_path: null,
      error_message: null, attempts: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };

    const addLog = (msg: string) => {
      setSingleSceneLog((prev) => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`]);
    };

    try {
      addLog('Abrindo navegador...');
      await provider.open();
      addLog('Navegador aberto. Verificando login...');
      await provider.checkLogin();
      addLog('Login OK. Enviando prompt de imagem...');
      await provider.generateImage(mockScene, mockScene.image_prompt!);
      addLog('Prompt enviado. Aguardando geração da imagem...');
      await provider.waitForImage(mockScene);
      addLog('Imagem gerada. Selecionando resultado...');
      await provider.selectGeneratedImage(mockScene);
      addLog('Imagem selecionada. Enviando prompt de animação...');
      await provider.generateVideo(mockScene, mockScene.animation_prompt!);
      addLog('Prompt de animação enviado. Aguardando geração do vídeo...');
      await provider.waitForVideo(mockScene);
      addLog('Vídeo gerado. Iniciando download...');
      const path = await provider.downloadVideo(mockScene);
      addLog('Download concluído.');
      setSingleSceneResult(`Cena de teste concluída com sucesso. Arquivo: ${path}`);
      await log('Teste de cena única concluído', { level: 'info' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setSingleSceneResult(`Erro: ${msg}`);
      addLog(`ERRO: ${msg}`);
      await log(`Erro no teste de cena única: ${msg}`, { level: 'error' });
    }

    setSingleSceneRunning(false);
  };

  const allPassed = results.every((r) => r.status === 'pass');
  const anyFailed = results.some((r) => r.status === 'fail');

  return (
    <div>
      <TopBar title="Teste do Google Flow" />
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        {!isSimulation && (
          <Card className="p-5 border-amber-800/40 bg-amber-950/10">
            <div className="flex items-start gap-3">
              <AlertCircle size={22} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-200">Modo Simulação não está ativado</p>
                <p className="text-xs text-slate-400 mt-1">
                  A automação real do navegador (Playwright) só funciona na versão desktop do aplicativo.
                  Para testar a interface e o fluxo completo aqui, ative o Modo Simulação.
                </p>
                <Button variant="primary" size="sm" className="mt-3" onClick={handleEnableSimulation}>
                  Ativar Modo Simulação
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TestTube size={22} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Testar Conexão</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Verifica se o Google Flow está acessível e se os elementos da interface foram detectados.
          </p>

          <Button variant="primary" onClick={handleTestConnection} disabled={running}>
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Testar Conexão
          </Button>

          <div className="mt-5 space-y-2">
            {results.map((r) => (
              <div key={r.step} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-800/40">
                <div className="flex items-center gap-3">
                  {r.status === 'running' && <Loader2 size={16} className="animate-spin text-cyan-400" />}
                  {r.status === 'pass' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  {r.status === 'fail' && <XCircle size={16} className="text-red-400" />}
                  {r.status === 'idle' && <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
                  <span className="text-sm text-slate-300">{r.label}</span>
                </div>
                {r.detail && <span className="text-xs text-red-400 max-w-xs text-right">{r.detail}</span>}
              </div>
            ))}
          </div>

          {!running && results.some((r) => r.status !== 'idle') && (
            <div className="mt-4">
              {allPassed ? (
                <StatusBadge status="completed" label="TODOS OS TESTES PASSARAM" />
              ) : anyFailed ? (
                <StatusBadge status="failed" label="ALGUNS TESTES FALHARAM" />
              ) : null}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Play size={22} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">Testar Uma Única Cena</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Executa o fluxo completo (imagem → vídeo → download) para uma cena de teste antes de processar o projeto inteiro.
          </p>

          <Button variant="primary" onClick={handleTestSingleScene} disabled={singleSceneRunning}>
            {singleSceneRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Testar Cena
          </Button>

          {singleSceneLog.length > 0 && (
            <div className="mt-4 rounded-lg bg-slate-950 border border-slate-800 p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
              {singleSceneLog.map((entry, i) => (
                <div key={i} className={entry.startsWith('[') && entry.includes('ERRO') ? 'text-red-400' : 'text-slate-300'}>
                  {entry}
                </div>
              ))}
            </div>
          )}

          {singleSceneResult && (
            <div className={`mt-4 p-4 rounded-lg border ${singleSceneResult.startsWith('Erro') ? 'border-red-800/40 bg-red-950/10' : 'border-emerald-800/40 bg-emerald-950/10'}`}>
              <p className={`text-sm ${singleSceneResult.startsWith('Erro') ? 'text-red-300' : 'text-emerald-300'}`}>
                {singleSceneResult}
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-cyan-400" />
            <h4 className="text-sm font-semibold text-slate-300">Sobre os Testes</h4>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> Os testes verificam a detecção de elementos da interface do Flow.</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> No modo simulação, todos os testes passam automaticamente.</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> Na versão desktop, os testes usam o navegador real via Playwright.</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span> Se a interface do Flow mudou, os testes podem falhar — indicando que os seletores precisam de atualização.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
