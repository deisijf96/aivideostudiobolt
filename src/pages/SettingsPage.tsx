import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';
import { TopBar } from '@/components/Sidebar';
import { Card, Button } from '@/components/ui';
import { loadSettings, saveSettings } from '@/lib/settings';
import { DEFAULT_SETTINGS, type AppSettings, type AutomationMode, type SelectionMode, type BrowserType } from '@/lib/types';
import { log } from '@/lib/logger';

type Section = 'flow' | 'browser' | 'downloads' | 'automation' | 'timeouts' | 'attempts' | 'logs' | 'interface' | 'advanced';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'flow', label: 'Google Flow' },
  { id: 'browser', label: 'Navegador' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'automation', label: 'Automação' },
  { id: 'timeouts', label: 'Timeouts' },
  { id: 'attempts', label: 'Tentativas' },
  { id: 'logs', label: 'Logs' },
  { id: 'interface', label: 'Interface' },
  { id: 'advanced', label: 'Avançado' },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState<Section>('flow');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings().then(setSettings); }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    setSaved(true);
    await log('Configurações salvas', { level: 'info' });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Restaurar todas as configurações para os valores padrão?')) {
      setSettings({ ...DEFAULT_SETTINGS });
      setSaved(false);
    }
  };

  return (
    <div>
      <TopBar title="Configurações">
        {saved && <span className="text-sm text-emerald-400">Salvo!</span>}
        <Button variant="ghost" size="sm" onClick={handleReset}><RotateCcw size={14} /> Restaurar Padrão</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}><Save size={14} /> Salvar</Button>
      </TopBar>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Section sidebar */}
        <div className="w-56 shrink-0 border-r border-slate-800 p-3 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === s.id ? 'bg-cyan-600/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl space-y-6">
            {activeSection === 'flow' && (
              <SectionCard title="Configurações do Google Flow" icon={<SettingsIcon size={18} />}>
                <TextField label="URL do Google Flow" value={settings.flow_url} onChange={(v) => update('flow_url', v)} />
                <TextField label="Projeto Padrão do Flow" value={settings.default_project} onChange={(v) => update('default_project', v)} placeholder="Nome do projeto padrão" />
                <SelectField
                  label="Modo de Automação"
                  value={settings.automation_mode}
                  onChange={(v) => update('automation_mode', v as AutomationMode)}
                  options={[
                    { value: 'automatic', label: 'Automático' },
                    { value: 'semi_automatic', label: 'Semiautomático' },
                    { value: 'simulation', label: 'Simulação' },
                  ]}
                />
                <SelectField
                  label="Modo de Seleção de Imagem"
                  value={settings.selection_mode}
                  onChange={(v) => update('selection_mode', v as SelectionMode)}
                  options={[
                    { value: 'auto', label: 'Automático' },
                    { value: 'confirm', label: 'Confirmar' },
                  ]}
                />
              </SectionCard>
            )}

            {activeSection === 'browser' && (
              <SectionCard title="Navegador" icon={<SettingsIcon size={18} />}>
                <SelectField
                  label="Navegador"
                  value={settings.browser}
                  onChange={(v) => update('browser', v as BrowserType)}
                  options={[
                    { value: 'chromium', label: 'Chromium' },
                    { value: 'chrome', label: 'Chrome' },
                    { value: 'edge', label: 'Edge' },
                  ]}
                />
                <TextField
                  label="Diretório do Perfil"
                  value={settings.browser_profile_dir}
                  onChange={(v) => update('browser_profile_dir', v)}
                  mono
                />
              </SectionCard>
            )}

            {activeSection === 'downloads' && (
              <SectionCard title="Downloads" icon={<SettingsIcon size={18} />}>
                <TextField
                  label="Pasta de Destino"
                  value={settings.download_folder}
                  onChange={(v) => update('download_folder', v)}
                  mono
                />
                <div className="text-xs text-slate-500 px-1">
                  Estrutura: <span className="font-mono">Pasta/Projeto/Videos/Scene_001.mp4</span>
                </div>
              </SectionCard>
            )}

            {activeSection === 'automation' && (
              <SectionCard title="Produção" icon={<SettingsIcon size={18} />}>
                <ToggleField label="Processar Imagens" value={settings.process_images} onChange={(v) => update('process_images', v)} />
                <ToggleField label="Processar Vídeos" value={settings.process_videos} onChange={(v) => update('process_videos', v)} />
                <ToggleField label="Pular cenas com imagem pronta" value={settings.skip_completed_images} onChange={(v) => update('skip_completed_images', v)} />
                <ToggleField label="Pular cenas com vídeo pronto" value={settings.skip_completed_videos} onChange={(v) => update('skip_completed_videos', v)} />
              </SectionCard>
            )}

            {activeSection === 'timeouts' && (
              <SectionCard title="Timeouts (ms)" icon={<SettingsIcon size={18} />}>
                <NumberField label="Timeout de Geração de Imagem" value={settings.image_generation_timeout} onChange={(v) => update('image_generation_timeout', v)} />
                <NumberField label="Timeout de Geração de Vídeo" value={settings.video_generation_timeout} onChange={(v) => update('video_generation_timeout', v)} />
                <NumberField label="Timeout de Download" value={settings.download_timeout} onChange={(v) => update('download_timeout', v)} />
                <NumberField label="Timeout de Carregamento de Página" value={settings.page_load_timeout} onChange={(v) => update('page_load_timeout', v)} />
                <NumberField label="Timeout Padrão" value={settings.default_timeout} onChange={(v) => update('default_timeout', v)} />
              </SectionCard>
            )}

            {activeSection === 'attempts' && (
              <SectionCard title="Tentativas" icon={<SettingsIcon size={18} />}>
                <NumberField label="Máximo de Tentativas (1-5)" value={settings.max_attempts} onChange={(v) => update('max_attempts', Math.max(1, Math.min(5, v)))} />
                <p className="text-xs text-slate-500 px-1">
                  Após o número máximo de tentativas, a cena será marcada como FALHOU.
                </p>
              </SectionCard>
            )}

            {activeSection === 'logs' && (
              <SectionCard title="Logs" icon={<SettingsIcon size={18} />}>
                <ToggleField label="Modo Debug" value={settings.debug_mode} onChange={(v) => update('debug_mode', v)} />
                <p className="text-xs text-slate-500 px-1">
                  No modo debug, o navegador é exibido e ações detalhadas são registradas. Screenshots são capturados em erros.
                </p>
              </SectionCard>
            )}

            {activeSection === 'interface' && (
              <SectionCard title="Interface" icon={<SettingsIcon size={18} />}>
                <p className="text-sm text-slate-400">A interface está em português brasileiro (pt-BR). Tema dark mode cinematográfico.</p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Atalhos de teclado:</p>
                  <p>• <span className="font-mono">Ctrl + Enter</span> — Iniciar</p>
                  <p>• <span className="font-mono">Ctrl + P</span> — Pausar</p>
                  <p>• <span className="font-mono">Ctrl + R</span> — Reprocessar cena</p>
                  <p>• <span className="font-mono">Esc</span> — Parar ação segura</p>
                </div>
              </SectionCard>
            )}

            {activeSection === 'advanced' && (
              <SectionCard title="Avançado" icon={<SettingsIcon size={18} />}>
                <ToggleField label="Modo Simulação" value={settings.simulation_mode} onChange={(v) => update('simulation_mode', v)} />
                <p className="text-xs text-slate-500 px-1">
                  No modo simulação, nenhuma geração real é feita no Flow. Apenas a fila, etapas, status, logs e downloads fictícios são simulados para testes da interface.
                </p>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-cyan-400">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function TextField({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600 ${mono ? 'font-mono text-xs' : ''}`}
      />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-600"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-cyan-600' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
