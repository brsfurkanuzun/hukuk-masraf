import { Button as NativeButton, Text } from '@expo/ui';
import { Platform, Pressable, StyleSheet, Text as RnText, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, type as typeScale } from '@/constants/theme';

interface ButtonProps extends Pick<PressableProps, 'accessibilityLabel'> {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
}

export function Button(props: ButtonProps) {
  if (Platform.OS === 'web') {
    return <WebButton {...props} />;
  }
  return <NativeAction {...props} />;
}

function NativeAction({ label, onPress, disabled = false, loading = false, variant = 'primary', style }: ButtonProps) {
  const inactive = disabled || loading;
  const nativeVariant = variant === 'secondary' ? 'outlined' : variant === 'ghost' || variant === 'danger' ? 'text' : 'filled';
  const shown = loading ? `${label}…` : label;
  const nativeStyle = nativeWidthStyle(style);
  if (variant === 'danger') {
    return (
      <NativeButton variant="text" onPress={onPress} disabled={inactive} style={nativeStyle}>
        <Text textStyle={{ color: colors.danger, fontSize: typeScale.body, fontWeight: '600' }}>{shown}</Text>
      </NativeButton>
    );
  }
  return <NativeButton label={shown} onPress={onPress} disabled={inactive} variant={nativeVariant} style={nativeStyle} />;
}

function nativeWidthStyle(style: StyleProp<ViewStyle>) {
  const width = StyleSheet.flatten(style)?.width;
  if (typeof width === 'number' || (typeof width === 'string' && width.endsWith('%'))) {
    return { width: width as `${number}%` };
  }
  return undefined;
}

function WebButton({ label, onPress, disabled = false, loading = false, variant = 'primary', accessibilityLabel, style }: ButtonProps) {
  const inactive = disabled || loading;
  const lightLabel = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [web.base, variant === 'primary' ? web.primary : web.plain, inactive && web.disabled, pressed && !inactive && web.pressed, style]}
    >
      <RnText style={[web.label, lightLabel ? web.labelLight : variant === 'danger' ? web.labelDanger : web.labelDark]}>{loading ? `${label}…` : label}</RnText>
    </Pressable>
  );
}

const web = StyleSheet.create({
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
