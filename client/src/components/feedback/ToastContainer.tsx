import { createPortal } from 'react-dom';
import { ToastType, useToast } from './ToastContext';

const toneClasses: Record<ToastType, string> = {
  success: 'border-emerald-500/50 bg-brand-surface',
  error: 'border-brand-primary bg-brand-surface',
  warning: 'border-amber-500/50 bg-brand-surface',
  info: 'border-sky-500/50 bg-brand-surface',
};

const badgeColor: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-brand-accent',
  warning: 'text-amber-300',
  info: 'text-sky-300',
};

const labelText: Record<ToastType, string> = {
  success: 'Sucesso',
  error: 'Erro',
  warning: 'Aviso',
  info: 'Informação',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`animate-modal-in rounded-lg border p-4 shadow-modal ${toneClasses[toast.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${badgeColor[toast.type]}`}>
                {labelText[toast.type]}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">{toast.title}</p>
              {toast.message && <p className="mt-1 text-xs text-brand-muted">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fechar notificação"
              className="shrink-0 rounded px-1.5 py-0.5 text-xs text-brand-muted hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
