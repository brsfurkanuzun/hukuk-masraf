import { Picker, Text } from '@expo/ui/swift-ui';
import { frame, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { EXPENSE_TYPE_OPTIONS, isExpenseType, type ExpenseType, type ExpenseTypeOption } from '@/constants/expenseTypes';

export function ExpenseTypeField({
  value,
  onChange,
  appearance = 'menu',
  options = EXPENSE_TYPE_OPTIONS,
}: {
  value: ExpenseType;
  onChange: (value: ExpenseType) => void;
  appearance?: 'menu' | 'wheel';
  options?: readonly ExpenseTypeOption[];
}) {
  return (
    <Picker
      label="Tür"
      selection={value}
      modifiers={[pickerStyle(appearance), ...(appearance === 'wheel' ? [frame({ height: 180 })] : [])]}
      onSelectionChange={(next) => {
        if (typeof next === 'string' && isExpenseType(next, options)) {
          onChange(next);
        }
      }}
    >
      {options.map((option) => (
        <Text key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}
