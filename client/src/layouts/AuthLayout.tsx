import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/navigation/Footer';
import { BrandLogo } from '../components/ui/BrandLogo';

export interface AuthLayoutProps {
  children: ReactNode;
  eyebrow?: string;
  promoTitle?: string;
  promoSubtitle?: string;
}

export function AuthLayout({
  children,
  eyebrow = 'UM NOVO CAPÍTULO COMEÇA AQUI',
  promoTitle = 'Sua próxima história está esperando.',
  promoSubtitle = 'Uma biblioteca inteira. Um lugar só seu.',
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-bg text-white">
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo size="md" />
        <Link to="/" className="text-xs font-medium text-brand-muted hover:text-white transition-colors">
          Voltar ao início
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:flex relative min-h-[500px] flex-col justify-end overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-[#191F2C] via-brand-surface to-brand-bg p-8">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
              {eyebrow}
            </span>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight text-white">{promoTitle}</h2>
            <p className="mt-2 text-sm text-brand-muted">{promoSubtitle}</p>
          </div>

          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
