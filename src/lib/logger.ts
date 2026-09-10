import { supabase } from './supabase';
import type { LogLevel, ErrorCategory } from './types';

export async function log(
  message: string,
  options: {
    level?: LogLevel;
    projectId?: string;
    sceneId?: string;
    technicalDetails?: string;
    category?: ErrorCategory;
  } = {}
): Promise<void> {
  const { level = 'info', projectId, sceneId, technicalDetails, category } = options;

  try {
    await supabase.from('automation_logs').insert({
      project_id: projectId ?? null,
      scene_id: sceneId ?? null,
      level,
      message,
      technical_details: technicalDetails ?? null,
      category: category ?? null,
    });
  } catch {
    // Silently fail — logging should never break the app
  }
}

export async function fetchLogs(
  projectId?: string,
  limit = 200
): Promise<{ id: string; level: string; message: string; technical_details: string | null; category: string | null; created_at: string; scene_id: string | null }[]> {
  let query = supabase
    .from('automation_logs')
    .select('id, level, message, technical_details, category, created_at, scene_id')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function clearLogs(projectId?: string): Promise<void> {
  if (projectId) {
    await supabase.from('automation_logs').delete().eq('project_id', projectId);
  } else {
    await supabase.from('automation_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}
