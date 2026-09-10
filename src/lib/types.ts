export type SceneStatus =
  | 'pending'
  | 'validating'
  | 'opening_flow'
  | 'generating_image'
  | 'waiting_image'
  | 'image_completed'
  | 'generating_video'
  | 'waiting_video'
  | 'video_completed'
  | 'downloading'
  | 'downloaded'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'skipped'
  | 'needs_user_action';

export type ProjectStatus =
  | 'pending'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'failed';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export type ErrorCategory =
  | 'BROWSER_ERROR'
  | 'FLOW_NOT_AVAILABLE'
  | 'LOGIN_REQUIRED'
  | 'ELEMENT_NOT_FOUND'
  | 'GENERATION_TIMEOUT'
  | 'DOWNLOAD_ERROR'
  | 'NETWORK_ERROR'
  | 'INVALID_PROJECT'
  | 'UNKNOWN_ERROR';

export type AutomationMode = 'automatic' | 'semi_automatic' | 'simulation';

export type SelectionMode = 'auto' | 'confirm';

export type BrowserType = 'chrome' | 'edge' | 'chromium';

export interface ProjectMeta {
  id?: string;
  title: string;
  language?: string;
  aspect_ratio?: string;
  visual_style?: string;
}

export interface ImportedScene {
  scene_number: number;
  title?: string;
  image_prompt?: string;
  animation_prompt?: string;
  reference_image?: string | null;
}

export interface ImportedProject {
  project: ProjectMeta;
  characters?: unknown[];
  scenes: ImportedScene[];
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  language: string;
  aspect_ratio: string;
  visual_style: string | null;
  status: ProjectStatus;
  flow_project_name: string | null;
  flow_project_reference: string | null;
  source_json: ImportedProject | null;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: number;
  title: string | null;
  image_prompt: string | null;
  animation_prompt: string | null;
  reference_image_path: string | null;
  image_status: SceneStatus;
  video_status: SceneStatus;
  download_status: SceneStatus;
  image_path: string | null;
  video_path: string | null;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export interface QueueItem {
  id: string;
  project_id: string;
  scene_id: string;
  status: SceneStatus;
  current_step: string | null;
  attempts: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  project_id: string | null;
  scene_id: string | null;
  level: LogLevel;
  message: string;
  technical_details: string | null;
  category: ErrorCategory | null;
  created_at: string;
}

export interface AppSettings {
  flow_url: string;
  browser: BrowserType;
  browser_profile_dir: string;
  default_project: string;
  automation_mode: AutomationMode;
  selection_mode: SelectionMode;
  process_images: boolean;
  process_videos: boolean;
  skip_completed_images: boolean;
  skip_completed_videos: boolean;
  max_attempts: number;
  download_folder: string;
  image_generation_timeout: number;
  video_generation_timeout: number;
  download_timeout: number;
  page_load_timeout: number;
  default_timeout: number;
  debug_mode: boolean;
  simulation_mode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  flow_url: 'https://flow.google.com',
  browser: 'chromium',
  browser_profile_dir: '%APPDATA%/AI-Video-Flow-Automation/browser-profile',
  default_project: '',
  automation_mode: 'semi_automatic',
  selection_mode: 'auto',
  process_images: true,
  process_videos: true,
  skip_completed_images: true,
  skip_completed_videos: true,
  max_attempts: 3,
  download_folder: 'C:\\AI Video Studio\\Projects',
  image_generation_timeout: 120000,
  video_generation_timeout: 180000,
  download_timeout: 60000,
  page_load_timeout: 30000,
  default_timeout: 30000,
  debug_mode: false,
  simulation_mode: false,
};

export interface FlowProvider {
  open(): Promise<void>;
  checkLogin(): Promise<boolean>;
  openProject(name: string): Promise<void>;
  createProject(name: string): Promise<void>;
  generateImage(scene: Scene, prompt: string): Promise<void>;
  waitForImage(scene: Scene): Promise<void>;
  selectGeneratedImage(scene: Scene): Promise<void>;
  generateVideo(scene: Scene, prompt: string): Promise<void>;
  waitForVideo(scene: Scene): Promise<void>;
  downloadVideo(scene: Scene): Promise<string>;
  renameAsset(path: string, newName: string): Promise<string>;
  detectPageLoaded(): Promise<boolean>;
  detectPromptAvailable(): Promise<boolean>;
  detectImageGeneratorAvailable(): Promise<boolean>;
  detectResultAvailable(): Promise<boolean>;
  detectVideoGeneratorAvailable(): Promise<boolean>;
  detectDownloadAvailable(): Promise<boolean>;
}
