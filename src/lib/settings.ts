import { supabase } from './supabase';
import { DEFAULT_SETTINGS, type AppSettings } from './types';

export async function loadSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('settings').select('key, value');

  if (error || !data) return { ...DEFAULT_SETTINGS };

  const result = { ...DEFAULT_SETTINGS };
  for (const row of data) {
    const key = row.key as keyof AppSettings;
    if (key in DEFAULT_SETTINGS && row.value !== null) {
      (result as Record<string, unknown>)[key] = row.value;
    }
  }
  return result;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const entries = Object.entries(settings).map(([key, value]) => ({
    key,
    value: value,
    updated_at: new Date().toISOString(),
  }));

  for (const entry of entries) {
    await supabase.from('settings').upsert(entry, { onConflict: 'key' });
  }
}

export async function saveSetting(key: keyof AppSettings, value: unknown): Promise<void> {
  await supabase.from('settings').upsert({
    key,
    value: value,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
}
