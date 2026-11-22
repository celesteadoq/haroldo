export interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className = '' }: DividerProps) {
  if (!label) {
    return <hr className={`border-t border-brand-border ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-brand-border" />
      <span className="text-xs font-medium text-brand-subtle uppercase tracking-wider">{label}</span>
      <span className="h-px flex-1 bg-brand-border" />
    </div>
  );
}
