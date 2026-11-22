import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCover } from '../components/catalog';
import { ConfirmModal, useToast } from '../components/feedback';
import { Button, EmptyState, ProgressBar, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { UserLayout } from '../layouts';
import { readingService } from '../services/readingService';
import type { ReadingHistoryItem } from '../types/library';

export function HistoryPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [removeBookId, setRemoveBookId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setItems(await readingService.getHistory());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (!user) return null;

  return (
    <UserLayout
      authState={user.role === 'ADMIN' ? 'admin' : 'user'}
      userName={user.name}
      onLogout={() => void logout()}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Suas últimas leituras</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Suas leituras mais recentes aparecem primeiro.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/biblioteca')}>
            Voltar à biblioteca
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : errorMsg ? (
          <EmptyState
            eyebrow="ERRO"
            title="Não foi possível carregar o histórico."
            description={errorMsg}
            action={<Button onClick={() => void loadHistory()}>Tentar novamente</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Seu histórico está vazio."
            description="Quando você abrir uma história no leitor, ela aparecerá aqui."
            action={<Button onClick={() => navigate('/catalogo')}>Explorar catálogo</Button>}
          />
        ) : (
          <div className="space-y-4">
            {items.map((row) => (
              <article
                key={row.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-brand-border bg-brand-surface p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <BookCover
                    src={row.book.coverImage}
                    title={row.book.title}
                    size="sm"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h2 className="truncate text-base font-bold text-white">{row.book.title}</h2>
                    <p className="text-xs text-brand-muted">
                      Página {row.lastPage} de {row.totalPages} ({Math.round(row.progressPercentage)}%) •{' '}
                      {new Date(row.lastReadAt).toLocaleString('pt-BR')}
                    </p>
                    <div className="max-w-sm">
                      <ProgressBar value={row.progressPercentage} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" onClick={() => navigate(`/leitor/${row.book.slug}`)}>
                    Continuar lendo →
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRemoveBookId(row.bookId)}>
                    Remover
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(removeBookId)}
        onClose={() => setRemoveBookId(null)}
        onConfirm={async () => {
          if (!removeBookId) return;
          try {
            await readingService.removeHistoryEntry(removeBookId);
            setRemoveBookId(null);
            showToast({ type: 'info', title: 'Registro removido do histórico' });
            await loadHistory();
          } catch (err) {
            showToast({
              type: 'error',
              title: 'Erro ao remover histórico',
              message: err instanceof Error ? err.message : undefined,
            });
          }
        }}
        title="Remover do histórico?"
        description="Este título deixará de aparecer na sua lista de leituras recentes."
        confirmLabel="Remover"
        cancelLabel="Cancelar"
      />
    </UserLayout>
  );
}
