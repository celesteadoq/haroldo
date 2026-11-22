import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookCover } from '../../components/catalog';
import { useToast } from '../../components/feedback';
import { Button, Checkbox, Input, Select, Skeleton, Textarea } from '../../components/ui';
import { AdminLayout } from '../../layouts';
import { adminService } from '../../services/adminService';
import type { AdminAuthorItem, AdminCategoryItem } from '../../types/admin';
import type { BookAccessTier } from '../../types/catalog';

interface PreviewPageDraft {
  pageNumber: number;
  chapterTitle: string;
  eyebrow: string;
  title: string;
  content: string;
  disclaimer: string;
}

export function AdminBookFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [authors, setAuthors] = useState<AdminAuthorItem[]>([]);
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [language, setLanguage] = useState('Inglês');
  const [ageRating, setAgeRating] = useState('');
  const [averageRating, setAverageRating] = useState('0');
  const [accessTier, setAccessTier] = useState<BookAccessTier>('BASIC');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isFreeEligible, setIsFreeEligible] = useState(false);
  const [hasFullContent, setHasFullContent] = useState(false);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [previewPages, setPreviewPages] = useState<PreviewPageDraft[]>([]);

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      try {
        setLoading(true);
        const [authorList, categoryList] = await Promise.all([
          adminService.listAuthors(),
          adminService.listCategories(),
        ]);
        if (!active) return;
        setAuthors(authorList);
        setCategories(categoryList);

        if (id) {
          const book = await adminService.getBook(id);
          if (!active) return;
          setTitle(book.title);
          setSlug(book.slug);
          setSubtitle(book.subtitle ?? '');
          setDescription(book.description);
          setCoverUrl(book.coverUrl ?? '');
          setPublisher(book.publisher ?? '');
          setPublicationYear(book.publicationYear ? String(book.publicationYear) : '');
          setPageCount(book.pageCount ? String(book.pageCount) : '');
          setLanguage(book.language);
          setAgeRating(book.ageRating ?? '');
          setAverageRating(String(book.averageRating ?? 0));
          setAccessTier(book.accessTier);
          setIsActive(book.isActive);
          setIsFeatured(book.isFeatured);
          setIsFreeEligible(book.isFreeEligible);
          setHasFullContent(book.hasFullContent);
          setSelectedAuthorIds(book.authors.map((a) => a.author.id));
          setSelectedCategoryIds(book.categories.map((c) => c.category.id));
          setPreviewPages(
            (book.previewPages ?? []).map((p) => ({
              pageNumber: p.pageNumber,
              chapterTitle: p.chapterTitle ?? '',
              eyebrow: p.eyebrow,
              title: p.title,
              content: p.content,
              disclaimer: p.disclaimer ?? '',
            }))
          );
        }
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Erro ao carregar dados do livro',
          message: err instanceof Error ? err.message : undefined,
        });
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadInitial();
    return () => {
      active = false;
    };
  }, [id, showToast]);

  async function handleSaveBook(event: FormEvent) {
    event.preventDefault();
    if (selectedAuthorIds.length === 0 || selectedCategoryIds.length === 0) {
      showToast({
        type: 'error',
        title: 'Selecione ao menos um autor e uma categoria.',
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title,
        slug,
        subtitle: subtitle.trim() || null,
        description,
        coverUrl: coverUrl.trim() || null,
        publisher: publisher.trim() || null,
        publicationYear: publicationYear ? Number(publicationYear) : null,
        pageCount: pageCount ? Number(pageCount) : null,
        language,
        ageRating: ageRating.trim() || null,
        averageRating: Number(averageRating) || 0,
        accessTier,
        isActive,
        isFeatured,
        isFreeEligible,
        hasFullContent,
        authorIds: selectedAuthorIds,
        categoryIds: selectedCategoryIds,
      };

      let savedBookId = id;
      if (isEditing && id) {
        await adminService.updateBook(id, payload);
      } else {
        const created = await adminService.createBook(payload);
        savedBookId = created.id;
      }

      if (savedBookId && previewPages.length > 0) {
        await adminService.saveBookPreview(
          savedBookId,
          previewPages.map((p, idx) => ({
            pageNumber: idx + 1,
            chapterTitle: p.chapterTitle.trim() || null,
            eyebrow: p.eyebrow.trim() || 'BIBLIOFLIX / CADERNO DE LEITURA',
            title: p.title,
            content: p.content,
            disclaimer: p.disclaimer.trim() || null,
          }))
        );
      }

      showToast({ type: 'success', title: 'Livro salvo com sucesso!' });
      navigate('/admin/livros');
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar livro',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout
      title={isEditing ? 'Gerenciar livro' : 'Adicionar livro'}
      subtitle="Configure metadados, nível de acesso, URL de capa e páginas da prévia editorial."
    >
      <div className="space-y-6">
        <Link to="/admin/livros" className="text-xs font-medium text-brand-muted hover:text-white">
          ← Voltar para livros
        </Link>

        {loading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : (
          <form onSubmit={handleSaveBook} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
              <div className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
                <p className="text-xs font-semibold text-brand-muted">Pré-visualização da capa</p>
                <BookCover src={coverUrl || null} title={title || 'Novo Livro'} />
                <p className="text-[11px] text-brand-subtle">
                  Informe URL ou caminho em <code>/assets/covers/...</code>. Quando ausente, aplica fallback 2:3.
                </p>
              </div>

              <div className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <Input
                    label="Slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Subtítulo"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                  <Input
                    label="URL ou caminho da capa"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                  />
                </div>

                <Textarea
                  label="Sinopse / Descrição"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Input
                    label="Editora"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                  />
                  <Input
                    label="Ano"
                    type="number"
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                  />
                  <Input
                    label="Páginas"
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                  />
                  <Input
                    label="Idioma"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Select
                    label="Nível de acesso"
                    value={accessTier}
                    onChange={(e) => setAccessTier(e.target.value as BookAccessTier)}
                    options={[
                      { value: 'FREE', label: 'Gratuito (FREE)' },
                      { value: 'BASIC', label: 'Básico (BASIC)' },
                      { value: 'PREMIUM', label: 'Premium (PREMIUM)' },
                    ]}
                  />
                  <Input
                    label="Classificação indicativa"
                    placeholder="Ex.: Livre, 14+"
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value)}
                  />
                  <Input
                    label="Média editorial (0 a 5)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={averageRating}
                    onChange={(e) => setAverageRating(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
                  <Checkbox label="Publicado" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <Checkbox label="Destaque" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                  <Checkbox
                    label="Elegível Gratuito"
                    checked={isFreeEligible}
                    onChange={(e) => setIsFreeEligible(e.target.checked)}
                  />
                  <Checkbox
                    label="Obra completa"
                    checked={hasFullContent}
                    onChange={(e) => setHasFullContent(e.target.checked)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2 rounded-lg border border-brand-border bg-brand-bg p-3">
                    <p className="text-xs font-semibold text-white">Autores</p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {authors.map((a) => (
                        <Checkbox
                          key={a.id}
                          label={a.name}
                          checked={selectedAuthorIds.includes(a.id)}
                          onChange={(e) =>
                            setSelectedAuthorIds((prev) =>
                              e.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-brand-border bg-brand-bg p-3">
                    <p className="text-xs font-semibold text-white">Categorias</p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {categories.map((c) => (
                        <Checkbox
                          key={c.id}
                          label={c.name}
                          checked={selectedCategoryIds.includes(c.id)}
                          onChange={(e) =>
                            setSelectedCategoryIds((prev) =>
                              e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gerenciador de Prévias Editoriais e Capítulos */}
            <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Páginas de prévia / conteúdo editorial</h2>
                  <p className="text-xs text-brand-muted">
                    Use apenas textos autorizados ou demonstrativos originais do Biblioflix.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPreviewPages((prev) => [
                      ...prev,
                      {
                        pageNumber: prev.length + 1,
                        chapterTitle: `Parte ${prev.length + 1}`,
                        eyebrow: 'BIBLIOFLIX / CADERNO DE LEITURA',
                        title: '',
                        content: '',
                        disclaimer: '',
                      },
                    ])
                  }
                >
                  + Adicionar página
                </Button>
              </div>

              {previewPages.length === 0 ? (
                <p className="text-xs text-brand-muted">Nenhuma página cadastrada.</p>
              ) : (
                <div className="space-y-4">
                  {previewPages.map((pg, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-brand-border bg-brand-bg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-accent">
                          Página {idx + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setPreviewPages((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          Remover
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                          label="Capítulo / Seção"
                          value={pg.chapterTitle}
                          onChange={(e) =>
                            setPreviewPages((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, chapterTitle: e.target.value } : item
                              )
                            )
                          }
                        />
                        <Input
                          label="Título da página"
                          value={pg.title}
                          onChange={(e) =>
                            setPreviewPages((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, title: e.target.value } : item
                              )
                            )
                          }
                          required
                        />
                      </div>
                      <Textarea
                        label="Conteúdo"
                        rows={4}
                        value={pg.content}
                        onChange={(e) =>
                          setPreviewPages((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, content: e.target.value } : item
                            )
                          )
                        }
                        required
                      />
                      <Input
                        label="Aviso / Disclaimer"
                        value={pg.disclaimer}
                        onChange={(e) =>
                          setPreviewPages((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, disclaimer: e.target.value } : item
                            )
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary" loading={saving}>
                Salvar alterações
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/livros')}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
