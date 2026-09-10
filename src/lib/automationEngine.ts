import type { FlowProvider, Scene, QueueItem, AppSettings, SceneStatus, ErrorCategory } from './types';
import { nextState, isTerminal } from './stateMachine';
import { getStatusMessage } from './statusMessages';
import { updateScene, updateQueueItem, updateProject } from './projectService';
import { log } from './logger';
import { formatSceneFilename } from './fileSanitizer';

export type EngineEvent =
  | { type: 'scene_status'; sceneId: string; status: SceneStatus; message: string }
  | { type: 'log'; level: string; message: string }
  | { type: 'error'; sceneId: string; message: string; category: ErrorCategory }
  | { type: 'project_complete'; projectId: string }
  | { type: 'needs_attention'; sceneId: string; message: string };

type EventCallback = (event: EngineEvent) => void;

export class AutomationEngine {
  private provider: FlowProvider;
  private settings: AppSettings;
  private listeners: EventCallback[] = [];
  private running = false;
  private paused = false;

  constructor(provider: FlowProvider, settings: AppSettings) {
    this.provider = provider;
    this.settings = settings;
  }

  on(cb: EventCallback): void {
    this.listeners.push(cb);
  }

  private emit(event: EngineEvent): void {
    for (const cb of this.listeners) cb(event);
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  stop(): void {
    this.running = false;
    this.paused = false;
  }

  async processQueue(
    projectId: string,
    scenes: Scene[],
    queueItems: QueueItem[]
  ): Promise<void> {
    this.running = true;
    this.paused = false;

    await log('Iniciando processamento da fila', { level: 'info', projectId });
    this.emit({ type: 'log', level: 'info', message: 'Projeto iniciado' });

    for (let i = 0; i < scenes.length; i++) {
      if (!this.running) break;

      while (this.paused) {
        await new Promise((r) => setTimeout(r, 500));
        if (!this.running) break;
      }
      if (!this.running) break;

      const scene = scenes[i];
      const queueItem = queueItems.find((q) => q.scene_id === scene.id);

      if (scene.download_status === 'completed' && this.settings.skip_completed_videos) {
        await log(`Cena ${scene.scene_number} já concluída — pulando`, { level: 'info', projectId, sceneId: scene.id });
        this.emit({ type: 'log', level: 'info', message: `Cena ${String(scene.scene_number).padStart(2, '0')} já concluída — pulando` });
        continue;
      }

      if (scene.image_status === 'failed' || scene.video_status === 'failed') {
        await log(`Cena ${scene.scene_number} falhou anteriormente — tentando novamente`, { level: 'warn', projectId, sceneId: scene.id });
      }

      try {
        await this.processScene(projectId, scene, queueItem);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        const category: ErrorCategory = message.includes('navegador') ? 'BROWSER_ERROR' : 'UNKNOWN_ERROR';

        await updateScene(scene.id, {
          image_status: 'failed',
          video_status: 'failed',
          error_message: message,
        });

        if (queueItem) {
          await updateQueueItem(queueItem.id, {
            status: 'failed',
            error: message,
            attempts: (queueItem.attempts ?? 0) + 1,
          });
        }

        await log(`Erro na cena ${scene.scene_number}: ${message}`, {
          level: 'error',
          projectId,
          sceneId: scene.id,
          technicalDetails: err instanceof Error ? err.stack ?? err.message : String(err),
          category,
        });

        this.emit({ type: 'error', sceneId: scene.id, message, category });
        this.emit({ type: 'log', level: 'error', message: `Erro na cena ${String(scene.scene_number).padStart(2, '0')}: ${message}` });

        if (this.settings.automation_mode !== 'automatic') {
          this.emit({ type: 'needs_attention', sceneId: scene.id, message: 'A automação precisa da sua atenção.' });
          this.paused = true;
        }
      }
    }

    this.running = false;

    const allCompleted = scenes.every((s) => s.download_status === 'completed' || s.image_status === 'skipped');
    if (allCompleted) {
      await updateProject(projectId, { status: 'completed' });
      this.emit({ type: 'project_complete', projectId });
      this.emit({ type: 'log', level: 'info', message: 'Projeto concluído' });
    }
  }

  private async processScene(projectId: string, scene: Scene, queueItem?: QueueItem): Promise<void> {
    const step = async (status: SceneStatus, action?: () => Promise<void>) => {
      const msg = getStatusMessage(status, scene.scene_number);
      this.emit({ type: 'scene_status', sceneId: scene.id, status, message: msg });
      this.emit({ type: 'log', level: 'info', message: msg });

      await updateScene(scene.id, {
        image_status: this.mapToImageField(status, scene.image_status),
        video_status: this.mapToVideoField(status, scene.video_status),
        download_status: this.mapToDownloadField(status, scene.download_status),
      });

      if (queueItem) {
        await updateQueueItem(queueItem.id, { status, current_step: status });
      }

      if (action) await action();
    };

    await step('validating');
    await step('opening_flow', async () => {
      await this.provider.open();
      const loggedIn = await this.provider.checkLogin();
      if (!loggedIn) {
        throw new Error('Login do Google Flow necessário. Faça login na janela do navegador.');
      }
    });

    // Image generation
    if (this.settings.process_images) {
      await step('generating_image', async () => {
        await this.provider.generateImage(scene, scene.image_prompt ?? '');
      });
      await step('waiting_image', async () => {
        await this.provider.waitForImage(scene);
      });
      await step('image_completed', async () => {
        await this.provider.selectGeneratedImage(scene);
      });
    }

    // Video generation
    if (this.settings.process_videos) {
      await step('generating_video', async () => {
        await this.provider.generateVideo(scene, scene.animation_prompt ?? '');
      });
      await step('waiting_video', async () => {
        await this.provider.waitForVideo(scene);
      });
      await step('video_completed');
    }

    // Download
    await step('downloading', async () => {
      const rawPath = await this.provider.downloadVideo(scene);
      const filename = formatSceneFilename(scene.scene_number, scene.title, 'mp4');
      const finalPath = await this.provider.renameAsset(rawPath, filename);
      await updateScene(scene.id, { video_path: finalPath });
    });

    await step('downloaded');
    await step('completed');

    if (queueItem) {
      await updateQueueItem(queueItem.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    }

    await log(`Cena ${scene.scene_number} concluída`, { level: 'info', projectId, sceneId: scene.id });
  }

  private mapToImageField(status: SceneStatus, current: SceneStatus): SceneStatus {
    const imageStates: SceneStatus[] = ['validating', 'opening_flow', 'generating_image', 'waiting_image', 'image_completed'];
    if (imageStates.includes(status)) return status;
    if (status === 'failed') return 'failed';
    if (status === 'paused') return 'paused';
    return current;
  }

  private mapToVideoField(status: SceneStatus, current: SceneStatus): SceneStatus {
    const videoStates: SceneStatus[] = ['generating_video', 'waiting_video', 'video_completed'];
    if (videoStates.includes(status)) return status;
    if (status === 'failed') return 'failed';
    if (status === 'paused') return 'paused';
    return current;
  }

  private mapToDownloadField(status: SceneStatus, current: SceneStatus): SceneStatus {
    const downloadStates: SceneStatus[] = ['downloading', 'downloaded', 'completed'];
    if (downloadStates.includes(status)) return status;
    if (status === 'failed') return 'failed';
    if (status === 'paused') return 'paused';
    return current;
  }
}
