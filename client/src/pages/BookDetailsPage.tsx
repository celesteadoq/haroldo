import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookCard, BookCover } from '../components/catalog';
import { useToast } from '../components/feedback';
import { Badge, Button, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';
import { bookService } from '../services/bookService';
import { libraryService } from '../services/libraryService';
import { offlineService } from '../services/offlineService';
import type { CatalogBook } from '../types/catalog';

export function BookDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [book, setBook] = useState<CatalogBook | null>(null);
  const [related, setRelated] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadBook = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [bookData, relatedData] = await Promise.all([
        bookService.getBySlug(slug),
        bookService.getRelated(slug),
      ]);
      setBook(bookData);
      setRelated(relatedData);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Livro não encontrado.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadBook();
  }, [loadBook]);

  async function handleToggleFavorite() {
    if (!book) return;
    if (!isAuthenticated) {
      navigate('/entrar', { state: { from: `/livro/${book.slug}` } });
      return;
    }

    try {
      setActionLoading(true);
      if (book.isFavorite) {
        await bookService.removeFavorite(book.id);
      } else {
        await bookService.addFavorite(book.id);
      }
      setBook((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : prev));
      showToast({
        type: 'success',
        title: book.isFavorite ? 'Removido dos favoritos' : 'Uma história para guardar.',
        message: book.title,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar favorito',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddToLibrary() {
    if (!book) return;
    if (!isAuthenticated) {
      navigate('/entrar', { state: { from: `/livro/${book.slug}` } });
      return;
    }

    try {
      setActionLoading(true);
      await libraryService.addToLibrary(book.id, 'WANT_TO_READ');
      showToast({
        type: 'success',
        title: 'Adicionado à biblioteca',
        message: `${book.title} foi salvo em Quero ler.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao adicionar à biblioteca',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMonthlyUnlock() {
    if (!book) return;
    if (!isAuthenticated) {
      navigate('/entrar', { state: { from: `/livro/${book.slug}` } });
      return;
    }

    try {
      setActionLoading(true);
      const res = await bookService.unlockMonthlyBook(book.slug);
      showToast({
        type: 'success',
        title: res.alreadyUnlocked ? 'Livro já desbloqueado' : 'Livro mensal desbloqueado!',
        message: 'Acesso liberado na sua conta.',
      });
      await loadBook();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Não foi possível desbloquear',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveOffline() {
    if (!book) return;
    try {
      setActionLoading(true);
      await offlineService.addOfflineBook({ id: book.id, slug: book.slug, title: book.title });
      showToast({
        type: 'success',
        title: 'Salvo para leitura offline',
        message: `${book.title} foi sincronizado na sua cota offline.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Não foi possível salvar offline',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="minimal"
    >
      <div className="space-y-12">
        <Link to="/catalogo" className="inline-flex text-xs font-medium text-brand-muted hover:text-white">
          ← Explorar o catálogo
        </Link>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
            <Skeleton variant="cover" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : errorMsg || !book ? (
          <EmptyState
            title="Livro não encontrado."
            description={errorMsg ?? 'Não localizamos este título.'}
            action={<Button onClick={() => navigate('/catalogo')}>Voltar ao catálogo</Button>}
          />
        ) : (
          <>
            <section className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr] lg:gap-12 items-start">
              <div className="flex justify-center rounded-2xl bg-brand-stage p-6 border border-brand-border">
                <BookCover
                  src={book.coverImage}
                  title={book.title}
                  author={book.authors.map((a) => a.name).join(', ')}
                  size="lg"
                />
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
                    ESCOLHA DA CURADORIA
                  </span>
                  {book.ageRating && <Badge variant="neutral">{book.ageRating}</Badge>}
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {book.title}
                  </h1>
                  {book.subtitle && <p className="mt-1 text-base text-brand-muted">{book.subtitle}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-base text-gray-300">
                    {book.authors.map((author, idx) => (
                      <span key={author.id}>
                        <Link
                          to={`/autores/${author.slug}`}
                          className="hover:text-brand-accent underline-offset-4 hover:underline"
                        >
                          {author.name}
                        </Link>
                        {idx < book.authors.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-brand-gold font-medium">
                  {book.rating && <span>★ {book.rating.toFixed(1).replace('.', ',')}</span>}
                  {book.categories[0] && (
                    <>
                      <span className="text-brand-subtle">•</span>
                      <Link to={`/categorias/${book.categories[0].slug}`} className="hover:underline">
                        {book.categories[0].name}
                      </Link>
                    </>
                  )}
                  <span className="text-brand-subtle">•</span>
                  <span>{book.language}</span>
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-gray-200 max-w-2xl">
                  {book.description}
                </p>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-brand-border bg-brand-surface p-4 text-xs">
                  <div>
                    <dt className="text-brand-subtle">Editora</dt>
                    <dd className="mt-1 font-semibold text-white">{book.publisher ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-brand-subtle">Publicação</dt>
                    <dd className="mt-1 font-semibold text-white">{book.publicationYear ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-brand-subtle">Idioma</dt>
                    <dd className="mt-1 font-semibold text-white">{book.language}</dd>
                  </div>
                  <div>
                    <dt className="text-brand-subtle">Páginas</dt>
                    <dd className="mt-1 font-semibold text-white">{book.pageCount ?? '—'}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button variant="primary" onClick={() => navigate(`/leitor/${book.slug}`)}>
                    {book.access.canReadFull || book.access.canReadPreview
                      ? 'Ler agora →'
                      : 'Desbloquear leitura →'}
                  </Button>

                  <Button
                    variant="secondary"
                    disabled={actionLoading}
                    onClick={() => void handleAddToLibrary()}
                  >
                    + Adicionar à biblioteca
                  </Button>

                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => void handleToggleFavorite()}
                  >
                    {book.isFavorite ? '♥ Favoritado' : '♡ Favoritar'}
                  </Button>

                  {book.access.canUnlockMonthly && (
                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => void handleMonthlyUnlock()}
                    >
                      Usar desbloqueio do mês
                    </Button>
                  )}

                  {book.access.hasOfflineAccess && book.hasFullContent && (
                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => void handleSaveOffline()}
                    >
                      Salvar offline
                    </Button>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-xs text-brand-muted">
                    {book.isFreeEligible
                      ? 'Prévia editorial disponível no plano Gratuito e elegível para desbloqueio mensal.'
                      : `Disponível a partir do plano ${book.access.requiredPlanName}.`}
                  </p>
                  {!book.access.canReadFull && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/planos')}>
                      Conhecer planos
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {related.length > 0 && (
              <section className="space-y-5 pt-6 border-t border-brand-border">
                <h2 className="text-xl font-bold text-white">Histórias relacionadas</h2>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {related.map((item) => (
                    <BookCard
                      key={item.id}
                      title={item.title}
                      author={item.authors.map((a) => a.name).join(', ')}
                      category={item.categories[0]?.name ?? ''}
                      coverUrl={item.coverImage}
                      averageRating={item.rating}
                      isFreeEligible={item.isFreeEligible}
                      isFavorite={item.isFavorite}
                      onClick={() => navigate(`/livro/${item.slug}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
