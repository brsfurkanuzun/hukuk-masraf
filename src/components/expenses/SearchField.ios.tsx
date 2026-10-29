import { HStack, Image } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';

import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/theme';

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
    <HStack alignment="center" spacing={12} modifiers={[frame({ maxWidth: Infinity })]}>
      <HStack modifiers={[frame({ maxWidth: Infinity })]}>
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
      </HStack>
      <Image systemName="magnifyingglass" size={22} color={colors.muted} />
    </HStack>
  );
}
