import { ConfirmModal, type ConfirmModalProps } from '../feedback/ConfirmModal';

export type ConfirmDialogProps = ConfirmModalProps;

export function ConfirmDialog(props: ConfirmDialogProps) {
  return <ConfirmModal {...props} />;
}
