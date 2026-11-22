import { Button } from '../ui/Button';
import { Modal } from './Modal';

export interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
}

export function InfoModal({
  isOpen,
  onClose,
  eyebrow = 'BIBLIOFLIX',
  title,
  description,
  actionLabel = 'Entendi',
}: InfoModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      description={description}
      footer={
        <Button variant="primary" fullWidth onClick={onClose}>
          {actionLabel}
        </Button>
      }
    />
  );
}
