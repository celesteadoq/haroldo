export interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, helper, highlight = false }: StatCardProps) {
  return (
    <article
      className={`rounded-xl border bg-brand-surface p-5 ${
        highlight ? 'border-brand-primary/60' : 'border-brand-border'
      }`}
    >
      <p className="text-xs font-medium text-brand-muted">{label}</p>
      <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{value}</p>
      {helper && <p className="mt-1.5 text-[11px] text-brand-subtle">{helper}</p>}
    </article>
  );
}
