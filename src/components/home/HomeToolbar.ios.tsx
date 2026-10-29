import { Button, HStack, Image, Spacer, Text } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, font, foregroundStyle, frame, lineLimit, padding, tint, truncationMode } from '@expo/ui/swift-ui/modifiers';

import { colors } from '@/constants/theme';

export function HomeToolbar({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <HStack alignment="center" spacing={12} modifiers={[frame({ maxWidth: Infinity }), padding({ horizontal: 16, top: 8, bottom: 4 })]}>
      <Text modifiers={[font({ size: 28, weight: 'bold' }), foregroundStyle(colors.ink), lineLimit(1), truncationMode('tail')]}>{title}</Text>
      <Spacer />
      <Button
        onPress={onAdd}
        modifiers={[
          buttonStyle('borderedProminent'),
          buttonBorderShape('circle'),
          controlSize('extraLarge'),
          tint(colors.navy),
          frame({ width: 52, height: 52 }),
        ]}
      >
        <Image systemName="plus" size={24} color={colors.white} />
      </Button>
    </HStack>
  );
}
