import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import type { ButtonProps } from '@/components/common/Button.types';
import { colors, radius, type as typeScale } from '@/constants/theme';

/** Web fallback. */
export function Button({ label, onPress, disabled = false, loading = false, variant = 'primary', accessibilityLabel, style }: ButtonProps) {
  const inactive = disabled || loading;
  const lightLabel = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [styles.base, variant === 'primary' ? styles.primary : styles.plain, inactive && styles.disabled, pressed && !inactive && styles.pressed, style]}
    >
      <Text style={[styles.label, lightLabel ? styles.labelLight : variant === 'danger' ? styles.labelDanger : styles.labelDark]}>{loading ? `${label}…` : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 44, borderRadius: radius.lg, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.navy },
  plain: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  label: { fontSize: typeScale.body, fontWeight: '600' },
  labelLight: { color: colors.white },
  labelDark: { color: colors.ink },
  labelDanger: { color: colors.danger },
});
