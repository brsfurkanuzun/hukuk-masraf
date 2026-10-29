import { Button as SwiftButton, Text } from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle, tint } from '@expo/ui/swift-ui/modifiers';

import type { ButtonProps } from '@/components/common/Button.types';
import { colors, type as typeScale } from '@/constants/theme';

export function Button({ label, onPress, disabled = false, loading = false, variant = 'primary' }: ButtonProps) {
  const inactive = disabled || loading;
  const shown = loading ? `${label}…` : label;
  const style = variant === 'secondary' ? 'bordered' : variant === 'ghost' || variant === 'danger' ? 'plain' : 'borderedProminent';
  const tone = variant === 'danger' ? colors.danger : variant === 'primary' ? colors.navy : colors.ink;

  return (
    <SwiftButton onPress={onPress} disabled={inactive} modifiers={[buttonStyle(style), ...(variant === 'primary' ? [tint(colors.navy)] : [])]}>
      <Text modifiers={[font({ size: typeScale.body, weight: 'semibold' }), foregroundStyle(tone)]}>{shown}</Text>
    </SwiftButton>
  );
}
