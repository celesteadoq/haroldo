import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  helperText?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, helperText, error, id, disabled, className = '', ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className={`inline-flex items-start gap-2.5 text-sm select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`mt-0.5 h-4 w-4 border-brand-borderInput bg-brand-surface text-brand-primary accent-[#F42A48] ${className}`}
          {...rest}
        />
        <span className="text-gray-200 leading-snug">{label}</span>
      </label>
      {error && (
        <p role="alert" className="text-xs text-brand-accent pl-6">
          {error}
        </p>
      )}
      {!error && helperText && <p className="text-xs text-brand-subtle pl-6">{helperText}</p>}
    </div>
  );
});
