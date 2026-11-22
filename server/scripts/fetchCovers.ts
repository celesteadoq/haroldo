/**
 * Busca as capas reais dos livros na Open Library (https://openlibrary.org)
 * e grava no banco a URL da capa (covers.openlibrary.org).
 *
 * Uso (dentro da pasta do projeto, com internet):
 *   npm run db:covers
 *
 * Por padrão atualiza só livros sem capa ou com a ilustração SVG local.
 * Capas que você definiu manualmente (pelo painel admin) NÃO são alteradas.
 *   npm run db:covers -- --force    -> substitui também capas já definidas
 *   npm run db:covers -- --reset    -> volta tudo para as ilustrações SVG locais
 *
 * As imagens não são baixadas: o navegador carrega direto de
 * covers.openlibrary.org, que é a forma recomendada pela Open Library.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UA = 'Biblioflix/1.0 (projeto educacional; capas via Open Library)';
const force = process.argv.includes('--force');
const reset = process.argv.includes('--reset');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SearchDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function coverExists(coverId: number): Promise<boolean> {
  try {
    const res = await fetch(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(20000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function findCoverId(title: string, author: string): Promise<number | null> {
  const params = new URLSearchParams({
    title,
    author,
    fields: 'key,title,author_name,cover_i',
    limit: '15',
  });
  const data = await getJson<{ docs?: SearchDoc[] }>(`https://openlibrary.org/search.json?${params}`);
  const docs = (data?.docs ?? []).filter((d) => typeof d.cover_i === 'number');
  if (docs.length === 0) return null;

  const wantedTitle = normalize(title);
  const wantedLast = normalize(author).split(' ').pop() ?? '';

  const score = (d: SearchDoc) => {
    let s = 0;
    if (normalize(d.title ?? '') === wantedTitle) s += 2;
    if ((d.author_name ?? []).some((a) => normalize(a).includes(wantedLast))) s += 1;
    return s;
  };

  docs.sort((a, b) => score(b) - score(a));
  for (const doc of docs.slice(0, 3)) {
    if (await coverExists(doc.cover_i as number)) return doc.cover_i as number;
    await sleep(300);
  }
  return null;
}

async function main() {
  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      coverUrl: true,
      authors: { select: { author: { select: { name: true } } } },
    },
    orderBy: { title: 'asc' },
  });

  console.log(`Livros no banco: ${books.length}${reset ? ' (modo --reset)' : ''}\n`);
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const book of books) {
    const isLocalOrEmpty = !book.coverUrl || book.coverUrl.startsWith('/assets/covers/');

    if (reset) {
      await prisma.book.update({
        where: { id: book.id },
        data: { coverUrl: `/assets/covers/${book.slug}.svg` },
      });
      console.log(`↺ ${book.title}: voltou para a ilustração local`);
      updated++;
      continue;
    }

    if (!isLocalOrEmpty && !force) {
      console.log(`– ${book.title}: capa personalizada mantida (use --force para substituir)`);
      skipped++;
      continue;
    }

    const author = book.authors[0]?.author.name ?? '';
    const coverId = await findCoverId(book.title, author);

    if (!coverId) {
      console.log(`✗ ${book.title}: capa não encontrada na Open Library (mantida a atual)`);
      failed++;
    } else {
      await prisma.book.update({
        where: { id: book.id },
        data: { coverUrl: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` },
      });
      console.log(`✓ ${book.title}: https://covers.openlibrary.org/b/id/${coverId}-L.jpg`);
      updated++;
    }
    await sleep(600);
  }

  console.log(`\nConcluído: ${updated} atualizado(s), ${skipped} mantido(s), ${failed} sem capa.`);
  if (failed > 0) {
    console.log('Se algum livro falhou, confira a internet e rode o comando de novo.');
  }
}

main()
  .catch((err) => {
    console.error('Erro ao buscar capas:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
