import { BookAccessTier, PrismaClient, SubscriptionStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const plansData = [
    {
      name: 'Gratuito',
      description: 'Para descobrir o prazer de ler.',
      price: 0.0,
      maxDevices: 1,
      offlineBookLimit: 0,
      monthlyBookLimit: 1,
      hasAds: true,
      hasOfflineReading: false,
      isActive: true,
    },
    {
      name: 'Básico',
      description: 'Mais histórias na sua rotina.',
      price: 19.9,
      maxDevices: 2,
      offlineBookLimit: 3,
      monthlyBookLimit: null,
      hasAds: true,
      hasOfflineReading: true,
      isActive: true,
    },
    {
      name: 'Premium',
      description: 'Sua biblioteca, sem limites.',
      price: 34.9,
      maxDevices: 3,
      offlineBookLimit: 10,
      monthlyBookLimit: null,
      hasAds: false,
      hasOfflineReading: true,
      isActive: true,
    },
  ];

  const plansByName = new Map<string, { id: string }>();

  for (const plan of plansData) {
    const upserted = await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
      select: { id: true, name: true },
    });
    plansByName.set(upserted.name, { id: upserted.id });
  }

  const categoriesData = [
    { name: 'Romance', slug: 'romance', description: 'Para se apaixonar' },
    { name: 'Ficção Científica', slug: 'ficcao-cientifica', description: 'Além do que é possível' },
    { name: 'Fantasia', slug: 'fantasia', description: 'Outros mundos esperam' },
    { name: 'Suspense', slug: 'suspense', description: 'Só mais um capítulo' },
    { name: 'Terror', slug: 'terror', description: 'Coragem para continuar' },
    { name: 'Biografia', slug: 'biografia', description: 'Vidas extraordinárias' },
    { name: 'Tecnologia', slug: 'tecnologia', description: 'Ideias para o amanhã' },
    {
      name: 'Desenvolvimento Pessoal',
      slug: 'desenvolvimento-pessoal',
      description: 'Sua melhor versão',
    },
  ];

  const categoriesBySlug = new Map<string, { id: string }>();

  for (const category of categoriesData) {
    const upserted = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: { ...category, isActive: true },
      select: { id: true, slug: true },
    });
    categoriesBySlug.set(upserted.slug, { id: upserted.id });
  }

  const adminPasswordHash = await bcrypt.hash('Admin1234', 10);
  const marinaPasswordHash = await bcrypt.hash('Marina1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@biblioflix.com' },
    update: {
      name: 'Administrador Biblioflix',
      password: adminPasswordHash,
      role: UserRole.ADMIN,
      isBlocked: false,
    },
    create: {
      name: 'Administrador Biblioflix',
      email: 'admin@biblioflix.com',
      password: adminPasswordHash,
      role: UserRole.ADMIN,
      isBlocked: false,
    },
  });

  const marina = await prisma.user.upsert({
    where: { email: 'marina@email.com' },
    update: {
      name: 'Marina Costa',
      password: marinaPasswordHash,
      role: UserRole.USER,
      isBlocked: false,
    },
    create: {
      name: 'Marina Costa',
      email: 'marina@email.com',
      password: marinaPasswordHash,
      role: UserRole.USER,
      isBlocked: false,
    },
  });

  const freePlan = plansByName.get('Gratuito');
  if (freePlan) {
    const existingSub = await prisma.subscription.findFirst({
      where: { userId: marina.id },
    });

    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          userId: marina.id,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          startDate: new Date(),
        },
      });
    }
  }

  const booksSeed = [
    {
      title: 'The Midnight Library',
      slug: 'the-midnight-library',
      authorName: 'Matt Haig',
      authorSlug: 'matt-haig',
      authorBio: 'Autor britânico de ficção contemporânea e não ficção.',
      categorySlug: 'fantasia',
      description:
        'Entre a vida que conhecemos e todas as que poderíamos ter vivido, uma biblioteca guarda possibilidades infinitas. Nora Seed recebe a chance de experimentar outros caminhos e descobrir o que realmente faz uma vida valer a pena.',
      publicationYear: 2020,
      publisher: 'Canongate Books',
      pageCount: 304,
      language: 'Inglês',
      averageRating: 4.8,
      accessTier: BookAccessTier.FREE,
      isFeatured: true,
      isFreeEligible: true,
    },
    {
      title: 'The Psychology of Money',
      slug: 'the-psychology-of-money',
      authorName: 'Morgan Housel',
      authorSlug: 'morgan-housel',
      authorBio: 'Escritor e especialista em finanças comportamentais.',
      categorySlug: 'desenvolvimento-pessoal',
      description:
        'A forma como lidamos com dinheiro envolve muito mais que números. Uma leitura sobre comportamento, escolhas e a influência das experiências pessoais na vida financeira.',
      publicationYear: 2020,
      publisher: 'Harriman House',
      pageCount: 256,
      language: 'Inglês',
      averageRating: 4.8,
      accessTier: BookAccessTier.BASIC,
      isFeatured: true,
      isFreeEligible: false,
    },
    {
      title: '1984',
      slug: '1984',
      authorName: 'George Orwell',
      authorSlug: 'george-orwell',
      authorBio: 'Romancista, ensaísta e jornalista britânico.',
      categorySlug: 'ficcao-cientifica',
      description:
        'Winston Smith vive em uma sociedade marcada pela vigilância e pelo controle da informação. Ao questionar o sistema, descobre o custo de procurar a verdade.',
      publicationYear: 1949,
      publisher: 'Secker & Warburg',
      pageCount: 328,
      language: 'Inglês',
      averageRating: 4.8,
      accessTier: BookAccessTier.BASIC,
      isFeatured: true,
      isFreeEligible: false,
    },
    {
      title: 'Dune',
      slug: 'dune',
      authorName: 'Frank Herbert',
      authorSlug: 'frank-herbert',
      authorBio: 'Autor norte-americano de ficção científica.',
      categorySlug: 'ficcao-cientifica',
      description:
        'Em Arrakis, um planeta desértico onde o recurso mais valioso do universo é produzido, Paul Atreides se vê envolvido em disputas de poder, fé e sobrevivência.',
      publicationYear: 1965,
      publisher: 'Chilton Books',
      pageCount: 688,
      language: 'Inglês',
      averageRating: 4.8,
      accessTier: BookAccessTier.PREMIUM,
      isFeatured: true,
      isFreeEligible: false,
    },
    {
      title: 'Atomic Habits',
      slug: 'atomic-habits',
      authorName: 'James Clear',
      authorSlug: 'james-clear',
      authorBio: 'Autor e palestrante focado em formação de hábitos.',
      categorySlug: 'desenvolvimento-pessoal',
      description:
        'Pequenos hábitos moldam grandes mudanças. James Clear apresenta maneiras práticas de construir rotinas, tornar boas escolhas mais fáceis e avançar com consistência.',
      publicationYear: 2018,
      publisher: 'Avery',
      pageCount: 320,
      language: 'Inglês',
      averageRating: 4.9,
      accessTier: BookAccessTier.BASIC,
      isFeatured: true,
      isFreeEligible: false,
    },
    {
      title: 'The Hobbit',
      slug: 'the-hobbit',
      authorName: 'J. R. R. Tolkien',
      authorSlug: 'j-r-r-tolkien',
      authorBio: 'Escritor, filólogo e professor universitário britânico.',
      categorySlug: 'fantasia',
      description:
        'Bilbo Bolseiro deixa o conforto de sua casa e embarca em uma jornada inesperada com um grupo de anões. No caminho, encontra criaturas, desafios e uma coragem que não sabia possuir.',
      publicationYear: 1937,
      publisher: 'George Allen & Unwin',
      pageCount: 310,
      language: 'Inglês',
      averageRating: 4.9,
      accessTier: BookAccessTier.BASIC,
      isFeatured: true,
      isFreeEligible: false,
    },
    {
      title: 'The Silent Patient',
      slug: 'the-silent-patient',
      authorName: 'Alex Michaelides',
      authorSlug: 'alex-michaelides',
      authorBio: 'Autor e roteirista britânico-cipriota de suspense.',
      categorySlug: 'suspense',
      description:
        'Uma artista deixa de falar depois de um crime. Um psicoterapeuta se aproxima do caso, determinado a compreender o silêncio e os segredos por trás dele.',
      publicationYear: 2019,
      publisher: 'Celadon Books',
      pageCount: 336,
      language: 'Inglês',
      averageRating: 4.7,
      accessTier: BookAccessTier.BASIC,
      isFeatured: false,
      isFreeEligible: false,
    },
    {
      title: 'The Seven Husbands of Evelyn Hugo',
      slug: 'the-seven-husbands-of-evelyn-hugo',
      authorName: 'Taylor Jenkins Reid',
      authorSlug: 'taylor-jenkins-reid',
      authorBio: 'Escritora norte-americana de ficção contemporânea e romance.',
      categorySlug: 'romance',
      description:
        'Uma estrela de cinema decide contar sua verdadeira história a uma jornalista. Entre amores, ambição e escolhas difíceis, os bastidores de sua vida ganham novos significados.',
      publicationYear: 2017,
      publisher: 'Atria Books',
      pageCount: 400,
      language: 'Inglês',
      averageRating: 4.9,
      accessTier: BookAccessTier.BASIC,
      isFeatured: false,
      isFreeEligible: false,
    },
  ];

  let midnightLibraryId: string | null = null;

  for (const item of booksSeed) {
    const author = await prisma.author.upsert({
      where: { name: item.authorName },
      update: { slug: item.authorSlug, biography: item.authorBio },
      create: {
        name: item.authorName,
        slug: item.authorSlug,
        biography: item.authorBio,
      },
    });

    const book = await prisma.book.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        publicationYear: item.publicationYear,
        publisher: item.publisher,
        pageCount: item.pageCount,
        language: item.language,
        averageRating: item.averageRating,
        accessTier: item.accessTier,
        isFeatured: item.isFeatured,
        isFreeEligible: item.isFreeEligible,
        isActive: true,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        coverUrl: `/assets/covers/${item.slug}.svg`,
        publicationYear: item.publicationYear,
        publisher: item.publisher,
        pageCount: item.pageCount,
        language: item.language,
        averageRating: item.averageRating,
        ratingCount: 0,
        accessTier: item.accessTier,
        isFeatured: item.isFeatured,
        isFreeEligible: item.isFreeEligible,
        hasFullContent: false,
        isActive: true,
      },
    });

    if (item.slug === 'the-midnight-library') {
      midnightLibraryId = book.id;
    }

    await prisma.bookAuthor.upsert({
      where: { bookId_authorId: { bookId: book.id, authorId: author.id } },
      update: {},
      create: { bookId: book.id, authorId: author.id },
    });

    const category = categoriesBySlug.get(item.categorySlug);
    if (category) {
      await prisma.bookCategory.upsert({
        where: { bookId_categoryId: { bookId: book.id, categoryId: category.id } },
        update: {},
        create: { bookId: book.id, categoryId: category.id },
      });
    }
  }

  if (midnightLibraryId) {
    const previewPages = [
      {
        pageNumber: 1,
        chapterTitle: 'Prévia editorial • Parte 1',
        eyebrow: 'BIBLIOFLIX / CADERNO DE LEITURA',
        title: 'Entre escolhas e possibilidades',
        content:
          'Toda leitura começa com uma escolha: abrir espaço para uma história. Antes de avançar, pense em um caminho que você tomou e em outro que deixou para trás. Como essas possibilidades mudam a maneira de olhar para o presente?\n\nUma biblioteca pode ser um lugar de descoberta, mas também um convite à pausa. Entre tantos mundos possíveis, a história que escolhemos ler hoje conversa com aquilo de que precisamos agora.',
        disclaimer: 'Texto demonstrativo original do Biblioflix. Não é um trecho da obra de Matt Haig.',
      },
      {
        pageNumber: 2,
        chapterTitle: 'Prévia editorial • Parte 2',
        eyebrow: 'BIBLIOFLIX / CADERNO DE LEITURA',
        title: 'O próximo capítulo é seu',
        content:
          'As histórias não terminam quando fechamos um livro. Elas seguem nas conversas, nas ideias e no jeito de perceber o mundo à nossa volta.\n\nVocê pode ajustar o tamanho das letras e escolher um tema confortável para continuar. Ler no seu ritmo também faz parte da experiência.',
        disclaimer: 'Texto demonstrativo original do Biblioflix. Não é um trecho da obra de Matt Haig.',
      },
    ];

    for (const page of previewPages) {
      await prisma.bookPreviewPage.upsert({
        where: {
          bookId_pageNumber: { bookId: midnightLibraryId, pageNumber: page.pageNumber },
        },
        update: page,
        create: { bookId: midnightLibraryId, ...page },
      });
    }
  }

  const helpCount = await prisma.helpArticle.count();
  if (helpCount === 0) {
    await prisma.helpArticle.createMany({
      data: [
        {
          category: 'Planos e assinaturas',
          question: 'Como funciona o teste grátis?',
          answer:
            'O teste Premium dura 7 dias com cobrança inicial de R$ 0,00. Disponível uma única vez por conta. Após os 7 dias, você pode converter para o plano pago de R$ 34,90/mês ou cancelar antes do término.',
          displayOrder: 1,
          isActive: true,
        },
        {
          category: 'Planos e assinaturas',
          question: 'Como cancelar minha assinatura?',
          answer:
            'Acesse Minha assinatura e selecione Cancelar assinatura. Você mantém o acesso até a data de término do período já pago e nenhuma nova cobrança é realizada.',
          displayOrder: 2,
          isActive: true,
        },
        {
          category: 'Leitura e biblioteca',
          question: 'Como funciona a leitura offline?',
          answer:
            'Os limites de livros offline são de 3 títulos no plano Básico e 10 no Premium. O plano Gratuito permite apenas leitura online.',
          displayOrder: 3,
          isActive: true,
        },
        {
          category: 'Conta e cadastro',
          question: 'Como recuperar minha senha?',
          answer:
            'Na tela de login, escolha "Esqueci minha senha". Informe seu e-mail para receber o link de redefinição válido por 30 minutos.',
          displayOrder: 4,
          isActive: true,
        },
      ],
    });
  }

  console.log('Seed completo do Biblioflix executado com sucesso.');
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
