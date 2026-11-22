import { Button } from '../ui/Button';
import { Modal } from './Modal';

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimaryAction?: () => void;
  secondaryLabel?: string;
}

export function ErrorModal({
  isOpen,
  onClose,
  eyebrow = 'ATENÇÃO',
  title,
  description,
  primaryLabel = 'Tentar novamente',
  onPrimaryAction,
  secondaryLabel = 'Fechar',
}: ErrorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      description={description}
      accentTone="error"
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
