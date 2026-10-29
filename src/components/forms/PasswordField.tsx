import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { TextField } from '@/components/common/TextField';
import { colors, hitSlop } from '@/constants/theme';

interface PasswordFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}

export function PasswordField({ value, onChangeText, visible, onToggle }: PasswordFieldProps) {
  const label = visible ? 'Şifreyi gizle' : 'Şifreyi göster';
  return (
    <TextField
      label="Şifre"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!visible}
      autoComplete="current-password"
      autoCapitalize="none"
      trailing={
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onToggle} hitSlop={hitSlop} style={styles.eye}>
          <SymbolView name={{ web: visible ? 'visibility_off' : 'visibility' }} size={20} tintColor={colors.muted} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  eye: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
