const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;
const MULTIPLE_SPACES = /\s+/g;
const TRIM_DOTS = /^\.+|\.+$/g;

export function sanitizeFilename(name: string): string {
  let result = name.trim()
    .replace(INVALID_CHARS, '_')
    .replace(MULTIPLE_SPACES, '_')
    .replace(TRIM_DOTS, '');

  if (!result) result = 'sem_nome';
  if (result.length > 200) result = result.substring(0, 200);
  return result;
}

export function formatSceneFilename(
  sceneNumber: number,
  title: string | null,
  extension: string
): string {
  const padded = String(sceneNumber).padStart(3, '0');
  const safeTitle = title ? sanitizeFilename(title) : '';
  const base = safeTitle ? `${padded}_${safeTitle}` : padded;
  return `${base}.${extension}`;
}

export function resolveDuplicateVersion(
  filename: string,
  existingFilenames: Set<string>
): string {
  if (!existingFilenames.has(filename)) return filename;

  const dotIdx = filename.lastIndexOf('.');
  const stem = dotIdx > 0 ? filename.substring(0, dotIdx) : filename;
  const ext = dotIdx > 0 ? filename.substring(dotIdx) : '';

  let version = 2;
  let candidate = `${stem}_v${version}${ext}`;
  while (existingFilenames.has(candidate)) {
    version++;
    candidate = `${stem}_v${version}${ext}`;
  }
  return candidate;
}
