import { Column, Picker, Text } from '@expo/ui';

import { EXPENSE_TYPE_OPTIONS, isExpenseType, type ExpenseType, type ExpenseTypeOption } from '@/constants/expenseTypes';
import { colors, type as typeScale } from '@/constants/theme';

export function ExpenseTypeField({
  value,
  onChange,
  options = EXPENSE_TYPE_OPTIONS,
}: {
  value: ExpenseType;
  onChange: (value: ExpenseType) => void;
  appearance?: 'menu' | 'wheel';
  options?: readonly ExpenseTypeOption[];
}) {
  return (
    <Column spacing={4}>
      <Text textStyle={{ color: colors.muted, fontSize: typeScale.label }}>Tür</Text>
      <Picker
        selectedValue={value}
        onValueChange={(next) => {
          if (typeof next === 'string' && isExpenseType(next, options)) {
            onChange(next);
          }
        }}
      >
        {options.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>
    </Column>
  );
}
