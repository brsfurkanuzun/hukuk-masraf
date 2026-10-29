import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, frame } from '@expo/ui/swift-ui/modifiers';

import { Button } from '@/components/common/Button';
import { colors, type as typeScale } from '@/constants/theme';

export function LoadingState({ label = 'Yükleniyor' }: { label?: string }) {
  return (
    <VStack spacing={8} modifiers={[frame({ maxWidth: Infinity })]}>
      <Text modifiers={[font({ size: typeScale.section, weight: 'semibold' }), foregroundStyle(colors.ink)]}>{label}</Text>
    </VStack>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <VStack spacing={12} modifiers={[frame({ maxWidth: Infinity })]}>
      <Text modifiers={[font({ size: typeScale.body }), foregroundStyle(colors.muted)]}>{message}</Text>
      {onRetry ? <Button label="Tekrar dene" onPress={onRetry} variant="secondary" /> : null}
    </VStack>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <VStack spacing={8} modifiers={[frame({ maxWidth: Infinity })]}>
      <Text modifiers={[font({ size: typeScale.section, weight: 'semibold' }), foregroundStyle(colors.ink)]}>{title}</Text>
      <Text modifiers={[font({ size: typeScale.body }), foregroundStyle(colors.muted)]}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </VStack>
  );
}
