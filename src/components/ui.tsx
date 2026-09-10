import { type ReactNode } from 'react';

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-slate-700 text-slate-400',
    validating: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
    opening_flow: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
    generating_image: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
    waiting_image: 'bg-amber-900/50 text-amber-300 border border-amber-700/50',
    image_completed: 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/50',
    generating_video: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',
    waiting_video: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',
    video_completed: 'bg-teal-900/50 text-teal-300 border border-teal-700/50',
    downloading: 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50',
    downloaded: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    completed: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    failed: 'bg-red-900/50 text-red-300 border border-red-700/50',
    paused: 'bg-slate-700 text-slate-300 border border-slate-600',
    skipped: 'bg-slate-700 text-slate-500',
    needs_user_action: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
    processing: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  };

  const cls = colors[status] ?? 'bg-slate-700 text-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

export function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <span className="text-emerald-400 text-lg" title="Concluído">✓</span>;
  if (status === 'failed') return <span className="text-red-400 text-lg" title="Falhou">✕</span>;
  if (status === 'pending') return <span className="text-slate-600 text-lg" title="Aguardando">—</span>;
  if (status === 'skipped') return <span className="text-slate-600 text-lg" title="Ignorado">—</span>;
  if (status === 'paused' || status === 'needs_user_action') return <span className="text-yellow-400 text-lg" title="Pausado">⏸</span>;
  return <span className="text-amber-400 text-lg animate-pulse" title="Processando">⏳</span>;
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    default: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500',
    danger: 'bg-red-600 hover:bg-red-500 text-white border border-red-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-slate-600">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md">{description}</p>
    </div>
  );
}
