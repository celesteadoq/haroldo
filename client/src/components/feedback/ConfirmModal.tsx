import { Button } from '../ui/Button';
import { Modal } from './Modal';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eyebrow?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  closeOnBackdrop?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  eyebrow = 'BIBLIOFLIX',
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  closeOnBackdrop = true,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      description={description}
      closeOnBackdrop={closeOnBackdrop}
      footer={
        <>
          <Button variant="primary" fullWidth loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="outline" fullWidth disabled={loading} onClick={onClose}>
            {cancelLabel}
          </Button>
        </>
      }
    />
  );
}
