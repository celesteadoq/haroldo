import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  accentTone?: 'default' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-[420px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[640px]',
};

export function Modal({
  isOpen,
  onClose,
  eyebrow = 'BIBLIOFLIX',
  title,
  description,
  children,
  footer,
  closeOnBackdrop = true,
  accentTone = 'default',
  size = 'sm',
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="presentation"
      onClick={() => {
        if (closeOnBackdrop) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onClick={(e) => e.stopPropagation()}
        className={`animate-modal-in w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-xl bg-brand-surface p-6 sm:p-7 shadow-modal border ${
          accentTone === 'error' ? 'border-brand-primary' : 'border-brand-border'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-brand-muted hover:text-white transition-colors"
            aria-label="Fechar janela"
          >
            Fechar ×
          </button>
        </div>

        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-accent">
            {eyebrow}
          </p>
        )}

        <h2 id={titleId} className="mt-2 text-2xl font-extrabold tracking-tight text-white">
          {title}
        </h2>

        {description && (
          <p id={descId} className="mt-2.5 text-sm leading-relaxed text-brand-muted">
            {description}
          </p>
        )}

        {children && <div className="mt-5">{children}</div>}

        {footer && <div className="mt-6 flex flex-col gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
