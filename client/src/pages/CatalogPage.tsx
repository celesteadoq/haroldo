import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookCard, CategoryCard } from '../components/catalog';
import { Modal, useToast } from '../components/feedback';
import { Button, EmptyState, Input, Radio, Select, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { AppShell } from '../layouts';
import { authorService } from '../services/authorService';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import type {
  BookAccessTier,
  CatalogAuthor,
  CatalogBook,
  CatalogCategory,
  PaginatedBooksResponse,
} from '../types/catalog';

const SORT_OPTIONS = [
  { value: 'relevance:asc', label: 'Mais populares' },
  { value: 'title:asc', label: 'Título: A–Z' },
  { value: 'title:desc', label: 'Título: Z–A' },
  { value: 'rating:desc', label: 'Melhor avaliação' },
  { value: 'recent:desc', label: 'Mais recentes' },
];

export function CatalogPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') ?? '';
  const activeCategory = searchParams.get('category') ?? '';
  const activeAuthor = searchParams.get('author') ?? '';
  const activeAccessLevel = (searchParams.get('accessLevel') as BookAccessTier | '') || '';
  const activeAvailability =
    (searchParams.get('availability') as 'all' | 'free' | 'included') || 'all';
  const activeMinRating = searchParams.get('minRating') ?? '';
  const activeYear = searchParams.get('year') ?? '';
  const activeSort =
    (searchParams.get('sort') as 'relevance' | 'title' | 'rating' | 'recent') || 'relevance';
  const activeOrder = (searchParams.get('order') as 'asc' | 'desc') || 'asc';
  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [authors, setAuthors] = useState<CatalogAuthor[]>([]);
  const [featured, setFeatured] = useState<CatalogBook[]>([]);
  const [booksPage, setBooksPage] = useState<PaginatedBooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, val] of Object.entries(updates)) {
        if (!val) next.delete(key);
        else next.set(key, val);
      }
      if (!('page' in updates)) next.set('page', '1');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (debouncedSearch !== initialSearch) {
      updateParam({ search: debouncedSearch.trim() || null });
    }
  }, [debouncedSearch, initialSearch, updateParam]);

  useEffect(() => {
    void categoryService.list().then(setCategories).catch(() => undefined);
    void authorService.list().then(setAuthors).catch(() => undefined);
    void bookService.getFeatured().then(setFeatured).catch(() => undefined);
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await bookService.list({
        page: currentPage,
        limit: 12,
        search: initialSearch || undefined,
        category: activeCategory || undefined,
        author: activeAuthor || undefined,
        accessLevel: activeAccessLevel || undefined,
        year: activeYear ? Number(activeYear) : undefined,
        minRating: activeMinRating ? Number(activeMinRating) : undefined,
        availability: activeAvailability,
        sort: activeSort,
        order: activeOrder,
      });
      setBooksPage(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar o catálogo.');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    initialSearch,
    activeCategory,
    activeAuthor,
    activeAccessLevel,
    activeYear,
    activeMinRating,
    activeAvailability,
    activeSort,
    activeOrder,
  ]);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  async function handleToggleFavorite(book: CatalogBook) {
    if (!isAuthenticated) {
      navigate('/entrar', { state: { from: '/catalogo' } });
      return;
    }

    try {
      if (book.isFavorite) {
        await bookService.removeFavorite(book.id);
      } else {
        await bookService.addFavorite(book.id);
      }
      setBooksPage((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.id === book.id ? { ...item, isFavorite: !book.isFavorite } : item
              ),
            }
          : prev
      );
      showToast({
        type: 'success',
        title: book.isFavorite ? 'Removido dos favoritos' : 'Salvo nos favoritos',
        message: book.title,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar favorito',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  }

  function clearAllFilters() {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  const hasActiveFilters = Boolean(
    initialSearch ||
      activeCategory ||
      activeAuthor ||
      activeAccessLevel ||
      activeAvailability !== 'all' ||
      activeMinRating ||
      activeYear
  );

  const heroBook = featured[0];

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="minimal"
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Encontre sua próxima história.
          </h1>
          <p className="text-sm sm:text-base text-brand-muted">
            Explore o catálogo e descubra novos mundos, uma página de cada vez.
          </p>

          {heroBook && !hasActiveFilters && (
            <div className="rounded-xl border border-brand-border bg-gradient-to-r from-brand-surface via-[#151B2A] to-brand-promo p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
                  DESTAQUE EDITORIAL
                </span>
                <h2 className="mt-1 text-xl font-bold text-white">{heroBook.title}</h2>
                <p className="mt-1 text-xs sm:text-sm text-brand-muted max-w-2xl line-clamp-2">
                  {heroBook.description}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/livro/${heroBook.slug}`)}
                className="shrink-0"
              >
                Ver detalhes →
              </Button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateParam({ search: searchInput.trim() || null });
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1">
              <Input
                placeholder="Buscar por título, autor ou categoria"
                aria-label="Buscar livros"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                rightElement={
                  searchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        updateParam({ search: null });
                      }}
                      className="text-xs text-brand-muted hover:text-white px-2"
                    >
                      Limpar
                    </button>
                  ) : null
                }
              />
            </div>
            <Button type="submit" variant="primary" className="sm:w-32">
              Buscar
            </Button>
          </form>
        </section>

        <div className="flex items-center gap-3 lg:hidden">
          <Button variant="secondary" size="sm" fullWidth onClick={() => setMobileFiltersOpen(true)}>
            Filtros ▾
          </Button>
          <div className="w-full">
            <Select
              aria-label="Ordenar catálogo"
              value={`${activeSort}:${activeOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split(':');
                updateParam({ sort, order });
              }}
              options={SORT_OPTIONS}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block space-y-6">
            <h2 className="text-sm font-bold text-white">Refine sua busca</h2>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-brand-muted">Gênero</p>
              <Radio
                name="cat-filter"
                label="Todos os gêneros"
                checked={!activeCategory}
                onChange={() => updateParam({ category: null })}
              />
              {categories.map((cat) => (
                <Radio
                  key={cat.id}
                  name="cat-filter"
                  label={`${cat.name} (${cat.bookCount ?? 0})`}
                  checked={activeCategory === cat.slug}
                  onChange={() => updateParam({ category: cat.slug })}
                />
              ))}
            </div>

            <Select
              label="Autor"
              value={activeAuthor}
              onChange={(e) => updateParam({ author: e.target.value || null })}
              options={[
                { value: '', label: 'Todos os autores' },
                ...authors.map((a) => ({ value: a.slug, label: a.name })),
              ]}
            />

            <Select
              label="Nível de acesso"
              value={activeAccessLevel}
              onChange={(e) => updateParam({ accessLevel: e.target.value || null })}
              options={[
                { value: '', label: 'Todos os níveis' },
                { value: 'FREE', label: 'Gratuito' },
                { value: 'BASIC', label: 'Básico' },
                { value: 'PREMIUM', label: 'Premium' },
              ]}
            />

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-brand-muted">Disponibilidade</p>
              <Radio
                name="avail-filter"
                label="Todos os livros"
                checked={activeAvailability === 'all'}
                onChange={() => updateParam({ availability: null })}
              />
              <Radio
                name="avail-filter"
                label="Gratuitos / Prévia"
                checked={activeAvailability === 'free'}
                onChange={() => updateParam({ availability: 'free' })}
              />
              <Radio
                name="avail-filter"
                label="Incluídos no meu plano"
                checked={activeAvailability === 'included'}
                onChange={() => updateParam({ availability: 'included' })}
              />
            </div>

            <Select
              label="Avaliação editorial"
              value={activeMinRating}
              onChange={(e) => updateParam({ minRating: e.target.value || null })}
              options={[
                { value: '', label: 'Todas as avaliações' },
                { value: '4.8', label: '4,8 ou mais' },
                { value: '4.9', label: '4,9 ou mais' },
              ]}
            />

            <Input
              label="Ano de publicação"
              type="number"
              placeholder="Ex.: 2020"
              value={activeYear}
              onChange={(e) => updateParam({ year: e.target.value || null })}
            />

            <Button variant="outline" size="sm" fullWidth onClick={clearAllFilters}>
              Limpar filtros
            </Button>
          </aside>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-brand-muted">
                {booksPage
                  ? `${booksPage.total} ${booksPage.total === 1 ? 'livro encontrado' : 'livros para descobrir'}`
                  : 'Carregando catálogo...'}
              </p>

              <div className="hidden lg:block w-52">
                <Select
                  aria-label="Ordenar resultados"
                  value={`${activeSort}:${activeOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split(':');
                    updateParam({ sort, order });
                  }}
                  options={SORT_OPTIONS}
                />
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} variant="card" />
                ))}
              </div>
            )}

            {!loading && errorMsg && (
              <EmptyState
                eyebrow="ERRO AO CARREGAR"
                title="Não foi possível carregar o catálogo."
                description={errorMsg}
                action={<Button onClick={() => void fetchCatalog()}>Tentar novamente</Button>}
              />
            )}

            {!loading && !errorMsg && booksPage && booksPage.items.length === 0 && (
              <EmptyState
                title="Nenhuma história por aqui."
                description="Não há livros disponíveis para este filtro. Tente outro gênero, título ou autor."
                action={<Button onClick={clearAllFilters}>Limpar busca e filtros</Button>}
              />
            )}

            {!loading && !errorMsg && booksPage && booksPage.items.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
                  {booksPage.items.map((book) => (
                    <BookCard
                      key={book.id}
                      title={book.title}
                      author={book.authors.map((a) => a.name).join(', ')}
                      category={book.categories[0]?.name ?? 'Catálogo'}
                      coverUrl={book.coverImage}
                      averageRating={book.rating}
                      isFreeEligible={book.isFreeEligible}
                      availabilityLabel={
                        book.access.canReadFull || book.access.canReadPreview
                          ? 'Disponível'
                          : book.access.requiredPlanName
                      }
                      isFavorite={book.isFavorite}
                      onToggleFavorite={() => void handleToggleFavorite(book)}
                      onClick={() => navigate(`/livro/${book.slug}`)}
                    />
                  ))}
                </div>

                {booksPage.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={booksPage.page <= 1}
                      onClick={() => updateParam({ page: String(booksPage.page - 1) })}
                    >
                      ← Anterior
                    </Button>
                    <span className="text-xs text-brand-muted">
                      Página {booksPage.page} de {booksPage.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={booksPage.page >= booksPage.totalPages}
                      onClick={() => updateParam({ page: String(booksPage.page + 1) })}
                    >
                      Próxima →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <section className="space-y-5 pt-4 border-t border-brand-border">
            <div>
              <h2 className="text-xl font-bold text-white">Encontre seu universo</h2>
              <p className="text-sm text-brand-muted">Um gênero para cada momento.</p>
            </div>
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
          </section>
        )}
      </div>

      <Modal
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filtrar catálogo"
        description="Escolha gênero, autor, nível de acesso e disponibilidade."
        footer={
          <>
            <Button fullWidth onClick={() => setMobileFiltersOpen(false)}>
              Aplicar filtros
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                clearAllFilters();
                setMobileFiltersOpen(false);
              }}
            >
              Limpar filtros
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Gênero"
            value={activeCategory}
            onChange={(e) => updateParam({ category: e.target.value || null })}
            options={[
              { value: '', label: 'Todos os gêneros' },
              ...categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.bookCount ?? 0})` })),
            ]}
          />
          <Select
            label="Autor"
            value={activeAuthor}
            onChange={(e) => updateParam({ author: e.target.value || null })}
            options={[
              { value: '', label: 'Todos os autores' },
              ...authors.map((a) => ({ value: a.slug, label: a.name })),
            ]}
          />
          <Select
            label="Nível de acesso"
            value={activeAccessLevel}
            onChange={(e) => updateParam({ accessLevel: e.target.value || null })}
            options={[
              { value: '', label: 'Todos os níveis' },
              { value: 'FREE', label: 'Gratuito' },
              { value: 'BASIC', label: 'Básico' },
              { value: 'PREMIUM', label: 'Premium' },
            ]}
          />
          <Select
            label="Disponibilidade"
            value={activeAvailability}
            onChange={(e) =>
              updateParam({ availability: e.target.value === 'all' ? null : e.target.value })
            }
            options={[
              { value: 'all', label: 'Todos os livros' },
              { value: 'free', label: 'Gratuitos / Prévia' },
              { value: 'included', label: 'Incluídos no meu plano' },
            ]}
          />
        </div>
      </Modal>
    </AppShell>
  );
}
