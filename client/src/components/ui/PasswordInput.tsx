import { forwardRef, useState } from 'react';
import { Input, InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'type' | 'rightElement'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        rightElement={
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            className="rounded px-2 py-1 text-xs font-medium text-brand-muted hover:text-white transition-colors"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        }
        {...props}
      />
    );
  }
);
