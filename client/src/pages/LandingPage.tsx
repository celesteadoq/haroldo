import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCard, BookCover, CategoryCard, PlanCard } from '../components/catalog';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import { subscriptionService } from '../services/subscriptionService';
import type { CatalogBook, CatalogCategory } from '../types/catalog';
import type { PlanItem } from '../types/subscription';

const PLATFORM_BENEFITS = [
  {
    title: 'Biblioteca organizada por status',
    description: 'Separe suas leituras entre Quero ler, Lendo e Concluídos, além de favoritos.',
  },
  {
    title: 'Progresso sincronizado na conta',
    description: 'Retome exatamente da última página em diferentes dispositivos conectados.',
  },
  {
    title: 'Planos para cada momento',
    description: 'Comece no Gratuito ou evolua para Básico ou Premium com 7 dias de teste.',
  },
  {
    title: 'Experiência confortável de leitura',
    description: 'Ajuste tamanho da fonte, espaçamento e tema Escuro, Sépia ou Claro.',
  },
];

export function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [popularBooks, setPopularBooks] = useState<CatalogBook[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<CatalogBook[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadLandingData() {
    try {
      setLoading(true);
      setLoadError(null);
      const [popular, featured, cats, planList] = await Promise.all([
        bookService.getPopular(),
        bookService.getFeatured(),
        categoryService.list(),
        subscriptionService.listPlans(),
      ]);
      setPopularBooks(popular);
      setFeaturedBooks(featured);
      setCategories(cats);
      setPlans(planList);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados iniciais.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLandingData();
  }, []);

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="full"
      containerClassName="w-full"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-brand-border bg-gradient-to-br from-brand-bg via-[#111622] to-[#1D1119]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8 lg:py-20">
          <div className="space-y-6 lg:col-span-7">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
              HISTÓRIAS SEM LIMITES. LEITURA DO SEU JEITO.
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
              Uma biblioteca inteira. Uma nova história a cada leitura.
            </h1>
            <p className="max-w-xl text-base text-brand-muted leading-relaxed">
              Descubra livros, explore novos universos e acompanhe suas leituras em uma experiência feita para quem ama ler.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" variant="primary" onClick={() => navigate('/catalogo')}>
                Explorar catálogo →
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/planos')}>
                Conhecer planos
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-4 max-w-md text-xs text-brand-muted">
              <div>
                <p className="text-base font-bold text-white">Catálogo curado</p>
                <p>Oito categorias oficiais para explorar</p>
              </div>
              <div>
                <p className="text-base font-bold text-white">Em até 3 dispositivos</p>
                <p>Leitura sincronizada na sua conta</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:col-span-5">
            {(featuredBooks.length > 0 ? featuredBooks.slice(0, 3) : popularBooks.slice(0, 3)).map(
              (item, idx) => (
                <Link
                  key={item.id}
                  to={`/livro/${item.slug}`}
                  className={`block transition-transform duration-200 hover:-translate-y-1 ${
                    idx === 1 ? 'translate-y-4' : ''
                  }`}
                >
                  <BookCover src={item.coverImage} title={item.title} />
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        {loadError && (
          <EmptyState
            eyebrow="CONEXÃO COM O CATÁLOGO"
            title="Não foi possível carregar os destaques agora."
            description={loadError}
            action={<Button onClick={() => void loadLandingData()}>Tentar novamente</Button>}
          />
        )}

        {/* Destaques */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Destaques do catálogo</h2>
              <p className="mt-1 text-sm text-brand-muted">
                As histórias que todo mundo está descobrindo.
              </p>
            </div>
            <Link to="/catalogo" className="text-xs font-semibold text-brand-accent hover:underline">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {popularBooks.map((book, idx) => (
                <BookCard
                  key={book.id}
                  rankNumber={idx + 1}
                  title={book.title}
                  author={book.authors.map((a) => a.name).join(', ')}
                  category={book.categories[0]?.name ?? ''}
                  coverUrl={book.coverImage}
                  averageRating={book.rating}
                  isFreeEligible={book.isFreeEligible}
                  onClick={() => navigate(`/livro/${book.slug}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Categorias */}
        {categories.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Encontre seu universo</h2>
              <p className="mt-1 text-sm text-brand-muted">Um gênero para cada momento.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {categories.map((cat, idx) => (
                <CategoryCard
                  key={cat.id}
                  index={idx + 1}
                  name={cat.name}
                  slug={cat.slug}
                  description={cat.description}
                  onClick={() => navigate(`/categorias/${cat.slug}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Benefícios */}
        <section className="space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
              POR QUE ESCOLHER O BIBLIOFLIX
            </span>
            <h2 className="mt-1 text-2xl font-bold text-white">Feito para acompanhar o seu ritmo.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM_BENEFITS.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-2"
              >
                <h3 className="text-base font-bold text-white">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Planos */}
        {plans.length > 0 && (
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
                SEU PRÓXIMO CAPÍTULO
              </span>
              <h2 className="text-3xl font-extrabold text-white">
                Uma boa história cabe em qualquer plano.
              </h2>
              <p className="text-sm text-brand-muted">
                Primeira assinatura Premium inclui 7 dias grátis para testar uma única vez por conta.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const benefits = [
                  `Até ${plan.maxDevices} dispositivo(s) conectado(s)`,
                  plan.hasOfflineReading
                    ? `Até ${plan.offlineBookLimit} livro(s) offline`
                    : 'Sem leitura offline',
                  plan.monthlyBookLimit
                    ? `${plan.monthlyBookLimit} livro elegível por mês + prévia editorial`
                    : 'Leitura contínua conforme catálogo do plano',
                  plan.hasAds ? 'Com anúncios' : 'Experiência sem anúncios',
                ];

                return (
                  <PlanCard
                    key={plan.id}
                    name={plan.name}
                    description={plan.description}
                    price={plan.price}
                    benefits={benefits}
                    isRecommended={plan.name === 'Premium'}
                    actionLabel={
                      plan.name === 'Gratuito'
                        ? 'Começar grátis'
                        : plan.name === 'Básico'
                          ? 'Escolher Básico'
                          : 'Assinar Premium →'
                    }
                    onSelect={() => navigate(isAuthenticated ? '/planos' : '/cadastro')}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* CTA Final */}
        <section className="rounded-2xl border border-brand-borderPromo bg-gradient-to-r from-brand-promo via-brand-surface to-brand-promo px-6 py-12 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Sua próxima leitura favorita está esperando.
          </h2>
          <p className="mx-auto max-w-lg text-sm text-brand-muted">
            Crie sua conta gratuita e explore os títulos disponíveis no catálogo Biblioflix.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate(isAuthenticated ? '/catalogo' : '/cadastro')}
            >
              {isAuthenticated ? 'Explorar catálogo →' : 'Comece a ler agora →'}
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
