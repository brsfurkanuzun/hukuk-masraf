import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type as typeScale } from '@/constants/theme';

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) {
    return null;
  }
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function DetailRowsCard({ heading, rows }: { heading: string; rows: { label: string; value: string }[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>{heading}</Text>
      {rows.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space.lg,
    marginTop: space.xs,
    marginBottom: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.xs,
  },
  cardHeading: {
    color: colors.faint,
    fontSize: typeScale.small,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: space.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.md,
    paddingVertical: space.xs,
  },
  detailLabel: {
    width: 88,
    color: colors.faint,
    fontSize: typeScale.small,
    lineHeight: 22,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    color: colors.ink,
    fontSize: typeScale.body,
    lineHeight: 22,
  },
});
