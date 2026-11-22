import { ReactNode, useId, useState } from 'react';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? tooltipId : undefined}>{children}</span>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-brand-border bg-brand-elevated px-2.5 py-1 text-xs text-white shadow-card ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
