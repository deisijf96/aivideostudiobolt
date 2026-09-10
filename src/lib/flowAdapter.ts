import type { FlowProvider, Scene, AppSettings } from './types';

/**
 * SimulationProvider — simulates the entire automation flow without
 * touching a real browser. Used for UI testing and demonstration only.
 * Never used as a substitute for the real implementation.
 */
export class SimulationProvider implements FlowProvider {
  private settings: AppSettings;
  private delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  async open(): Promise<void> {
    await this.delay(800);
  }

  async checkLogin(): Promise<boolean> {
    await this.delay(500);
    return true;
  }

  async openProject(_name: string): Promise<void> {
    await this.delay(600);
  }

  async createProject(_name: string): Promise<void> {
    await this.delay(600);
  }

  async generateImage(_scene: Scene, _prompt: string): Promise<void> {
    await this.delay(1500);
  }

  async waitForImage(_scene: Scene): Promise<void> {
    await this.delay(2000);
  }

  async selectGeneratedImage(_scene: Scene): Promise<void> {
    await this.delay(500);
  }

  async generateVideo(_scene: Scene, _prompt: string): Promise<void> {
    await this.delay(1500);
  }

  async waitForVideo(_scene: Scene): Promise<void> {
    await this.delay(2500);
  }

  async downloadVideo(scene: Scene): Promise<string> {
    await this.delay(1000);
    return `C:\\AI Video Studio\\Projects\\Simulation\\Videos\\Scene_${String(scene.scene_number).padStart(3, '0')}.mp4`;
  }

  async renameAsset(_path: string, newName: string): Promise<string> {
    await this.delay(300);
    return `C:\\AI Video Studio\\Projects\\Simulation\\Videos\\${newName}`;
  }

  async detectPageLoaded(): Promise<boolean> {
    await this.delay(300);
    return true;
  }

  async detectPromptAvailable(): Promise<boolean> {
    await this.delay(300);
    return true;
  }

  async detectImageGeneratorAvailable(): Promise<boolean> {
    await this.delay(300);
    return true;
  }

  async detectResultAvailable(): Promise<boolean> {
    await this.delay(300);
    return true;
  }

  async detectVideoGeneratorAvailable(): Promise<boolean> {
    await this.delay(300);
    return true;
  }

  async detectDownloadAvailable(): Promise<boolean> {
    await this.delay(300);
    return true;
  }
}

/**
 * GoogleFlowBrowserProvider — the real automation provider.
 *
 * In the V1 desktop app, this would use Playwright to drive a local
 * Chromium instance. In this web-based preview environment, browser
 * automation is not available, so this provider throws descriptive
 * errors explaining that the real automation engine requires the
 * desktop build.
 *
 * The interface is fully defined so the rest of the app can be built
 * and tested against it. When the desktop build is available, the
 * Playwright calls go inside each method body.
 */
export class GoogleFlowBrowserProvider implements FlowProvider {
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  private unavailable(): never {
    throw new Error(
      'A automação real do navegador está disponível apenas na versão desktop do aplicativo. ' +
      'Use o Modo Simulação para testar a interface.'
    );
  }

  async open(): Promise<void> { this.unavailable(); }
  async checkLogin(): Promise<boolean> { this.unavailable(); }
  async openProject(_name: string): Promise<void> { this.unavailable(); }
  async createProject(_name: string): Promise<void> { this.unavailable(); }
  async generateImage(_scene: Scene, _prompt: string): Promise<void> { this.unavailable(); }
  async waitForImage(_scene: Scene): Promise<void> { this.unavailable(); }
  async selectGeneratedImage(_scene: Scene): Promise<void> { this.unavailable(); }
  async generateVideo(_scene: Scene, _prompt: string): Promise<void> { this.unavailable(); }
  async waitForVideo(_scene: Scene): Promise<void> { this.unavailable(); }
  async downloadVideo(_scene: Scene): Promise<string> { this.unavailable(); }
  async renameAsset(_path: string, _newName: string): Promise<string> { this.unavailable(); }
  async detectPageLoaded(): Promise<boolean> { this.unavailable(); }
  async detectPromptAvailable(): Promise<boolean> { this.unavailable(); }
  async detectImageGeneratorAvailable(): Promise<boolean> { this.unavailable(); }
  async detectResultAvailable(): Promise<boolean> { this.unavailable(); }
  async detectVideoGeneratorAvailable(): Promise<boolean> { this.unavailable(); }
  async detectDownloadAvailable(): Promise<boolean> { this.unavailable(); }
}

export function createProvider(settings: AppSettings): FlowProvider {
  if (settings.simulation_mode) {
    return new SimulationProvider(settings);
  }
  return new GoogleFlowBrowserProvider(settings);
}
