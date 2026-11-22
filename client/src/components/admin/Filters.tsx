import { ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface FiltersProps {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onClear?: () => void;
  children?: ReactNode;
  actions?: ReactNode;
}

export function Filters({
  searchValue,
  searchPlaceholder = 'Buscar...',
  onSearchChange,
  onClear,
  children,
  actions,
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-border bg-brand-surface p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
        {onSearchChange && (
          <div className="min-w-[220px] flex-1">
            <Input
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {children}
        {onClear && (
          <Button type="button" variant="outline" size="md" onClick={onClear}>
            Limpar
          </Button>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
