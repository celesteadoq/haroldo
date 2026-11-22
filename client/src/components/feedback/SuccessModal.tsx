import { Button } from '../ui/Button';
import { Modal } from './Modal';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  secondaryLabel?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  eyebrow = 'BIBLIOFLIX',
  title,
  description,
  primaryLabel = 'Continuar',
  onPrimaryAction,
  secondaryLabel = 'Fechar',
}: SuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="primary" fullWidth onClick={onPrimaryAction ?? onClose}>
            {primaryLabel}
          </Button>
          {secondaryLabel && (
            <Button variant="outline" fullWidth onClick={onClose}>
              {secondaryLabel}
            </Button>
          )}
        </>
      }
    />
  );
}
