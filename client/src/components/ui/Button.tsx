import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-primaryHover active:bg-brand-primaryActive border border-transparent',
  secondary:
    'bg-brand-surface text-white border border-brand-borderInput hover:bg-brand-elevated active:bg-[#1E2738]',
  outline:
    'bg-transparent text-white border border-brand-borderInput hover:bg-brand-surface active:bg-brand-elevated',
  ghost:
    'bg-transparent text-brand-muted hover:text-white hover:bg-brand-surface/70 border border-transparent',
  danger:
    'bg-brand-promo text-brand-accent border border-brand-primary/60 hover:bg-brand-primary hover:text-white active:bg-brand-primaryActive',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150 select-none ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${
        isDisabled ? 'opacity-55 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      {...rest}
    >
      {loading ? <LoadingSpinner size="sm" /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
