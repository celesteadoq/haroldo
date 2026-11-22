import { ReactNode } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyTitle = 'Nenhum registro encontrado.',
  emptyDescription = 'Ajuste os filtros ou cadastre um novo item.',
  onRowClick,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Desktop / Tablet */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-brand-border bg-brand-surface">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg/50 text-xs uppercase tracking-wider text-brand-muted">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3.5 font-semibold ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick ? 'cursor-pointer hover:bg-brand-elevated/60 transition-colors' : ''
                }
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3.5 text-gray-200 ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-2.5"
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3 text-xs">
                <span className="font-semibold text-brand-muted">{col.header}</span>
                <div className="text-right text-gray-200">{col.render(row)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
