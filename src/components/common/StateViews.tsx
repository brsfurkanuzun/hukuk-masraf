import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { colors, space, type as typeScale } from '@/constants/theme';

export function LoadingState({ label = 'Yükleniyor' }: { label?: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.block}>
      <Text style={styles.body}>{message}</Text>
      {onRetry ? <Button label="Tekrar dene" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.lg, alignItems: 'center' },
  title: { color: colors.ink, fontSize: typeScale.section, fontWeight: '600', textAlign: 'center' },
  body: { color: colors.muted, fontSize: typeScale.body, textAlign: 'center' },
});
