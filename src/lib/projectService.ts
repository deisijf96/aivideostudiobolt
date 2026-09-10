import { supabase } from './supabase';
import type { Project, Scene, QueueItem, ImportedProject } from './types';
import { parseProjectJSON } from './projectImporter';
import { log } from './logger';

export async function importProject(jsonString: string): Promise<Project | null> {
  const result = parseProjectJSON(jsonString);
  if (!result.valid || !result.project) {
    await log(result.error ?? 'Erro ao importar projeto', { level: 'error', category: 'INVALID_PROJECT' });
    return null;
  }

  const imported = result.project;

  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .insert({
      title: imported.project.title,
      language: imported.project.language ?? 'pt-BR',
      aspect_ratio: imported.project.aspect_ratio ?? '9:16',
      visual_style: imported.project.visual_style ?? null,
      status: 'pending',
      source_json: imported as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (projectError || !projectData) {
    await log('Erro ao criar projeto no banco', { level: 'error', technicalDetails: projectError?.message, category: 'UNKNOWN_ERROR' });
    return null;
  }

  const project = projectData as Project;

  const sceneRows = imported.scenes.map((s) => ({
    project_id: project.id,
    scene_number: s.scene_number,
    title: s.title ?? null,
    image_prompt: s.image_prompt ?? null,
    animation_prompt: s.animation_prompt ?? null,
    reference_image_path: s.reference_image ?? null,
    image_status: 'pending' as const,
    video_status: 'pending' as const,
    download_status: 'pending' as const,
  }));

  const { data: insertedScenes, error: scenesError } = await supabase
    .from('scenes')
    .insert(sceneRows)
    .select();

  if (scenesError || !insertedScenes) {
    await log('Erro ao criar cenas', { level: 'error', technicalDetails: scenesError?.message, category: 'UNKNOWN_ERROR' });
    return project;
  }

  const queueRows = insertedScenes.map((scene) => ({
    project_id: project.id,
    scene_id: scene.id,
    status: 'pending' as const,
    max_attempts: 3,
  }));

  await supabase.from('queue_items').insert(queueRows);

  await log(`Projeto "${project.title}" importado com ${insertedScenes.length} cenas`, {
    level: 'info',
    projectId: project.id,
  });

  return project;
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as Project[];
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Project;
}

export async function fetchScenes(projectId: string): Promise<Scene[]> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)
    .order('scene_number', { ascending: true });

  if (error) return [];
  return (data ?? []) as Scene[];
}

export async function fetchQueueItems(projectId: string): Promise<QueueItem[]> {
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []) as QueueItem[];
}

export async function updateScene(
  sceneId: string,
  updates: Partial<Scene>
): Promise<void> {
  await supabase.from('scenes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', sceneId);
}

export async function updateQueueItem(
  queueId: string,
  updates: Partial<QueueItem>
): Promise<void> {
  await supabase.from('queue_items').update(updates).eq('id', queueId);
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<void> {
  await supabase.from('projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', projectId);
}

export async function deleteProject(projectId: string): Promise<void> {
  await supabase.from('projects').delete().eq('id', projectId);
}

export async function exportProject(projectId: string): Promise<ImportedProject | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('source_json')
    .eq('id', projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data.source_json as ImportedProject;
}

export async function getDashboardStats(): Promise<{
  totalProjects: number;
  totalScenes: number;
  completedScenes: number;
  failedScenes: number;
  downloadedVideos: number;
  processingScenes: number;
}> {
  const { data: projects } = await supabase.from('projects').select('id');
  const totalProjects = projects?.length ?? 0;

  const { data: scenes } = await supabase.from('scenes').select('image_status, video_status, download_status');
  const allScenes = scenes ?? [];

  const completedScenes = allScenes.filter((s) => s.download_status === 'completed').length;
  const failedScenes = allScenes.filter((s) => s.image_status === 'failed' || s.video_status === 'failed').length;
  const downloadedVideos = allScenes.filter((s) => s.download_status === 'completed').length;
  const processingScenes = allScenes.filter((s) => {
    const statuses = [s.image_status, s.video_status, s.download_status];
    return statuses.some((st) => st !== 'pending' && st !== 'completed' && st !== 'failed' && st !== 'skipped');
  }).length;

  return {
    totalProjects,
    totalScenes: allScenes.length,
    completedScenes,
    failedScenes,
    downloadedVideos,
    processingScenes,
  };
}
