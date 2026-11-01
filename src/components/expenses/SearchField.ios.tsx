import { Button, HStack, Image } from '@expo/ui/swift-ui';
import { accessibilityLabel, background, buttonStyle, cornerRadius, frame, padding } from '@expo/ui/swift-ui/modifiers';

import { TextField } from '@/components/common/TextField';
import { colors } from '@/constants/theme';

/** iOS: büyüteç solda, yazı varken sağda temizle (x) düğmesi olan dolgulu yuvarlak arama alanı. */
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
    <HStack
      alignment="center"
      spacing={8}
      modifiers={[frame({ maxWidth: Infinity }), padding({ horizontal: 12, vertical: 8 }), background(colors.search), cornerRadius(12)]}
    >
      <Image systemName="magnifyingglass" size={18} color={colors.muted} />
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
      {value ? (
        <Button
          onPress={() => onChangeText('')}
          modifiers={[buttonStyle('plain'), frame({ width: 28, height: 28 }), accessibilityLabel('Aramayı temizle')]}
        >
          <Image systemName="xmark.circle.fill" size={18} color={colors.faint} />
        </Button>
      ) : null}
    </HStack>
  );
}
