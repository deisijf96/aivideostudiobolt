import type { ImportedProject, ImportedScene } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  project?: ImportedProject;
}

function findField(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function toString(value: unknown, fallback: string = ''): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function toNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
}

const TITLE_KEYS = [
  'title', 'name', 'project_name', 'projectName',
  'projeto', 'nome', 'nome_do_projeto', 'nomeProjeto',
  'titulo', 'título',
];

const SCENE_LIST_KEYS = [
  'scenes', 'scene_list', 'sceneList', 'shots', 'shot_list', 'shotlist',
  'cenas', 'cenas_principais', 'cena_list', 'cenas_list',
  'cenas_de_apoio', 'cenas_secundarias',
];

const SCENE_NUMBER_KEYS = [
  'scene_number', 'sceneNumber', 'number', 'num', 'index', 'id',
  'cena', 'cena_numero', 'numero', 'numero_cena',
];

const SCENE_TITLE_KEYS = [
  'title', 'name', 'scene_title', 'sceneTitle',
  'titulo', 'título', 'nome',
];

const IMAGE_PROMPT_KEYS = [
  'image_prompt', 'imagePrompt', 'prompt', 'image', 'image_description', 'imageDescription',
  'prompt_imagem', 'prompt_imagem_midjourney', 'prompt_imagem_midjourney',
  'prompt_de_imagem', 'imagem_prompt', 'prompt_image',
];

const ANIMATION_PROMPT_KEYS = [
  'animation_prompt', 'animationPrompt', 'animation', 'video_prompt', 'videoPrompt',
  'motion_prompt', 'motionPrompt',
  'prompt_animacao', 'prompt_animeacao', 'prompt_animacao_grok',
  'prompt_de_animacao', 'animacao_prompt', 'prompt_video', 'prompt_de_video',
];

const REFERENCE_IMAGE_KEYS = [
  'reference_image', 'referenceImage', 'ref_image', 'refImage',
  'imagem_referencia', 'imagem_de_referencia', 'referencia', 'ref',
];

const LANGUAGE_KEYS = ['language', 'lang', 'locale', 'idioma', 'linguagem'];
const ASPECT_RATIO_KEYS = ['aspect_ratio', 'aspectRatio', 'ratio', 'format', 'formato', 'proporcao', 'proporção'];
const VISUAL_STYLE_KEYS = ['visual_style', 'visualStyle', 'style', 'art_style', 'artStyle', 'estilo_visual', 'estilo', 'identidade_visual'];

export function validateProject(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Arquivo inválido: conteúdo não é um objeto JSON válido.' };
  }

  const obj = raw as Record<string, unknown>;

  // Determine project metadata source — could be nested under "project"/"projeto" or at top level
  let projectMeta: Record<string, unknown>;
  const nestedProject = findField(obj, ['project', 'projeto', 'project_info', 'projectInfo']);
  if (nestedProject && typeof nestedProject === 'object') {
    projectMeta = nestedProject as Record<string, unknown>;
  } else {
    projectMeta = obj;
  }

  // Title — could be a string directly under "projeto" or a field inside a project object
  let title = '';
  if (typeof nestedProject === 'string') {
    title = nestedProject;
  } else {
    title = toString(findField(projectMeta, TITLE_KEYS));
  }
  if (!title) {
    return {
      valid: false,
      error: 'Não foi possível encontrar o título do projeto. Campos procurados: ' + TITLE_KEYS.join(', '),
    };
  }

  // Find scenes array — check all possible keys, merge multiple arrays if found
  const scenesRaw: unknown[] = [];
  for (const key of SCENE_LIST_KEYS) {
    if (Array.isArray(obj[key])) {
      scenesRaw.push(...(obj[key] as unknown[]));
    }
    if (projectMeta !== obj && Array.isArray(projectMeta[key])) {
      scenesRaw.push(...(projectMeta[key] as unknown[]));
    }
  }

  if (scenesRaw.length === 0) {
    return {
      valid: false,
      error: 'Não foi possível encontrar a lista de cenas. Campos procurados: ' + SCENE_LIST_KEYS.join(', '),
    };
  }

  const scenes: ImportedScene[] = [];
  for (let i = 0; i < scenesRaw.length; i++) {
    const s = scenesRaw[i];
    if (!s || typeof s !== 'object') {
      return { valid: false, error: `Cena ${i + 1}: estrutura inválida.` };
    }
    const sceneObj = s as Record<string, unknown>;

    const sceneNumber = toNumber(
      findField(sceneObj, SCENE_NUMBER_KEYS),
      i + 1
    );

    const sceneTitle = toString(findField(sceneObj, SCENE_TITLE_KEYS), undefined) || undefined;
    const imagePrompt = toString(findField(sceneObj, IMAGE_PROMPT_KEYS), undefined) || undefined;
    const animationPrompt = toString(findField(sceneObj, ANIMATION_PROMPT_KEYS), undefined) || undefined;
    const refImage = findField(sceneObj, REFERENCE_IMAGE_KEYS);

    scenes.push({
      scene_number: sceneNumber,
      title: sceneTitle,
      image_prompt: imagePrompt,
      animation_prompt: animationPrompt,
      reference_image: (typeof refImage === 'string' ? refImage : null),
    });
  }

  if (scenes.length === 0) {
    return { valid: false, error: 'Projeto inválido: nenhuma cena encontrada.' };
  }

  return {
    valid: true,
    project: {
      project: {
        id: toString(findField(projectMeta, ['id', 'project_id', 'projectId']), undefined) || undefined,
        title,
        language: toString(findField(projectMeta, LANGUAGE_KEYS), 'pt-BR'),
        aspect_ratio: toString(findField(projectMeta, ASPECT_RATIO_KEYS), '9:16'),
        visual_style: toString(findField(projectMeta, VISUAL_STYLE_KEYS), undefined) || undefined,
      },
      characters: (obj.characters as unknown[]) ?? (obj.identidade_visual_personagens as unknown[]) ?? [],
      scenes,
    },
  };
}

export function parseProjectJSON(jsonString: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonString);
    return validateProject(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { valid: false, error: `Erro ao analisar JSON: ${msg}` };
  }
}
