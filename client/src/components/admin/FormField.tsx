import { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  helperText,
  error,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-200">
        {label}
        {required && <span className="ml-1 text-brand-accent">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-brand-accent">
          {error}
        </p>
      )}
      {!error && helperText && <p className="text-xs text-brand-subtle">{helperText}</p>}
    </div>
  );
}
