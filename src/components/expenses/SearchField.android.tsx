import { Row, Text } from '@expo/ui';

import { TextField } from '@/components/common/TextField';
import { colors, type as typeScale } from '@/constants/theme';

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Row alignment="center" spacing={12} style={{ width: '100%' }}>
      <TextField
        variant="search"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        inputMode="search"
        enterKeyHint="search"
        placeholder={placeholder}
      />
      <Text textStyle={{ color: colors.muted, fontSize: typeScale.title }}>⌕</Text>
    </Row>
  );
}
