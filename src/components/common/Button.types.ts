import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

export interface ButtonProps extends Pick<PressableProps, 'accessibilityLabel'> {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
}
