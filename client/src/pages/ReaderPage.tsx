import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookCover } from '../components/catalog';
import { Modal, useToast } from '../components/feedback';
import { Button, EmptyState, LoadingScreen, ProgressBar, Select } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';
import type { ApiStructuredError } from '../services/api';
import { bookService } from '../services/bookService';
import { readingService } from '../services/readingService';
import type { ReaderPreviewResponse } from '../types/catalog';

export function ReaderPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<ReaderPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [restrictedMsg, setRestrictedMsg] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [lineSpacing, setLineSpacing] = useState<'normal' | 'relaxed'>('normal');
  const [paperTheme, setPaperTheme] = useState<'dark' | 'sepia' | 'light'>(
    user?.preferredTheme === 'sepia' ? 'sepia' : 'dark'
  );
  const [savingProgress, setSavingProgress] = useState(false);

  const pageOpenedAtRef = useRef<number>(Date.now());
  const lastClientSyncAtRef = useRef<string | undefined>(undefined);
  const latestBookIdRef = useRef<string | null>(null);
  const latestPageNumberRef = useRef<number>(1);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setRestrictedMsg(null);
        const res = await bookService.getReaderPreview(slug!);
        if (!active) return;

        setData(res);
        latestBookIdRef.current = res.book.id;

        if (res.savedProgress && res.previewPages.length > 0) {
          const targetIdx = Math.max(
            0,
            Math.min(res.previewPages.length - 1, res.savedProgress.currentPage - 1)
          );
          setPageIndex(targetIdx);
          latestPageNumberRef.current = targetIdx + 1;
          lastClientSyncAtRef.current = res.savedProgress.lastReadAt;
        } else {
          setPageIndex(0);
          latestPageNumberRef.current = 1;
        }
        pageOpenedAtRef.current = Date.now();
      } catch (err) {
        const apiErr = err as ApiStructuredError;
        if (active) {
          setRestrictedMsg(
            apiErr.message || 'Este conteúdo requer um plano compatível para leitura.'
          );
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

  const flushProgress = useCallback(
    async (explicitBookId?: string, explicitPage?: number) => {
      if (!isAuthenticated) return;
      const bookId = explicitBookId ?? latestBookIdRef.current;
      const pageNumber = explicitPage ?? latestPageNumberRef.current;
      if (!bookId || pageNumber < 1) return;

      const elapsedSeconds = Math.min(
        300,
        Math.max(0, Math.round((Date.now() - pageOpenedAtRef.current) / 1000))
      );
      pageOpenedAtRef.current = Date.now();

      try {
        setSavingProgress(true);
        const result = await readingService.saveProgress(bookId, {
          currentPage: pageNumber,
          readingSecondsDelta: elapsedSeconds,
          clientTimestamp: lastClientSyncAtRef.current,
        });

        lastClientSyncAtRef.current = result.progress.lastReadAt;

        if (result.conflictResolved && data && data.previewPages.length > 0) {
          const serverIdx = Math.max(
            0,
            Math.min(data.previewPages.length - 1, result.progress.currentPage - 1)
          );
          setPageIndex(serverIdx);
          latestPageNumberRef.current = serverIdx + 1;
          showToast({
            type: 'info',
            title: 'Leitura sincronizada',
            message: 'Posição atualizada com leitura mais recente de outro dispositivo.',
          });
        }
      } catch {
        // Silencioso no salvamento automático em segundo plano
      } finally {
        setSavingProgress(false);
      }
    },
    [isAuthenticated, data, showToast]
  );

  // Debounce automático ao mudar de página
  useEffect(() => {
    if (!data || !data.hasEditorialPreview || !isAuthenticated) return;
    latestBookIdRef.current = data.book.id;
    latestPageNumberRef.current = pageIndex + 1;

    const timer = window.setTimeout(() => {
      void flushProgress(data.book.id, pageIndex + 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [pageIndex, data, isAuthenticated, flushProgress]);

  // Flush ao ocultar aba ou sair da tela
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushProgress();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void flushProgress();
    };
  }, [flushProgress]);

  const chapters = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const list: Array<{ label: string; pageIndex: number }> = [];
    data.previewPages.forEach((p, idx) => {
      const label = p.chapterTitle || p.title;
      if (label && !seen.has(label)) {
        seen.add(label);
        list.push({ label, pageIndex: idx });
      }
    });
    return list;
  }, [data]);

  const currentPage = data?.previewPages[pageIndex];
  const totalPages = data?.previewPages.length ?? 0;
  const isLastPage = totalPages > 0 && pageIndex === totalPages - 1;

  const fontSizeClass =
    fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base';
  const lineSpacingClass = lineSpacing === 'relaxed' ? 'leading-loose' : 'leading-relaxed';

  const cardThemeClass =
    paperTheme === 'sepia'
      ? 'bg-[#251E16] border-[#3E3224] text-[#F3E7D3]'
      : paperTheme === 'light'
        ? 'bg-[#F8FAFC] border-gray-200 text-[#111827]'
        : 'bg-brand-surface border-brand-border text-gray-200';

  const titleThemeClass = paperTheme === 'light' ? 'text-[#090C12]' : 'text-white';

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="none"
    >
      {loading ? (
        <LoadingScreen
          title="Abrindo prévia editorial..."
          description="Verificando permissões e recuperando seu progresso."
        />
      ) : restrictedMsg ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-brand-border bg-brand-surface p-8 text-center space-y-5">
          <div className="mx-auto w-28">
            <BookCover title={slug ?? 'Biblioflix'} />
          </div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
            ACESSO RESTRITO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Essa história pode ser sua.
          </h1>
          <p className="text-sm text-brand-muted">{restrictedMsg}</p>
          <div className="flex flex-col gap-2.5 pt-2">
            {!isAuthenticated ? (
              <Button
                fullWidth
                onClick={() => navigate('/entrar', { state: { from: `/leitor/${slug}` } })}
              >
                Entrar na conta
              </Button>
            ) : (
              <Button fullWidth onClick={() => navigate('/planos')}>
                Conhecer planos
              </Button>
            )}
            <Button variant="outline" fullWidth onClick={() => navigate(`/livro/${slug}`)}>
              Voltar para detalhes do livro
            </Button>
          </div>
        </div>
      ) : !data ? (
        <EmptyState
          title="Leitura indisponível."
          description="Não foi possível carregar este título."
          action={<Button onClick={() => navigate('/catalogo')}>Voltar ao catálogo</Button>}
        />
      ) : (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-brand-muted">
                <Link
                  to={`/livro/${data.book.slug}`}
                  onClick={() => void flushProgress()}
                  className="hover:text-white"
                >
                  ← Voltar aos detalhes
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/biblioteca"
                    onClick={() => void flushProgress()}
                    className="hover:text-white"
                  >
                    Minha biblioteca
                  </Link>
                )}
              </div>
              <h1 className="mt-1 text-base sm:text-lg font-bold text-white">
                {data.book.title} • {data.access.canReadFull && data.book.hasFullContent ? 'Leitura' : 'Prévia editorial'}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {savingProgress && (
                <span className="text-[11px] text-brand-muted">Salvando...</span>
              )}
              {chapters.length > 1 && (
                <div className="w-48">
                  <Select
                    aria-label="Selecionar capítulo"
                    value={String(pageIndex)}
                    onChange={(e) => {
                      const nextIdx = Number(e.target.value);
                      setPageIndex(nextIdx);
                      void flushProgress(data.book.id, nextIdx + 1);
                    }}
                    options={chapters.map((ch) => ({
                      value: String(ch.pageIndex),
                      label: ch.label,
                    }))}
                  />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                Aa Ajustes
              </Button>
            </div>
          </div>

          {!data.hasEditorialPreview || !currentPage ? (
            <EmptyState
              eyebrow="PRÉVIA EDITORIAL"
              title="Prévia editorial ainda não disponível."
              description="Este título não possui páginas de prévia demonstrativa cadastradas no momento."
              action={
                <Button onClick={() => navigate(`/livro/${data.book.slug}`)}>
                  Voltar aos detalhes
                </Button>
              }
            />
          ) : (
            <>
              <article className={`rounded-2xl border p-6 sm:p-10 space-y-5 ${cardThemeClass}`}>
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
                  {currentPage.chapterTitle ?? currentPage.eyebrow}
                </span>
                <h2 className={`text-2xl sm:text-3xl font-bold ${titleThemeClass}`}>
                  {currentPage.title}
                </h2>
                <div className={`space-y-4 whitespace-pre-line ${fontSizeClass} ${lineSpacingClass}`}>
                  {currentPage.content}
                </div>
                {currentPage.disclaimer && (
                  <p className="pt-4 border-t border-white/10 text-xs text-brand-subtle">
                    {currentPage.disclaimer}
                  </p>
                )}
              </article>

              {isLastPage && (
                <section className="rounded-xl border border-brand-borderPromo bg-brand-promo p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {data.book.hasFullContent && data.access.canReadFull
                        ? 'Leitura concluída!'
                        : 'Fim da prévia editorial disponível.'}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {data.book.hasFullContent && data.access.canReadFull
                        ? 'Seu progresso foi atualizado para 100% na sua biblioteca.'
                        : 'Acompanhe sua biblioteca ou conheça os planos para explorar mais títulos.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        await flushProgress(data.book.id, pageIndex + 1);
                        navigate(isAuthenticated ? '/biblioteca' : '/catalogo');
                      }}
                    >
                      {isAuthenticated ? 'Voltar à biblioteca' : 'Explorar catálogo'}
                    </Button>
                    {!data.access.canReadFull && (
                      <Button size="sm" variant="outline" onClick={() => navigate('/planos')}>
                        Ver planos
                      </Button>
                    )}
                  </div>
                </section>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  >
                    ← Anterior
                  </Button>
                  <span className="text-xs font-medium text-brand-muted">
                    {pageIndex + 1} / {totalPages}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={pageIndex >= totalPages - 1}
                    onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Próxima →
                  </Button>
                </div>

                <ProgressBar value={((pageIndex + 1) / totalPages) * 100} />

                {isAuthenticated && (
                  <p className="text-center text-xs text-brand-subtle">
                    Seu progresso é salvo automaticamente na sua conta.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Sua leitura, do seu jeito."
        eyebrow="AJUSTES DE VISUALIZAÇÃO"
        footer={
          <Button fullWidth onClick={() => setSettingsOpen(false)}>
            Aplicar e continuar
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-brand-muted">Tamanho da fonte</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={fontSize === 'sm' ? 'primary' : 'outline'}
                onClick={() => setFontSize((prev) => (prev === 'lg' ? 'md' : 'sm'))}
              >
                A−
              </Button>
              <Button
                variant={fontSize === 'lg' ? 'primary' : 'outline'}
                onClick={() => setFontSize((prev) => (prev === 'sm' ? 'md' : 'lg'))}
              >
                A+
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-brand-muted">Espaçamento entre linhas</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={lineSpacing === 'normal' ? 'primary' : 'outline'}
                onClick={() => setLineSpacing('normal')}
              >
                Confortável
              </Button>
              <Button
                variant={lineSpacing === 'relaxed' ? 'primary' : 'outline'}
                onClick={() => setLineSpacing('relaxed')}
              >
                Amplo
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-brand-muted">Tema da página</p>
            <div className="space-y-2">
              <Button
                variant={paperTheme === 'dark' ? 'primary' : 'outline'}
                fullWidth
                onClick={() => setPaperTheme('dark')}
              >
                Escuro
              </Button>
              <Button
                variant={paperTheme === 'sepia' ? 'primary' : 'outline'}
                fullWidth
                onClick={() => setPaperTheme('sepia')}
              >
                Sépia
              </Button>
              <Button
                variant={paperTheme === 'light' ? 'primary' : 'outline'}
                fullWidth
                onClick={() => setPaperTheme('light')}
              >
                Claro
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
