import { ProgressView, Text, VStack } from '@expo/ui/swift-ui';
import { controlSize, font, foregroundStyle, frame, padding, tint } from '@expo/ui/swift-ui/modifiers';

import { Button } from '@/components/common/Button';
import { colors, type as typeScale } from '@/constants/theme';

export function LoadingState({ label = 'Yükleniyor' }: { label?: string }) {
  return (
    <VStack spacing={12} alignment="center" modifiers={[frame({ maxWidth: Infinity }), padding({ vertical: 24 })]}>
      <ProgressView modifiers={[tint(colors.navy), controlSize('large')]} />
      <Text modifiers={[font({ size: typeScale.label, weight: 'medium' }), foregroundStyle(colors.muted)]}>{label}</Text>
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
