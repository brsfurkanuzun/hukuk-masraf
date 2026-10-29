import { Column, RNHostView, Row, Text } from '@expo/ui';
import { weight } from '@expo/ui/jetpack-compose/modifiers';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { TextField } from '@/components/common/TextField';
import { colors, hitSlop, type as typeScale } from '@/constants/theme';

interface PasswordFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}

export function PasswordField({ value, onChangeText, visible, onToggle }: PasswordFieldProps) {
  const label = visible ? 'Şifreyi gizle' : 'Şifreyi göster';
  return (
    <Column spacing={4}>
      <Text textStyle={{ color: colors.muted, fontSize: typeScale.label }}>Şifre</Text>
      <Row alignment="center" spacing={8} style={{ width: '100%' }}>
        <Column modifiers={[weight(1)]}>
          <TextField value={value} onChangeText={onChangeText} secureTextEntry={!visible} autoComplete="current-password" autoCapitalize="none" placeholder="Şifre" inputHeight={32} />
        </Column>
        <RNHostView matchContents style={{ width: 32, height: 32 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onToggle} hitSlop={hitSlop} style={styles.eye}>
            <SymbolView name={{ ios: visible ? 'eye.slash' : 'eye', android: visible ? 'visibility_off' : 'visibility' }} size={20} tintColor={colors.muted} />
          </Pressable>
        </RNHostView>
      </Row>
    </Column>
  );
}

const styles = StyleSheet.create({
  eye: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
