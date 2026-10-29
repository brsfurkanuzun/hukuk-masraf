import { Column, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import { Button } from '@/components/common/Button';
import { colors, type as typeScale } from '@/constants/theme';

export function LoadingState({ label = 'Yükleniyor' }: { label?: string }) {
  return (
    <Column spacing={8} modifiers={[fillMaxWidth()]}>
      <Text textStyle={{ color: colors.ink, fontSize: typeScale.section, fontWeight: '600' }}>{label}</Text>
    </Column>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Column spacing={12} modifiers={[fillMaxWidth()]}>
      <Text textStyle={{ color: colors.muted, fontSize: typeScale.body }}>{message}</Text>
      {onRetry ? <Button label="Tekrar dene" onPress={onRetry} variant="secondary" /> : null}
    </Column>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Column spacing={8} modifiers={[fillMaxWidth()]}>
      <Text textStyle={{ color: colors.ink, fontSize: typeScale.section, fontWeight: '600' }}>{title}</Text>
      <Text textStyle={{ color: colors.muted, fontSize: typeScale.body }}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </Column>
  );
}
