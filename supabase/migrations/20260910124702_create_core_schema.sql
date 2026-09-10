/*
# AI Video Flow Automation — Core Schema

## Overview
Creates the full persistence layer for the AI Video Flow Automation app: projects,
scenes, queue items, logs, and settings. Single-tenant (no auth) — the app runs
locally on the user's machine and all data is intentionally shared/public.

## Tables

### projects
- `id` (uuid PK)
- `title` (text, not null) — project name
- `description` (text)
- `language` (text, default 'pt-BR')
- `aspect_ratio` (text, default '9:16')
- `visual_style` (text)
- `status` (text, default 'pending') — overall project status
- `flow_project_name` (text) — name of the corresponding Google Flow project
- `flow_project_reference` (text) — reference/URL to the Flow project
- `source_json` (jsonb) — original imported JSON for re-export
- `created_at`, `updated_at` (timestamps)

### scenes
- `id` (uuid PK)
- `project_id` (uuid FK → projects, cascade delete)
- `scene_number` (int, not null)
- `title` (text)
- `image_prompt` (text)
- `animation_prompt` (text)
- `reference_image_path` (text)
- `image_status` (text, default 'pending')
- `video_status` (text, default 'pending')
- `download_status` (text, default 'pending')
- `image_path` (text) — path to downloaded/generated image
- `video_path` (text) — path to downloaded video
- `error_message` (text)
- `attempts` (int, default 0)
- `created_at`, `updated_at` (timestamps)

### queue_items
- `id` (uuid PK)
- `project_id` (uuid FK → projects, cascade delete)
- `scene_id` (uuid FK → scenes, cascade delete)
- `status` (text, default 'pending') — queue task status
- `current_step` (text) — current step in the state machine
- `attempts` (int, default 0)
- `max_attempts` (int, default 3)
- `started_at` (timestamptz)
- `completed_at` (timestamptz)
- `error` (text)
- `created_at` (timestamps)

### automation_logs
- `id` (uuid PK)
- `project_id` (uuid FK → projects, cascade delete, nullable)
- `scene_id` (uuid FK → scenes, cascade delete, nullable)
- `level` (text, default 'info') — info, warn, error, debug
- `message` (text, not null)
- `technical_details` (text)
- `category` (text) — error category (BROWSER_ERROR, FLOW_NOT_AVAILABLE, etc.)
- `created_at` (timestamp)

### settings
- `key` (text PK)
- `value` (jsonb)
- `updated_at` (timestamp)

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated CRUD (single-tenant, no auth — data is intentionally local/shared).
- `USING (true)` is correct here because this is a no-auth desktop-style app where all data belongs to the single local user.

## Notes
1. All status columns use text (not enum) for flexibility — the state machine is enforced in the application layer.
2. `source_json` stores the original imported project JSON so it can be re-exported without loss.
3. Settings uses a key-value pattern with jsonb values to support any configuration type.
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  language text DEFAULT 'pt-BR',
  aspect_ratio text DEFAULT '9:16',
  visual_style text,
  status text DEFAULT 'pending',
  flow_project_name text,
  flow_project_reference text,
  source_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_number int NOT NULL,
  title text,
  image_prompt text,
  animation_prompt text,
  reference_image_path text,
  image_status text DEFAULT 'pending',
  video_status text DEFAULT 'pending',
  download_status text DEFAULT 'pending',
  image_path text,
  video_path text,
  error_message text,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scenes" ON scenes;
CREATE POLICY "anon_select_scenes" ON scenes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scenes" ON scenes;
CREATE POLICY "anon_insert_scenes" ON scenes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scenes" ON scenes;
CREATE POLICY "anon_update_scenes" ON scenes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scenes" ON scenes;
CREATE POLICY "anon_delete_scenes" ON scenes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id uuid NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  current_step text,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_queue_items" ON queue_items;
CREATE POLICY "anon_select_queue_items" ON queue_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_queue_items" ON queue_items;
CREATE POLICY "anon_insert_queue_items" ON queue_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_queue_items" ON queue_items;
CREATE POLICY "anon_update_queue_items" ON queue_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_queue_items" ON queue_items;
CREATE POLICY "anon_delete_queue_items" ON queue_items FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES scenes(id) ON DELETE CASCADE,
  level text DEFAULT 'info',
  message text NOT NULL,
  technical_details text,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_logs" ON automation_logs;
CREATE POLICY "anon_select_logs" ON automation_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_logs" ON automation_logs;
CREATE POLICY "anon_insert_logs" ON automation_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_logs" ON automation_logs;
CREATE POLICY "anon_update_logs" ON automation_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_logs" ON automation_logs;
CREATE POLICY "anon_delete_logs" ON automation_logs FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_project_id ON queue_items(project_id);
CREATE INDEX IF NOT EXISTS idx_queue_items_scene_id ON queue_items(scene_id);
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON automation_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_scene_id ON automation_logs(scene_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON automation_logs(created_at DESC);
