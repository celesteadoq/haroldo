import { TextareaHTMLAttributes, forwardRef, useId } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helperText, error, id, disabled, rows = 4, className = '', ...rest },
  ref
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-gray-200">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-md bg-brand-surface p-3.5 text-sm text-white placeholder:text-brand-subtle border transition-colors ${
          error
            ? 'border-brand-error focus:border-brand-error'
            : 'border-brand-borderInput hover:border-gray-600 focus:border-brand-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p role="alert" className="text-xs text-brand-accent">
          {error}
        </p>
      )}
      {!error && helperText && <p className="text-xs text-brand-subtle">{helperText}</p>}
    </div>
  );
});
