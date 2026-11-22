import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookCard, CategoryCard } from '../components/catalog';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';
import { categoryService } from '../services/categoryService';
import type { CatalogBook, CatalogCategory } from '../types/catalog';

export function CategoriesPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (slug) {
          const data = await categoryService.getBooks(slug, { limit: 24 });
          if (active) {
            setSelectedCategory(data.category);
            setBooks(data.items);
          }
        } else {
          const list = await categoryService.list();
          if (active) {
            setCategories(list);
            setSelectedCategory(null);
            setBooks([]);
          }
        }
      } catch (err) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar categoria.');
        }
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
        {slug ? (
          <>
            <div className="space-y-2">
              <Link to="/categorias" className="text-xs font-medium text-brand-muted hover:text-white">
                ← Todas as categorias
              </Link>
              <h1 className="text-3xl font-extrabold text-white">
                {selectedCategory?.name ?? 'Categoria'}
              </h1>
              {selectedCategory?.description && (
                <p className="text-sm text-brand-muted">{selectedCategory.description}</p>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="card" />
                ))}
              </div>
            ) : errorMsg ? (
              <EmptyState title="Categoria não encontrada." description={errorMsg} />
            ) : books.length === 0 ? (
              <EmptyState
                title="Nenhuma história nesta categoria ainda."
                description="Esta categoria ainda não possui livros publicados no catálogo."
                action={<Button onClick={() => navigate('/catalogo')}>Explorar catálogo completo</Button>}
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    title={book.title}
                    author={book.authors.map((a) => a.name).join(', ')}
                    category={selectedCategory?.name ?? ''}
                    coverUrl={book.coverImage}
                    averageRating={book.rating}
                    isFreeEligible={book.isFreeEligible}
                    isFavorite={book.isFavorite}
                    onClick={() => navigate(`/livro/${book.slug}`)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Encontre seu universo</h1>
              <p className="mt-1 text-sm text-brand-muted">
                Explore as categorias oficiais do Biblioflix.
              </p>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : errorMsg ? (
              <EmptyState title="Erro ao carregar categorias." description={errorMsg} />
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {categories.map((cat, idx) => (
                  <CategoryCard
                    key={cat.id}
                    index={idx + 1}
                    name={cat.name}
                    slug={cat.slug}
                    description={`${cat.description} • ${cat.bookCount ?? 0} livro(s)`}
                    onClick={() => navigate(`/categorias/${cat.slug}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
