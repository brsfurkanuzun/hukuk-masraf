import { Button, Text } from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle, frame, listRowBackground, listRowSeparator } from '@expo/ui/swift-ui/modifiers';

import { colors, type as typeScale } from '@/constants/theme';

const center = frame({ maxWidth: Infinity, alignment: 'center' });

export function DeleteExpenseButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      onPress={onPress}
      modifiers={[buttonStyle('plain'), listRowBackground('clear'), listRowSeparator('hidden'), center]}
    >
      <Text modifiers={[font({ size: typeScale.body, weight: 'semibold' }), foregroundStyle(colors.danger), center]}>Sil</Text>
    </Button>
  );
}
