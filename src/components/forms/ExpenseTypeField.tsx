import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EXPENSE_TYPE_OPTIONS, expenseTypeLabel, type ExpenseType, type ExpenseTypeOption } from '@/constants/expenseTypes';
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
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={styles.option}>
            <Text style={[styles.label, selected && styles.selected]}>{expenseTypeLabel(option.value, null, options)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, minHeight: 44, alignItems: 'center' },
  option: { minHeight: 44, justifyContent: 'center' },
  label: { color: colors.muted, fontSize: typeScale.body },
  selected: { color: colors.ink, fontWeight: '600' },
});
