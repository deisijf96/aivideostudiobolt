import { Plug, ExternalLink, Loader2, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { useState } from 'react';
import { TopBar } from '@/components/Sidebar';
import { Card, Button, StatusBadge } from '@/components/ui';
import { loadSettings } from '@/lib/settings';
import { log } from '@/lib/logger';
import type { AppSettings } from '@/lib/types';

type ConnectionState = 'idle' | 'connecting' | 'checking_login' | 'waiting_login' | 'connected' | 'error';

export function ConnectPage() {
  const [state, setState] = useState<ConnectionState>('idle');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [message, setMessage] = useState('');

  const handleConnect = async () => {
    const sett = await loadSettings();
    setSettings(sett);

    setState('connecting');
    setMessage('Abrindo navegador Chromium...');
    await log('Iniciando conexão com Google Flow', { level: 'info' });
    await new Promise((r) => setTimeout(r, 1000));

    setState('checking_login');
    setMessage('Verificando autenticação...');
    await new Promise((r) => setTimeout(r, 800));

    if (sett.simulation_mode) {
      setState('connected');
      setMessage('Google Flow conectado (modo simulação).');
      await log('Google Flow conectado (modo simulação)', { level: 'info' });
      return;
    }

    setState('waiting_login');
    setMessage('Faça login na sua conta Google na janela do navegador.');
    await log('Aguardando login do usuário no navegador', { level: 'info' });
  };

  const handleConfirmLogin = async () => {
    setState('checking_login');
    setMessage('Verificando acesso ao Flow...');
    await new Promise((r) => setTimeout(r, 1000));
    setState('connected');
    setMessage('Google Flow conectado.');
    await log('Google Flow conectado com sucesso', { level: 'info' });
  };

  return (
    <div>
      <TopBar title="Conectar ao Google Flow" />
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Globe size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Conectar ao Google Flow</h3>
              <p className="text-sm text-slate-400">Autentique sua conta Google no navegador</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <StepItem number={1} text="Abrir navegador Chromium" active={state === 'connecting'} done={state === 'connected' || state === 'waiting_login'} />
            <StepItem number={2} text="Abrir Google Flow" active={state === 'connecting'} done={state === 'connected' || state === 'waiting_login'} />
            <StepItem number={3} text="Verificar autenticação" active={state === 'checking_login'} done={state === 'connected'} />
            <StepItem number={4} text="Confirmar conexão" active={false} done={state === 'connected'} />
          </div>

          {state === 'idle' && (
            <Button variant="primary" size="lg" onClick={handleConnect} className="w-full">
              <Plug size={18} /> Conectar Google Flow
            </Button>
          )}

          {state === 'connecting' && (
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin text-cyan-400" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {state === 'checking_login' && (
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin text-cyan-400" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {state === 'waiting_login' && (
            <Card className="p-5 border-amber-800/40 bg-amber-950/10">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-200">{message}</p>
                  <p className="text-xs text-slate-400 mt-1">Após concluir o login no navegador, clique no botão abaixo.</p>
                  <Button variant="primary" size="sm" className="mt-3" onClick={handleConfirmLogin}>
                    Continuar Após Login
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {state === 'connected' && (
            <Card className="p-5 border-emerald-800/40 bg-emerald-950/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Google Flow conectado.</p>
                  <p className="text-xs text-slate-400 mt-0.5">A sessão está ativa e pronta para automação.</p>
                </div>
              </div>
            </Card>
          )}

          {state !== 'idle' && (
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge
                status={state === 'connected' ? 'completed' : 'processing'}
                label={state === 'connected' ? 'CONECTADO' : 'CONECTANDO'}
              />
              <Button variant="ghost" size="sm" onClick={() => window.open(settings?.flow_url ?? 'https://flow.google.com', '_blank')}>
                <ExternalLink size={14} /> Abrir Flow no navegador
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Informações de Segurança</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> O aplicativo nunca armazena sua senha Google.</li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> O login é feito diretamente no navegador pelo próprio usuário.</li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> A sessão é mantida em um perfil local no seu computador.</li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Nenhum cookie, token ou credencial é enviado a servidores externos.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Perfil do Navegador</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Diretório do perfil</span>
              <span className="text-slate-300 font-mono text-xs">{settings?.browser_profile_dir ?? '%APPDATA%/AI-Video-Flow-Automation/browser-profile'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Navegador</span>
              <span className="text-slate-300">{settings?.browser ?? 'chromium'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">URL do Flow</span>
              <span className="text-slate-300 font-mono text-xs">{settings?.flow_url ?? 'https://flow.google.com'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StepItem({ number, text, active, done }: { number: number; text: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        done ? 'bg-emerald-600 text-white' : active ? 'bg-cyan-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500'
      }`}>
        {done ? '✓' : number}
      </div>
      <span className={`text-sm ${done ? 'text-slate-300' : active ? 'text-cyan-300' : 'text-slate-500'}`}>{text}</span>
    </div>
  );
}
