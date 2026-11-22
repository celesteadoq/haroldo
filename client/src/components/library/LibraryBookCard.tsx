import { BookCover } from '../catalog/BookCover';
import { Badge, Button, ProgressBar } from '../ui';
import type { LibraryItem, ReadingStatus } from '../../types/library';
import { ReadingStatusSelector } from './ReadingStatusSelector';

export interface LibraryBookCardProps {
  item: LibraryItem;
  updating?: boolean;
  onContinueReading: () => void;
  onOpenDetails: () => void;
  onChangeStatus: (status: ReadingStatus) => void;
  onRemove: () => void;
}

const statusLabelMap: Record<ReadingStatus, string> = {
  WANT_TO_READ: 'Quero ler',
  READING: 'Lendo',
  COMPLETED: 'Concluído',
};

export function LibraryBookCard({
  item,
  updating = false,
  onContinueReading,
  onOpenDetails,
  onChangeStatus,
  onRemove,
}: LibraryBookCardProps) {
  const { book } = item;
  const canMarkCompleted = book.hasFullContent && book.access.canReadFull;

  return (
    <article className="flex flex-col justify-between gap-4 rounded-xl border border-brand-border bg-brand-surface p-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <button type="button" onClick={onOpenDetails} className="shrink-0 text-left">
          <BookCover
            src={book.coverImage}
            title={book.title}
            author={book.authors.map((a) => a.name).join(', ')}
            size="sm"
          />
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenDetails}
              className="truncate text-left text-base font-bold text-white hover:text-brand-accent transition-colors"
            >
              {book.title}
            </button>
            <Badge variant={item.status === 'COMPLETED' ? 'success' : 'neutral'}>
              {statusLabelMap[item.status]}
            </Badge>
          </div>

          <p className="truncate text-xs text-brand-muted">
            {book.authors.map((a) => a.name).join(', ')}
            {book.categories[0] ? ` • ${book.categories[0].name}` : ''}
          </p>

          <div className="max-w-md space-y-1">
            <ProgressBar value={item.progressPercentage} />
            <p className="text-xs text-brand-subtle">
              {Math.round(item.progressPercentage)}% concluído
              {item.currentPage > 0 ? ` • Página ${item.currentPage} de ${item.totalPages}` : ''}
              {` • Atualizado em ${new Date(item.lastReadAt).toLocaleDateString('pt-BR')}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onContinueReading}
            className="inline-flex text-xs font-semibold text-brand-accent hover:text-brand-primary transition-colors"
          >
            {item.currentPage > 0 ? 'Continuar lendo →' : 'Começar leitura →'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:w-48 shrink-0">
        <ReadingStatusSelector
          value={item.status}
          canMarkCompleted={canMarkCompleted}
          disabled={updating}
          onChange={onChangeStatus}
        />
        <Button type="button" variant="outline" size="sm" disabled={updating} onClick={onRemove}>
          Remover da biblioteca
        </Button>
      </div>
    </article>
  );
}
