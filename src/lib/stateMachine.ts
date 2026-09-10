import type { SceneStatus } from './types';

const STATE_ORDER: SceneStatus[] = [
  'pending',
  'validating',
  'opening_flow',
  'generating_image',
  'waiting_image',
  'image_completed',
  'generating_video',
  'waiting_video',
  'video_completed',
  'downloading',
  'downloaded',
  'completed',
];

export function nextState(current: SceneStatus): SceneStatus {
  const idx = STATE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STATE_ORDER.length - 1) return 'completed';
  return STATE_ORDER[idx + 1];
}

export function isTerminal(status: SceneStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'skipped';
}

export function isPaused(status: SceneStatus): boolean {
  return status === 'paused' || status === 'needs_user_action';
}

export function canTransition(from: SceneStatus, to: SceneStatus): boolean {
  if (to === 'failed' || to === 'paused' || to === 'needs_user_action' || to === 'skipped') {
    return true;
  }
  const fromIdx = STATE_ORDER.indexOf(from);
  const toIdx = STATE_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1;
}

export const ALL_STATUSES = STATE_ORDER;
