import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, EmptyState, Input, Select, Skeleton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import { AppShell } from '../layouts';
import { helpService } from '../services/helpService';
import type { HelpArticleItem } from '../types/subscription';

const HELP_CATEGORIES = [
  'Conta e cadastro',
  'Planos e assinaturas',
  'Pagamentos',
  'Leitura e biblioteca',
  'Dispositivos',
  'Problemas técnicos',
];

export function HelpCenterPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState('');
  const [articles, setArticles] = useState<HelpArticleItem[]>([]);
  const [singleArticle, setSingleArticle] = useState<HelpArticleItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadHelp = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      if (id) {
        const art = await helpService.getPublicById(id);
        setSingleArticle(art);
        setArticles([]);
      } else {
        const list = await helpService.listPublic({
          search: debouncedSearch || undefined,
          category: category || undefined,
        });
        setArticles(list);
        setSingleArticle(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar artigos de ajuda.');
    } finally {
      setLoading(false);
    }
  }, [id, debouncedSearch, category]);

  useEffect(() => {
    void loadHelp();
  }, [loadHelp]);

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="minimal"
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Como posso ajudar?</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Encontre respostas e volte para sua próxima história.
          </p>
        </div>

        {id ? (
          loading ? (
            <Skeleton className="h-44 rounded-xl" />
          ) : errorMsg || !singleArticle ? (
            <EmptyState
              title="Artigo não encontrado."
              description={errorMsg ?? 'Este artigo não está disponível.'}
              action={
                <Link to="/ajuda">
                  <Button>Voltar à Central de Ajuda</Button>
                </Link>
              }
            />
          ) : (
            <article className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4">
              <Link to="/ajuda" className="text-xs font-medium text-brand-accent hover:underline">
                ← Todas as perguntas
              </Link>
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                {singleArticle.category}
              </p>
              <h2 className="text-2xl font-bold text-white">{singleArticle.question}</h2>
              <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-line">
                {singleArticle.answer}
              </p>
            </article>
          )
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_240px]">
              <Input
                placeholder="Buscar na central de ajuda..."
                aria-label="Buscar na central de ajuda"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                aria-label="Filtrar categoria de ajuda"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: '', label: 'Todas as categorias' },
                  ...HELP_CATEGORIES.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : errorMsg ? (
              <EmptyState
                title="Erro ao carregar ajuda."
                description={errorMsg}
                action={<Button onClick={() => void loadHelp()}>Tentar novamente</Button>}
              />
            ) : articles.length === 0 ? (
              <EmptyState
                title="Nenhum artigo encontrado."
                description="Não há perguntas cadastradas para este filtro no momento."
              />
            ) : (
              <section className="rounded-xl border border-brand-border bg-brand-surface divide-y divide-brand-border">
                {articles.map((item) => {
                  const expanded = expandedId === item.id;
                  return (
                    <div key={item.id} className="p-5">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="flex w-full items-center justify-between gap-4 text-left"
                      >
                        <div>
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                            {item.category}
                          </span>
                          <span className="mt-1 block text-base font-semibold text-white">
                            {item.question}
                          </span>
                        </div>
                        <span className="text-xl text-brand-muted">{expanded ? '−' : '+'}</span>
                      </button>

                      {expanded && (
                        <div className="mt-3 space-y-2 text-sm text-brand-muted leading-relaxed">
                          <p className="whitespace-pre-line">{item.answer}</p>
                          <Link
                            to={`/ajuda/${item.id}`}
                            className="inline-block text-xs font-semibold text-brand-accent hover:underline"
                          >
                            Abrir página do artigo →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
