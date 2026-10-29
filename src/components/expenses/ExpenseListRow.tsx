import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, space, type as typeScale } from '@/constants/theme';
import type { Expense } from '@/models/expense';
import { displayTotalKurus } from '@/services/expenses/mapExpense';
import { formatTrDate } from '@/utils/date';
import { formatKurus } from '@/utils/money';

export function ExpenseListRow({ expense, authorName, onPress }: { expense: Expense; authorName?: string; onPress: () => void }) {
  const name = authorName?.trim() ?? '';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.main}>
        <Text style={styles.title}>{formatTrDate(expense.expenseDate)}</Text>
        {name ? <Text style={styles.date}>{name}</Text> : null}
      </View>
      <Text style={styles.amount}>{formatKurus(displayTotalKurus(expense))}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: space.md,
  },
  rowPressed: { backgroundColor: colors.fill },
  main: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontSize: typeScale.body, fontWeight: '500' },
  date: { color: colors.faint, fontSize: typeScale.small },
  amount: { color: colors.ink, fontSize: typeScale.body, fontWeight: '600' },
});
