import { useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/Sidebar';
import { Card, Button } from '@/components/ui';
import { importProject } from '@/lib/projectService';
import { parseProjectJSON } from '@/lib/projectImporter';
import type { Page } from '@/components/Sidebar';
import type { ImportedProject } from '@/lib/types';

export function ImportPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportedProject | null>(null);
  const [rawContent, setRawContent] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setErrorDetail(null);
    setSuccess(null);
    setPreview(null);

    if (!file.name.endsWith('.json')) {
      setError('Apenas arquivos .json são suportados nesta versão.');
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      setRawContent(text);

      const result = parseProjectJSON(text);
      if (!result.valid || !result.project) {
        setError(result.error ?? 'Não foi possível importar o projeto. Verifique o arquivo.');
        setLoading(false);
        return;
      }

      setPreview(result.project);
    } catch (e) {
      setError('Não foi possível importar o projeto. Verifique o arquivo.');
      setErrorDetail(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!rawContent) return;
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    const project = await importProject(rawContent);
    setLoading(false);

    if (project) {
      setSuccess(`Projeto "${project.title}" importado com sucesso!`);
      setPreview(null);
      setTimeout(() => onNavigate('projects'), 1500);
    } else {
      setError('Não foi possível importar o projeto. Verifique o arquivo.');
      setErrorDetail('A importação falhou ao salvar no banco de dados. Verifique os logs para mais detalhes.');
    }
  };

  return (
    <div>
      <TopBar title="Importar Projeto" />
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-cyan-500 bg-cyan-950/20'
              : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-cyan-400 animate-spin" />
              <p className="text-sm text-slate-400">Processando arquivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <Upload size={28} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Arraste um arquivo .json aqui</p>
                <p className="text-xs text-slate-500 mt-1">ou clique para selecionar</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Card className="p-4 border-red-800/50">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">{error}</p>
                {errorDetail && (
                  <p className="text-xs text-slate-500 mt-1 font-mono">{errorDetail}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">Detalhes técnicos disponíveis no log.</p>
              </div>
            </div>
          </Card>
        )}

        {success && (
          <Card className="p-4 border-emerald-800/50">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-emerald-300">{success}</p>
            </div>
          </Card>
        )}

        {preview && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileJson size={20} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">Pré-visualização do Projeto</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Título" value={preview.project.title} />
              <InfoRow label="Idioma" value={preview.project.language ?? 'pt-BR'} />
              <InfoRow label="Formato" value={preview.project.aspect_ratio ?? '9:16'} />
              <InfoRow label="Estilo Visual" value={preview.project.visual_style ?? 'N/A'} />
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">Cenas ({preview.scenes.length})</p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {preview.scenes.map((scene, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40">
                    <span className="text-xs font-mono text-cyan-400 shrink-0">
                      {String(scene.scene_number).padStart(3, '0')}
                    </span>
                    <span className="text-sm text-slate-300 truncate">{scene.title ?? 'Sem título'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={handleConfirmImport} disabled={loading}>
                Confirmar Importação
              </Button>
              <Button variant="ghost" onClick={() => { setPreview(null); setRawContent(''); }}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Formato Esperado</h3>
          <pre className="text-xs text-slate-400 bg-slate-950 rounded-lg p-4 overflow-x-auto border border-slate-800">
{`{
  "project": {
    "title": "Maria e o Cachorro",
    "language": "pt-BR",
    "aspect_ratio": "9:16",
    "visual_style": "cinematic realistic"
  },
  "scenes": [
    {
      "scene_number": 1,
      "title": "Maria encontra o cachorro",
      "image_prompt": "...",
      "animation_prompt": "..."
    }
  ]
}`}
          </pre>
          <p className="text-xs text-slate-500 mt-3">
            O importador também aceita variações: <span className="font-mono">name</span> em vez de <span className="font-mono">title</span>, <span className="font-mono">shots</span> em vez de <span className="font-mono">scenes</span>, <span className="font-mono">prompt</span> em vez de <span className="font-mono">image_prompt</span>, etc.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Formatos futuros: .zip, .md, diretório de projeto.
          </p>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}
