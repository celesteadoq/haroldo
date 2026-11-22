import type { ReadingStatisticsData } from '../../types/library';

function formatReadingMinutes(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function ReadingStatistics({ stats }: { stats: ReadingStatisticsData }) {
  const hasAnyActivity =
    stats.completedCount > 0 ||
    stats.readingCount > 0 ||
    stats.wantToReadCount > 0 ||
    stats.totalPagesRead > 0;

  return (
    <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-white">Suas estatísticas de leitura</h2>
        {!hasAnyActivity && (
          <span className="text-xs text-brand-muted">
            Comece uma leitura no catálogo para acompanhar sua evolução aqui.
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-brand-border bg-brand-bg p-3.5">
          <p className="text-2xl font-extrabold text-white">{stats.completedCount}</p>
          <p className="text-xs text-brand-muted">Concluídos</p>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-bg p-3.5">
          <p className="text-2xl font-extrabold text-white">{stats.readingCount}</p>
          <p className="text-xs text-brand-muted">Em andamento</p>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-bg p-3.5">
          <p className="text-2xl font-extrabold text-white">{stats.wantToReadCount}</p>
          <p className="text-xs text-brand-muted">Quero ler</p>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-bg p-3.5">
          <p className="text-2xl font-extrabold text-white">{stats.totalPagesRead}</p>
          <p className="text-xs text-brand-muted">Páginas lidas</p>
        </div>
        <div className="rounded-lg border border-brand-border bg-brand-bg p-3.5 col-span-2 sm:col-span-1">
          <p className="text-2xl font-extrabold text-white">
            {formatReadingMinutes(stats.totalReadingSeconds)}
          </p>
          <p className="text-xs text-brand-muted">Tempo registrado</p>
        </div>
      </div>
    </section>
  );
}
