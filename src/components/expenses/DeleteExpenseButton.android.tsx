import { Button, Text } from '@expo/ui';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import { colors, type as typeScale } from '@/constants/theme';

export function DeleteExpenseButton({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="text" onPress={onPress} modifiers={[fillMaxWidth()]}>
      <Text textStyle={{ color: colors.danger, fontSize: typeScale.body, fontWeight: '600', textAlign: 'center' }}>Sil</Text>
    </Button>
  );
}
