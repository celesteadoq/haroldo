/**
 * Devolve a URL da capa de um livro.
 * Se o livro não tiver capa gravada no banco, usa a ilustração SVG local
 * (client/public/assets/covers/<slug>.svg). Se o arquivo não existir, o
 * componente BookCover do frontend cai no placeholder padrão.
 */
export function resolveCoverUrl(coverUrl: string | null | undefined, slug: string): string {
  return coverUrl && coverUrl.trim() ? coverUrl : `/assets/covers/${slug}.svg`;
}
