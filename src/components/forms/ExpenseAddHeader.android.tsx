import { Row, Text } from '@expo/ui';
import { FilledIconButton } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, size, weight } from '@expo/ui/jetpack-compose/modifiers';

import { colors, type as typeScale } from '@/constants/theme';

export function ExpenseAddHeader({ onAdd, title = 'Masraflar' }: { onAdd: () => void; title?: string }) {
  return (
    <Row alignment="center" style={{ width: '100%' }} modifiers={[fillMaxWidth()]}>
      <Text modifiers={[weight(1)]} textStyle={{ color: colors.muted, fontSize: typeScale.small, fontWeight: '600' }}>
        {title}
      </Text>
      <FilledIconButton onClick={onAdd} colors={{ containerColor: colors.navy, contentColor: colors.white }} modifiers={[size(36, 36)]}>
        <Text textStyle={{ color: colors.white, fontSize: 22, fontWeight: '500' }}>+</Text>
      </FilledIconButton>
    </Row>
  );
}
