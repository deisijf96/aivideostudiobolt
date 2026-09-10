import type { SceneStatus } from './types';

const MESSAGES: Record<SceneStatus, string> = {
  pending: 'Aguardando processamento...',
  validating: 'Validando cena...',
  opening_flow: 'Abrindo Google Flow...',
  generating_image: 'Enviando prompt da imagem...',
  waiting_image: 'Gerando imagem...',
  image_completed: 'Imagem concluída.',
  generating_video: 'Preparando animação...',
  waiting_video: 'Gerando vídeo...',
  video_completed: 'Vídeo concluído.',
  downloading: 'Baixando vídeo...',
  downloaded: 'Vídeo salvo.',
  completed: 'Cena concluída.',
  failed: 'Falha ao processar cena.',
  paused: 'Pausado.',
  skipped: 'Cena ignorada.',
  needs_user_action: 'A automação precisa da sua atenção.',
};

export function getStatusMessage(status: SceneStatus, sceneNumber?: number): string {
  const msg = MESSAGES[status] || status;
  if (sceneNumber !== undefined) {
    const padded = String(sceneNumber).padStart(2, '0');
    if (status === 'completed') return `Cena ${padded} concluída.`;
    if (status === 'validating') return `Preparando cena ${padded}...`;
    if (status === 'generating_image') return `Enviando prompt da imagem da cena ${padded}...`;
    if (status === 'waiting_image') return `Gerando imagem da cena ${padded}...`;
    if (status === 'image_completed') return `Imagem da cena ${padded} concluída.`;
    if (status === 'generating_video') return `Enviando prompt de animação da cena ${padded}...`;
    if (status === 'waiting_video') return `Gerando vídeo da cena ${padded}...`;
    if (status === 'downloading') return `Baixando vídeo da cena ${padded}...`;
    if (status === 'downloaded') return `Vídeo da cena ${padded} salvo.`;
  }
  return msg;
}

export function getStatusLabel(status: SceneStatus): string {
  const labels: Record<string, string> = {
    pending: 'AGUARDANDO',
    validating: 'VALIDANDO',
    opening_flow: 'ABRINDO FLOW',
    generating_image: 'GERANDO IMAGEM',
    waiting_image: 'AGUARDANDO IMAGEM',
    image_completed: 'IMAGEM CONCLUÍDA',
    generating_video: 'GERANDO VÍDEO',
    waiting_video: 'AGUARDANDO VÍDEO',
    video_completed: 'VÍDEO CONCLUÍDO',
    downloading: 'BAIXANDO',
    downloaded: 'BAIXADO',
    completed: 'CONCLUÍDA',
    failed: 'FALHOU',
    paused: 'PAUSADA',
    skipped: 'IGNORADA',
    needs_user_action: 'AÇÃO NECESSÁRIA',
  };
  return labels[status] || status.toUpperCase();
}
