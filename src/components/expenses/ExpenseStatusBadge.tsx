import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { ExpenseDeliveryStatus } from '@/models/expense';

/** Masraf durumu: Yeni (yeşil) / Teslim Edildi (kırmızı). */
export function ExpenseStatusBadge({ status }: { status?: ExpenseDeliveryStatus }) {
  const delivered = status === 'delivered';
  return (
    <View style={[styles.badge, delivered ? styles.delivered : styles.fresh]}>
      <Text style={[styles.label, { color: delivered ? colors.danger : colors.accent }]}>{delivered ? 'Teslim Edildi' : 'Yeni'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  fresh: { backgroundColor: colors.accentSoft },
  delivered: { backgroundColor: colors.dangerSoft },
  label: { fontSize: 12, fontWeight: '600' },
});
