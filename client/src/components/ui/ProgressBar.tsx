export interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  className = '',
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const percent = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs text-brand-muted">
          <span>{label ?? 'Progresso'}</span>
          {showLabel && <span className="font-medium text-white">{percent}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(value)}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E2636]"
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
