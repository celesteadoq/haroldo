import { FormEvent, ReactNode } from 'react';
import { Button } from '../ui/Button';
import { Modal } from './Modal';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  eyebrow?: string;
  title: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  children: ReactNode;
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  eyebrow = 'BIBLIOFLIX',
  title,
  description,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  loading = false,
  children,
}: FormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      description={description}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="pt-2 flex flex-col gap-2.5">
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" fullWidth disabled={loading} onClick={onClose}>
            {cancelLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
