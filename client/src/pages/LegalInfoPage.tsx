import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../layouts';

export interface LegalInfoPageProps {
  section: 'about' | 'terms' | 'privacy';
}

const CONTENT_MAP = {
  about: {
    eyebrow: 'SOBRE A PLATAFORMA',
    title: 'Histórias sem limites.',
    paragraphs: [
      'O Biblioflix é uma plataforma web de leitura digital por assinatura desenvolvida para descobrir livros, organizar leituras pessoais, acompanhar progresso sincronizado entre dispositivos e explorar novos gêneros.',
      'Esta página apresenta informações iniciais da versão de demonstração do MVP.',
    ],
  },
  terms: {
    eyebrow: 'INFORMAÇÕES DA CONTA',
    title: 'Termos de uso (Texto informativo inicial)',
    paragraphs: [
      'O acesso aos conteúdos respeita as regras do plano contratado (Gratuito, Básico ou Premium), os limites de dispositivos ativos por conta e a disponibilidade editorial de cada título.',
      'Os pagamentos exibidos na plataforma operam em modo simulado para fins de demonstração, sem integração com gateways financeiros reais.',
      'Este conteúdo tem caráter exclusivamente informativo e não substitui um documento jurídico definitivo.',
    ],
  },
  privacy: {
    eyebrow: 'SEGURANÇA E PRIVACIDADE',
    title: 'Sua privacidade importa (Texto informativo inicial)',
    paragraphs: [
      'Os dados cadastrais, preferências de leitura, histórico, progresso e registros de dispositivos são utilizados para autenticação segura por cookies HttpOnly e sincronização da sua biblioteca.',
      'Senhas e tokens de sessão são armazenados exclusivamente em formato criptografado/hash no banco de dados. Números completos de cartão e CVV nunca são armazenados.',
      'Este texto é meramente informativo para a etapa atual da aplicação.',
    ],
  },
};

export function LegalInfoPage({ section }: LegalInfoPageProps) {
  const { user, logout } = useAuth();
  const data = CONTENT_MAP[section];

  return (
    <AppShell
      authState={user ? (user.role === 'ADMIN' ? 'admin' : 'user') : 'visitor'}
      userName={user?.name}
      onLogout={() => void logout()}
      footerVariant="minimal"
    >
      <article className="mx-auto max-w-3xl rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-8 space-y-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
          {data.eyebrow}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{data.title}</h1>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-brand-muted">
          {data.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button variant="outline" size="sm">
              ← Voltar ao início
            </Button>
          </Link>
        </div>
      </article>
    </AppShell>
  );
}
