import { EqualLine } from '@/components/forms/EqualLine';
import type { ExpenseType, ExpenseTypeOption } from '@/constants/expenseTypes';

export function ExpenseLineCells({
  cells,
  selected,
  onPress,
}: {
  type: ExpenseType;
  cells: string[];
  selected?: number | null;
  onPress: (index: number) => void;
  onType: (type: ExpenseType) => void;
  options?: readonly ExpenseTypeOption[];
}) {
  return <EqualLine cells={cells} selected={selected} onPress={onPress} />;
}
