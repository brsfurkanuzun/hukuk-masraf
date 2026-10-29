import { Button, HStack, Picker, Text } from '@expo/ui/swift-ui';
import { buttonStyle, frame, labelsHidden, lineLimit, menuIndicator, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { EXPENSE_TYPE_OPTIONS, isExpenseType, type ExpenseType, type ExpenseTypeOption } from '@/constants/expenseTypes';

const stretch = frame({ maxWidth: Infinity, alignment: 'center' });

export function ExpenseLineCells({
  type,
  cells,
  selected,
  onPress,
  onType,
  options = EXPENSE_TYPE_OPTIONS,
}: {
  type: ExpenseType;
  cells: string[];
  selected?: number | null;
  onPress: (index: number) => void;
  onType: (type: ExpenseType) => void;
  options?: readonly ExpenseTypeOption[];
}) {
  return (
    <HStack spacing={0} alignment="center" modifiers={[frame({ maxWidth: Infinity })]}>
      <Picker
        label="Tür"
        selection={type}
        modifiers={[pickerStyle('menu'), labelsHidden(), menuIndicator('visible'), stretch]}
        onSelectionChange={(next) => {
          if (typeof next === 'string' && isExpenseType(next, options)) {
            onType(next);
          }
        }}
      >
        {options.map((option) => (
          <Text key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ))}
      </Picker>
      {cells.slice(1).map((label, offset) => {
        const index = offset + 1;
        return (
          <Button
            key={`${index}-${label}`}
            label={label}
            onPress={() => onPress(index)}
            modifiers={[buttonStyle(selected === index ? 'borderedProminent' : 'plain'), stretch, lineLimit(1)]}
          />
        );
      })}
    </HStack>
  );
}
