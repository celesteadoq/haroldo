import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookCard } from '../components/catalog';
import { ConfirmModal, useToast } from '../components/feedback';
import { LibraryBookCard } from '../components/library/LibraryBookCard';
import { OfflineBooksManager } from '../components/library/OfflineBooksManager';
import { ReadingStatistics } from '../components/library/ReadingStatistics';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { UserLayout } from '../layouts';
import { bookService } from '../services/bookService';
import { libraryService } from '../services/libraryService';
import type { FavoriteListItem, LibraryResponse, ReadingStatus } from '../types/library';

type LibraryTab = 'ALL' | 'READING' | 'WANT_TO_READ' | 'COMPLETED' | 'FAVORITES';

export function LibraryPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = (searchParams.get('tab') ?? 'ALL').toUpperCase();
  const activeTab: LibraryTab = ['ALL', 'READING', 'WANT_TO_READ', 'COMPLETED', 'FAVORITES'].includes(
    rawTab
  )
    ? (rawTab as LibraryTab)
    : 'ALL';

  const [libraryData, setLibraryData] = useState<LibraryResponse | null>(null);
  const [favorites, setFavorites] = useState<FavoriteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null);
  const [confirmRemoveBookId, setConfirmRemoveBookId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const statusParam =
        activeTab === 'READING' || activeTab === 'WANT_TO_READ' || activeTab === 'COMPLETED'
          ? (activeTab as ReadingStatus)
          : undefined;

      const [lib, favs] = await Promise.all([
        libraryService.getLibrary(statusParam),
        libraryService.getFavorites(),
      ]);
      setLibraryData(lib);
      setFavorites(favs);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar sua biblioteca.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleStatusChange(bookId: string, status: ReadingStatus) {
    try {
      setUpdatingBookId(bookId);
      await libraryService.updateStatus(bookId, status);
      showToast({ type: 'success', title: 'Status atualizado' });
      await loadData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Não foi possível alterar o status',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUpdatingBookId(null);
    }
  }

  async function handleRemoveFromLibrary() {
    if (!confirmRemoveBookId) return;
    try {
      setUpdatingBookId(confirmRemoveBookId);
      await libraryService.removeFromLibrary(confirmRemoveBookId);
      setConfirmRemoveBookId(null);
      showToast({ type: 'info', title: 'Livro removido da biblioteca' });
      await loadData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao remover livro',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUpdatingBookId(null);
    }
  }

  async function handleUnfavorite(bookId: string) {
    try {
      await bookService.removeFavorite(bookId);
      showToast({ type: 'info', title: 'Removido dos favoritos' });
      await loadData();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao remover favorito',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  if (!user) return null;

  const firstName = user.name.split(' ')[0];
  const planName = user.currentSubscription?.plan.name ?? 'Gratuito';
  const counts = libraryData?.counts;

  const tabs: Array<{ key: LibraryTab; label: string }> = [
    { key: 'ALL', label: `Todos (${counts?.ALL ?? 0})` },
    { key: 'READING', label: `Lendo (${counts?.READING ?? 0})` },
    { key: 'WANT_TO_READ', label: `Quero ler (${counts?.WANT_TO_READ ?? 0})` },
    { key: 'COMPLETED', label: `Concluídos (${counts?.COMPLETED ?? 0})` },
    { key: 'FAVORITES', label: `Favoritos (${counts?.FAVORITES ?? favorites.length})` },
  ];

  return (
    <UserLayout
      authState={user.role === 'ADMIN' ? 'admin' : 'user'}
      userName={user.name}
      onLogout={() => void logout()}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Sua biblioteca, seu universo.
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            Bom ter você por aqui, {firstName}. Seu próximo capítulo está esperando.
          </p>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-brand-borderPromo bg-brand-promo p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-200">
            Plano atual: <span className="font-bold text-white">{planName}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/historico')}>
              Ver histórico
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/planos')}>
              Ver planos
            </Button>
          </div>
        </div>

        {libraryData?.stats && <ReadingStatistics stats={libraryData.stats} />}

        <div className="flex flex-wrap gap-2.5">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={activeTab === tab.key ? 'primary' : 'secondary'}
              onClick={() => setSearchParams({ tab: tab.key })}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : errorMsg ? (
          <EmptyState
            eyebrow="ERRO"
            title="Não foi possível carregar sua biblioteca."
            description={errorMsg}
            action={<Button onClick={() => void loadData()}>Tentar novamente</Button>}
          />
        ) : activeTab === 'FAVORITES' ? (
          favorites.length === 0 ? (
            <EmptyState
              title="Nenhum favorito salvo."
              description="Favorite títulos no catálogo para encontrá-los rapidamente aqui."
              action={<Button onClick={() => navigate('/catalogo')}>Explorar catálogo</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {favorites.map((fav) => (
                <BookCard
                  key={fav.id}
                  title={fav.book.title}
                  author={fav.book.authors.map((a) => a.name).join(', ')}
                  category={fav.book.categories[0]?.name ?? ''}
                  coverUrl={fav.book.coverImage}
                  averageRating={fav.book.averageRating}
                  isFreeEligible={fav.book.isFreeEligible}
                  isFavorite
                  onToggleFavorite={() => void handleUnfavorite(fav.book.id)}
                  onClick={() => navigate(`/livro/${fav.book.slug}`)}
                />
              ))}
            </div>
          )
        ) : !libraryData || libraryData.items.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'ALL'
                ? 'Sua biblioteca está começando.'
                : 'Nenhum livro neste filtro.'
            }
            description="Salve seus favoritos ou comece uma leitura. Suas histórias vão aparecer aqui."
            action={<Button onClick={() => navigate('/catalogo')}>Explorar catálogo</Button>}
          />
        ) : (
          <div className="space-y-4">
            {libraryData.items.map((item) => (
              <LibraryBookCard
                key={item.id}
                item={item}
                updating={updatingBookId === item.bookId}
                onOpenDetails={() => navigate(`/livro/${item.book.slug}`)}
                onContinueReading={() => navigate(`/leitor/${item.book.slug}`)}
                onChangeStatus={(status) => void handleStatusChange(item.bookId, status)}
                onRemove={() => setConfirmRemoveBookId(item.bookId)}
              />
            ))}
          </div>
        )}

        <OfflineBooksManager />
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmRemoveBookId)}
        onClose={() => setConfirmRemoveBookId(null)}
        onConfirm={() => void handleRemoveFromLibrary()}
        title="Remover da biblioteca?"
        description="O livro será removido da sua lista pessoal. Você pode adicioná-lo novamente pelo catálogo."
        confirmLabel="Sim, remover"
        cancelLabel="Manter na biblioteca"
      />
    </UserLayout>
  );
}
