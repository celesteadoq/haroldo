import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Divider } from '../ui/Divider';

export interface PlanCardProps {
  name: string;
  description: string;
  price: number;
  benefits: string[];
  actionLabel: string;
  isRecommended?: boolean;
  recommendedBadge?: string;
  isCurrent?: boolean;
  onSelect?: () => void;
}

function formatPriceBRL(price: number): string {
  if (price === 0) return '0';
  return price.toFixed(2).replace('.', ',');
}

export function PlanCard({
  name,
  description,
  price,
  benefits,
  actionLabel,
  isRecommended = false,
  recommendedBadge = 'MAIS ESCOLHIDO',
  isCurrent = false,
  onSelect,
}: PlanCardProps) {
  return (
    <article
      className={`flex h-full flex-col justify-between rounded-xl border bg-brand-surface p-6 ${
        isRecommended ? 'border-brand-primary shadow-card' : 'border-brand-border'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          {isRecommended && <Badge variant="primary">{recommendedBadge}</Badge>}
        </div>
        <p className="mt-1.5 text-sm text-brand-muted">{description}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-sm font-medium text-brand-muted">R$</span>
          <span className="text-4xl font-extrabold tracking-tight text-white">
            {formatPriceBRL(price)}
          </span>
          <span className="text-xs text-brand-muted">/mês</span>
        </div>

        <Divider className="my-5" />

        <ul className="space-y-2.5 text-sm text-gray-200">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="text-brand-accent font-bold">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7">
        <Button
          variant={isRecommended ? 'primary' : 'outline'}
          fullWidth
          disabled={isCurrent}
          onClick={onSelect}
        >
          {isCurrent ? 'Plano atual' : actionLabel}
        </Button>
      </div>
    </article>
  );
}
