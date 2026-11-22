import { ProgressBar } from './ProgressBar';

export interface LoadingScreenProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  progress?: number;
}

export function LoadingScreen({
  eyebrow = 'CARREGANDO',
  title = 'Preparando suas próximas histórias...',
  description = 'Buscando livros e organizando o catálogo para você.',
  progress = 42,
}: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[55vh] w-full flex-col items-center justify-center px-6 text-center"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-accent">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-brand-muted">{description}</p>
      <div className="mt-6 w-full max-w-xs">
        <ProgressBar value={progress} />
      </div>
    </div>
  );
}
