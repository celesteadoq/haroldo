import { Select } from '../ui/Select';
import type { ReadingStatus } from '../../types/library';

export interface ReadingStatusSelectorProps {
  value: ReadingStatus;
  canMarkCompleted: boolean;
  disabled?: boolean;
  onChange: (nextStatus: ReadingStatus) => void;
}

export function ReadingStatusSelector({
  value,
  canMarkCompleted,
  disabled = false,
  onChange,
}: ReadingStatusSelectorProps) {
  return (
    <Select
      aria-label="Status de leitura"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ReadingStatus)}
      options={[
        { value: 'WANT_TO_READ', label: 'Quero ler' },
        { value: 'READING', label: 'Lendo' },
        {
          value: 'COMPLETED',
          label: canMarkCompleted ? 'Concluído' : 'Concluído (requer obra completa)',
          disabled: !canMarkCompleted,
        },
      ]}
    />
  );
}
