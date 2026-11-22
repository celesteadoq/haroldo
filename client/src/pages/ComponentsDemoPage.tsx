import { useState } from 'react';
import {
  ConfirmDialog,
  DataTable,
  Filters,
  FormField,
  Pagination,
  StatCard,
} from '../components/admin';
import {
  BookCard,
  CategoryCard,
  PlanCard,
  ProgressBookCard,
} from '../components/catalog';
import {
  ConfirmModal,
  ErrorModal,
  FormModal,
  InfoModal,
  SuccessModal,
  useToast,
} from '../components/feedback';
import type { NavbarAuthState } from '../components/navigation';
import {
  Avatar,
  Badge,
  BrandLogo,
  Button,
  Checkbox,
  Divider,
  EmptyState,
  Input,
  LoadingScreen,
  LoadingSpinner,
  PasswordInput,
  ProgressBar,
  Radio,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
  Tooltip,
} from '../components/ui';
import { AppShell } from '../layouts';

const OFFICIAL_CATEGORIES = [
  { name: 'Romance', slug: 'romance', description: 'Para se apaixonar' },
  { name: 'Ficção Científica', slug: 'ficcao-cientifica', description: 'Além do que é possível' },
  { name: 'Fantasia', slug: 'fantasia', description: 'Outros mundos esperam' },
  { name: 'Suspense', slug: 'suspense', description: 'Só mais um capítulo' },
  { name: 'Terror', slug: 'terror', description: 'Coragem para continuar' },
  { name: 'Biografia', slug: 'biografia', description: 'Vidas extraordinárias' },
  { name: 'Tecnologia', slug: 'tecnologia', description: 'Ideias para o amanhã' },
  { name: 'Desenvolvimento Pessoal', slug: 'desenvolvimento-pessoal', description: 'Sua melhor versão' },
];

const DEMO_BOOKS = [
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    category: 'Fantasia',
    averageRating: 4.8,
    isFreeEligible: true,
  },
  {
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Desenvolvimento Pessoal',
    averageRating: 4.8,
    isFreeEligible: false,
  },
  {
    title: '1984',
    author: 'George Orwell',
    category: 'Ficção Científica',
    averageRating: 4.8,
    isFreeEligible: false,
  },
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    category: 'Suspense',
    averageRating: 4.7,
    isFreeEligible: false,
  },
];

const OFFICIAL_PLANS = [
  {
    name: 'Gratuito',
    price: 0,
    description: 'Para descobrir o prazer de ler.',
    benefits: [
      '1 dispositivo conectado',
      '1 livro completo por mês (quando habilitado)',
      'Com anúncios',
      'Sem leitura offline',
    ],
    actionLabel: 'Começar grátis',
    isRecommended: false,
  },
  {
    name: 'Básico',
    price: 19.9,
    description: 'Mais histórias na sua rotina.',
    benefits: [
      'Catálogo ampliado conforme o plano',
      'Leitura online',
      'Até 2 dispositivos',
      'Até 3 livros offline',
    ],
    actionLabel: 'Escolher Básico',
    isRecommended: false,
  },
  {
    name: 'Premium',
    price: 34.9,
    description: 'Sua biblioteca, sem limites.',
    benefits: [
      'Acesso completo ao catálogo',
      'Leitura ilimitada conforme distribuição',
      'Até 3 dispositivos e até 10 livros offline',
      'Experiência sem anúncios',
    ],
    actionLabel: 'Assinar Premium →',
    isRecommended: true,
  },
];

interface DemoAdminRow {
  id: string;
  name: string;
  plan: string;
  status: 'ACTIVE' | 'TRIALING';
}

const DEMO_ADMIN_ROWS: DemoAdminRow[] = [
  { id: '1', name: 'Marina Costa', plan: 'Gratuito', status: 'ACTIVE' },
  { id: '2', name: 'Rafael Almeida', plan: 'Premium', status: 'TRIALING' },
];

export function ComponentsDemoPage() {
  const { showToast } = useToast();
  const [navMode, setNavMode] = useState<NavbarAuthState>('visitor');
  const [favoriteTitles, setFavoriteTitles] = useState<string[]>(['The Midnight Library']);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const [adminConfirmOpen, setAdminConfirmOpen] = useState(false);
  const [modalType, setModalType] = useState<
    null | 'confirm' | 'info' | 'success' | 'error' | 'form'
  >(null);

  return (
    <AppShell
      authState={navMode}
      userName="Marina Costa"
      unreadNotificationsCount={3}
      showSearch
      footerVariant="full"
    >
      <div className="space-y-14">
        <section className="rounded-xl border border-brand-border bg-brand-surface p-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
            BIBLIOFLIX • SUBETAPA 9.3
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            Validação Visual do Design System e Componentes
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-muted">
            Ambiente temporário de demonstração para validar componentes compartilhados, modais, cards e responsividade.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-brand-muted mr-2">Alternar estado da Navbar:</span>
            {(['visitor', 'user', 'admin'] as const).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={navMode === mode ? 'primary' : 'outline'}
                onClick={() => setNavMode(mode)}
              >
                {mode === 'visitor' ? 'Visitante' : mode === 'user' ? 'Usuário' : 'Administrador'}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white">Logotipo e Botões</h2>
          <div className="flex flex-wrap items-center gap-8 rounded-xl border border-brand-border bg-brand-surface p-6">
            <BrandLogo size="sm" to="" />
            <BrandLogo size="md" to="" />
            <BrandLogo size="lg" to="" />
            <div className="rounded-md bg-white px-4 py-2">
              <BrandLogo size="md" tone="light-bg" to="" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>
              Carregando
            </Button>
            <Button variant="outline" disabled>
              Desabilitado
            </Button>
          </div>
        </section>

        <Divider />

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white">Campos, Badges e Progresso</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="E-mail"
              placeholder="marina@email.com"
              helperText="Use o mesmo e-mail cadastrado na conta."
            />
            <PasswordInput
              label="Senha"
              placeholder="••••••••"
              error="Mínimo de 8 caracteres, letras e números."
            />
            <Select
              label="Gênero"
              placeholder="Selecione um gênero"
              options={OFFICIAL_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
            />
            <Textarea label="Sinopse" placeholder="Escreva aqui..." rows={3} />
          </div>
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Lembrar acesso neste dispositivo" defaultChecked />
            <Radio name="demo-plan" label="Plano Gratuito" defaultChecked />
            <Radio name="demo-plan" label="Plano Premium" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="primary">MAIS ESCOLHIDO</Badge>
            <StatusBadge status="ACTIVE" />
            <StatusBadge status="TRIALING" />
            <StatusBadge status="CANCELED" />
            <StatusBadge status="FAILED" />
            <Tooltip content="Sincronização em nuvem">
              <span className="cursor-help text-xs text-brand-muted underline">Tooltip</span>
            </Tooltip>
            <Avatar name="Marina Costa" size="md" />
            <LoadingSpinner size="sm" className="text-brand-primary" />
          </div>
          <div className="max-w-md">
            <ProgressBar value={68} label="The Midnight Library" showLabel />
          </div>
        </section>

        <Divider />

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white">Livros, Categorias e Planos</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ProgressBookCard
              title="The Midnight Library"
              author="Matt Haig"
              progressPercentage={68}
              subtitle="Lido recentemente"
            />
            <ProgressBookCard
              title="1984"
              author="George Orwell"
              progressPercentage={32}
              subtitle="Lido recentemente"
            />
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {DEMO_BOOKS.map((book, idx) => (
              <BookCard
                key={book.title}
                rankNumber={idx + 1}
                title={book.title}
                author={book.author}
                category={book.category}
                averageRating={book.averageRating}
                isFreeEligible={book.isFreeEligible}
                isFavorite={favoriteTitles.includes(book.title)}
                onToggleFavorite={() =>
                  setFavoriteTitles((prev) =>
                    prev.includes(book.title)
                      ? prev.filter((item) => item !== book.title)
                      : [...prev, book.title]
                  )
                }
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {OFFICIAL_CATEGORIES.map((category, idx) => (
              <CategoryCard
                key={category.slug}
                index={idx + 1}
                name={category.name}
                slug={category.slug}
                description={category.description}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {OFFICIAL_PLANS.map((plan) => (
              <PlanCard key={plan.name} {...plan} />
            ))}
          </div>
        </section>

        <Divider />

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white">Componentes Administrativos</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Leitores" value={1248} helper="Exemplo visual" />
            <StatCard label="Livros" value={8} />
            <StatCard label="Categorias" value={8} />
            <StatCard label="Assinaturas" value={312} highlight />
          </div>
          <Filters
            searchValue={adminSearch}
            searchPlaceholder="Buscar usuários..."
            onSearchChange={setAdminSearch}
            onClear={() => setAdminSearch('')}
            actions={
              <Button size="sm" onClick={() => setAdminConfirmOpen(true)}>
                Testar ConfirmDialog
              </Button>
            }
          />
          <DataTable
            data={DEMO_ADMIN_ROWS}
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'name', header: 'Nome', render: (r) => r.name },
              { key: 'plan', header: 'Plano', render: (r) => r.plan },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
          <Pagination page={adminPage} totalPages={2} totalItems={2} onPageChange={setAdminPage} />
          <FormField label="Campo encapsulado" htmlFor="demo-field">
            <Input id="demo-field" placeholder="Valor de exemplo" />
          </FormField>
        </section>

        <Divider />

        <section className="space-y-5">
          <h2 className="text-xl font-bold text-white">Modais, Toasts e Estados</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setModalType('confirm')}>
              ConfirmModal
            </Button>
            <Button variant="outline" onClick={() => setModalType('info')}>
              InfoModal
            </Button>
            <Button variant="outline" onClick={() => setModalType('success')}>
              SuccessModal
            </Button>
            <Button variant="danger" onClick={() => setModalType('error')}>
              ErrorModal
            </Button>
            <Button variant="outline" onClick={() => setModalType('form')}>
              FormModal
            </Button>
            <Button
              size="sm"
              onClick={() =>
                showToast({
                  type: 'success',
                  title: 'Toast ativo',
                  message: 'Notificação visual funcionando.',
                })
              }
            >
              Disparar Toast
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
          <EmptyState
            title="Sua biblioteca está começando."
            description="Salve seus favoritos ou comece uma leitura. Suas histórias vão aparecer aqui."
            action={<Button variant="primary">Explorar catálogo</Button>}
          />
          <LoadingScreen />
        </section>
      </div>

      <ConfirmDialog
        isOpen={adminConfirmOpen}
        onClose={() => setAdminConfirmOpen(false)}
        onConfirm={() => setAdminConfirmOpen(false)}
        title="Arquivar este registro?"
        description="Ele deixará de aparecer nas listagens ativas."
      />
      <ConfirmModal
        isOpen={modalType === 'confirm'}
        onClose={() => setModalType(null)}
        onConfirm={() => setModalType(null)}
        title="Desconectar dispositivo?"
        description="Será necessário entrar novamente nesse dispositivo."
      />
      <InfoModal
        isOpen={modalType === 'info'}
        onClose={() => setModalType(null)}
        title="Histórias sem limites."
        description="O Biblioflix reúne livros para descobrir, guardar e ler no seu ritmo."
      />
      <SuccessModal
        isOpen={modalType === 'success'}
        onClose={() => setModalType(null)}
        title="Tudo atualizado."
        description="Suas alterações foram salvas."
      />
      <ErrorModal
        isOpen={modalType === 'error'}
        onClose={() => setModalType(null)}
        eyebrow="PAGAMENTO NÃO APROVADO"
        title="Não foi possível validar o cartão."
        description="Seu cartão foi recusado. Nenhuma cobrança foi realizada."
      />
      <FormModal
        isOpen={modalType === 'form'}
        onClose={() => setModalType(null)}
        onSubmit={(e) => {
          e.preventDefault();
          setModalType(null);
        }}
        title="Editar categoria"
      >
        <Input label="Nome" defaultValue="Romance" />
      </FormModal>
    </AppShell>
  );
}
