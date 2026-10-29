import { Column, Text } from '@expo/ui';
import { Button, HStack, Image } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonStyle, frame } from '@expo/ui/swift-ui/modifiers';

import { TextField } from '@/components/common/TextField';
import { colors, type as typeScale } from '@/constants/theme';

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
      <HStack alignment="center" spacing={8} modifiers={[frame({ maxWidth: Infinity }), frame({ height: 32 })]}>
        <HStack modifiers={[frame({ maxWidth: Infinity }), frame({ height: 32 })]}>
          <TextField value={value} onChangeText={onChangeText} secureTextEntry={!visible} autoComplete="current-password" autoCapitalize="none" placeholder="Şifre" inputHeight={32} />
        </HStack>
        <Button onPress={onToggle} modifiers={[buttonStyle('plain'), frame({ width: 32, height: 32 }), accessibilityLabel(label)]}>
          <Image systemName={visible ? 'eye.slash' : 'eye'} size={20} color={colors.muted} />
        </Button>
      </HStack>
    </Column>
  );
}
