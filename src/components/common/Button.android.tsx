import { Button as ComposeButton, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import type { ButtonProps } from '@/components/common/Button.types';
import { colors, type as typeScale } from '@/constants/theme';

export function Button({ label, onPress, disabled = false, loading = false, variant = 'primary', style }: ButtonProps) {
  const inactive = disabled || loading;
  const nativeVariant = variant === 'secondary' ? 'outlined' : variant === 'ghost' || variant === 'danger' ? 'text' : 'filled';
  const shown = loading ? `${label}…` : label;
  const width = style && typeof style === 'object' && 'width' in style ? style.width : undefined;

  if (variant === 'danger') {
    return (
      <ComposeButton variant="text" onPress={onPress} disabled={inactive} modifiers={width === '100%' ? [fillMaxWidth()] : []}>
        <Text textStyle={{ color: colors.danger, fontSize: typeScale.body, fontWeight: '600', textAlign: 'center' }}>{shown}</Text>
      </ComposeButton>
    );
  }

  return (
    <ComposeButton
      label={shown}
      onPress={onPress}
      disabled={inactive}
      variant={nativeVariant}
      modifiers={width === '100%' ? [fillMaxWidth()] : []}
    />
  );
}
