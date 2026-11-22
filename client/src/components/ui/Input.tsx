import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, leftIcon, rightElement, id, disabled, className = '', ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-gray-200">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 text-brand-subtle">{leftIcon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`h-11 w-full rounded-md bg-brand-surface text-sm text-white placeholder:text-brand-subtle border transition-colors ${
            leftIcon ? 'pl-10' : 'px-3.5'
          } ${rightElement ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-brand-error focus:border-brand-error'
              : 'border-brand-borderInput hover:border-gray-600 focus:border-brand-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          {...rest}
        />
        {rightElement && <div className="absolute right-2.5 flex items-center">{rightElement}</div>}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-brand-accent">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-brand-subtle">
          {helperText}
        </p>
      )}
    </div>
  );
});
