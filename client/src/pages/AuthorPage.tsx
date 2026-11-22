import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookCard } from '../components/catalog';
import { Avatar, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';
import { authorService } from '../services/authorService';
import type { CatalogAuthor, CatalogBook } from '../types/catalog';

export function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<CatalogAuthor | null>(null);
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await authorService.getBooks(slug!, { limit: 24 });
        if (active) {
          setAuthor(data.author);
          setBooks(data.items);
        }
      } catch (err) {
        if (active) setErrorMsg(err instanceof Error ? err.message : 'Autor não encontrado.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="minimal"
    >
      <div className="space-y-8">
        <Link to="/catalogo" className="text-xs font-medium text-brand-muted hover:text-white">
          ← Explorar o catálogo
        </Link>

        {loading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : errorMsg || !author ? (
          <EmptyState title="Autor não encontrado." description={errorMsg ?? 'Tente outro autor.'} />
        ) : (
          <>
            <section className="rounded-xl border border-brand-border bg-brand-surface p-6 flex items-start gap-4">
              <Avatar name={author.name} src={author.photoUrl} size="lg" />
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
                  AUTOR
                </span>
                <h1 className="text-3xl font-extrabold text-white">{author.name}</h1>
                {author.biography && (
                  <p className="text-sm text-brand-muted max-w-2xl">{author.biography}</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">Obras no catálogo</h2>
              {books.length === 0 ? (
                <EmptyState
                  title="Nenhuma obra publicada."
                  description="Este autor ainda não possui obras ativas no catálogo."
                />
              ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      title={book.title}
                      author={author.name}
                      category={book.categories[0]?.name ?? ''}
                      coverUrl={book.coverImage}
                      averageRating={book.rating}
                      isFreeEligible={book.isFreeEligible}
                      isFavorite={book.isFavorite}
                      onClick={() => navigate(`/livro/${book.slug}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
