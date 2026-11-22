import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCover } from '../catalog/BookCover';
import { useToast } from '../feedback';
import { Badge, Button, EmptyState, ProgressBar, Skeleton } from '../ui';
import { offlineService } from '../../services/offlineService';
import type { OfflineBooksResponse } from '../../types/library';

export function OfflineBooksManager() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<OfflineBooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadOffline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await offlineService.listOfflineBooks();
      setData(res);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar livros offline',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadOffline();
  }, [loadOffline]);

  async function handleRemove(bookId: string) {
    try {
      setRemovingId(bookId);
      await offlineService.removeOfflineBook(bookId);
      showToast({
        type: 'info',
        title: 'Livro removido da lista offline',
        message: 'Seu progresso de leitura foi preservado.',
      });
      await loadOffline();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao remover livro offline',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (!data) return null;

  return (
    <section className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Gerenciamento offline</h2>
          <p className="text-xs text-brand-muted">
            {data.hasOfflineReading
              ? `${data.used} de ${data.limit} livro(s) sincronizados em metadados locais.`
              : 'Seu plano atual (Gratuito) não inclui leitura offline.'}
          </p>
        </div>

        {!data.hasOfflineReading && (
          <Button size="sm" variant="primary" onClick={() => navigate('/planos')}>
            Conhecer planos
          </Button>
        )}
      </div>

      {data.hasOfflineReading && (
        <ProgressBar
          value={data.limit > 0 ? (data.used / data.limit) * 100 : 0}
          label="Cota offline utilizada"
          showLabel
        />
      )}

      {data.items.length === 0 ? (
        <EmptyState
          eyebrow="OFFLINE"
          title="Nenhum livro salvo offline."
          description={
            data.hasOfflineReading
              ? 'Adicione títulos autorizados com conteúdo completo disponível pela página de detalhes do livro.'
              : 'Faça upgrade para o plano Básico (até 3 livros) ou Premium (até 10 livros).'
          }
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col justify-between gap-3 rounded-lg border border-brand-border bg-brand-bg p-3.5 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookCover
                  src={entry.book.coverImage}
                  title={entry.book.title}
                  size="sm"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{entry.book.title}</p>
                  <p className="truncate text-xs text-brand-muted">
                    {entry.book.authors.map((a) => a.name).join(', ')}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="info">
                      {entry.book.hasFullContent ? 'Metadados sincronizados' : 'Apenas metadados'}
                    </Badge>
                    <span className="text-[11px] text-brand-subtle">
                      {new Date(entry.syncedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/leitor/${entry.book.slug}`)}
                >
                  Abrir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={removingId === entry.bookId}
                  onClick={() => void handleRemove(entry.bookId)}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
