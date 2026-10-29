import { Button, Row, Text } from '@expo/ui';

import { colors, type as typeScale } from '@/constants/theme';

export function ExpenseAddHeader({ onAdd, title = 'Masraflar' }: { onAdd: () => void; title?: string }) {
  return (
    <Row alignment="center" spacing={8}>
      <Text textStyle={{ color: colors.muted, fontSize: typeScale.small, fontWeight: '600' }}>{title}</Text>
      <Button label="+" onPress={onAdd} style={{ width: 32, height: 32, paddingHorizontal: 0, borderRadius: 16, backgroundColor: colors.navy }} />
    </Row>
  );
}
