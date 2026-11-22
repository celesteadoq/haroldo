import { SelectHTMLAttributes, forwardRef, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, placeholder, helperText, error, options, id, disabled, className = '', ...rest },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-gray-200">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`h-11 w-full rounded-md bg-brand-surface px-3.5 text-sm text-white border transition-colors ${
          error
            ? 'border-brand-error focus:border-brand-error'
            : 'border-brand-borderInput hover:border-gray-600 focus:border-brand-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-brand-surface">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-xs text-brand-accent">
          {error}
        </p>
      )}
      {!error && helperText && <p className="text-xs text-brand-subtle">{helperText}</p>}
    </div>
  );
});
