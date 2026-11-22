import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCard } from '../components/catalog';
import { useToast } from '../components/feedback';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { UserLayout } from '../layouts';
import { bookService } from '../services/bookService';
import { libraryService } from '../services/libraryService';
import type { FavoriteListItem } from '../types/library';

export function FavoritesPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<FavoriteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setItems(await libraryService.getFavorites());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar favoritos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

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
            <h1 className="text-3xl font-extrabold text-white">Histórias que você quer guardar</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Seus livros favoritados sincronizados com sua conta.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/biblioteca')}>
            Ir para minha biblioteca
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : errorMsg ? (
          <EmptyState
            eyebrow="ERRO"
            title="Não foi possível carregar seus favoritos."
            description={errorMsg}
            action={<Button onClick={() => void loadFavorites()}>Tentar novamente</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum favorito ainda."
            description="Toque no coração em qualquer livro do catálogo para salvá-lo aqui."
            action={<Button onClick={() => navigate('/catalogo')}>Explorar catálogo</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((fav) => (
              <BookCard
                key={fav.id}
                title={fav.book.title}
                author={fav.book.authors.map((a) => a.name).join(', ')}
                category={fav.book.categories[0]?.name ?? ''}
                coverUrl={fav.book.coverImage}
                averageRating={fav.book.averageRating}
                isFreeEligible={fav.book.isFreeEligible}
                isFavorite
                onToggleFavorite={async () => {
                  try {
                    await bookService.removeFavorite(fav.book.id);
                    showToast({ type: 'info', title: 'Removido dos favoritos' });
                    await loadFavorites();
                  } catch (err) {
                    showToast({
                      type: 'error',
                      title: 'Erro ao remover favorito',
                      message: err instanceof Error ? err.message : undefined,
                    });
                  }
                }}
                onClick={() => navigate(`/livro/${fav.book.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
