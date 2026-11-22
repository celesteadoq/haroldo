import { Badge, BadgeVariant } from './Badge';

export type EntityStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'CANCELED'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'PAST_DUE'
  | 'PAID'
  | 'PENDING'
  | 'FAILED'
  | 'REFUNDED'
  | 'PUBLISHED'
  | 'ARCHIVED';

const statusConfig: Record<EntityStatus, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Ativa', variant: 'success' },
  TRIALING: { label: 'Teste grátis', variant: 'info' },
  CANCELED: { label: 'Cancelada', variant: 'warning' },
  EXPIRED: { label: 'Expirada', variant: 'neutral' },
  SUSPENDED: { label: 'Suspensa', variant: 'error' },
  PAST_DUE: { label: 'Pendente', variant: 'warning' },
  PAID: { label: 'Pago', variant: 'success' },
  PENDING: { label: 'Aguardando', variant: 'warning' },
  FAILED: { label: 'Recusado', variant: 'error' },
  REFUNDED: { label: 'Estornado', variant: 'neutral' },
  PUBLISHED: { label: 'Publicado', variant: 'success' },
  ARCHIVED: { label: 'Arquivado', variant: 'neutral' },
};

export interface StatusBadgeProps {
  status: EntityStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}
