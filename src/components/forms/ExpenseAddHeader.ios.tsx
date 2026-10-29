import { Button, HStack, Image, Spacer, Text } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, font, foregroundStyle, frame, tint } from '@expo/ui/swift-ui/modifiers';

import { colors } from '@/constants/theme';

export function ExpenseAddHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <HStack alignment="center" modifiers={[frame({ maxWidth: Infinity })]}>
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(colors.muted)]}>Masraflar</Text>
      <Spacer />
      <Button
        onPress={onAdd}
        modifiers={[
          buttonStyle('borderedProminent'),
          buttonBorderShape('circle'),
          controlSize('small'),
          tint(colors.navy),
          frame({ width: 32, height: 32 }),
        ]}
      >
        <Image systemName="plus" size={16} color={colors.white} />
      </Button>
    </HStack>
  );
}
