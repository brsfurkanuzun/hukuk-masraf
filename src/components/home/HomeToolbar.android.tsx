import { Row, Text } from '@expo/ui';
import { FilledIconButton } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, size, weight } from '@expo/ui/jetpack-compose/modifiers';

import { colors } from '@/constants/theme';

export function HomeToolbar({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <Row alignment="center" style={{ width: '100%' }} modifiers={[fillMaxWidth(), padding(16, 8, 16, 4)]}>
      <Text modifiers={[weight(1)]} numberOfLines={1} textStyle={{ color: colors.ink, fontSize: 28, fontWeight: '700' }}>
        {title}
      </Text>
      <FilledIconButton onClick={onAdd} colors={{ containerColor: colors.navy, contentColor: colors.white }} modifiers={[size(56, 56)]}>
        <Text textStyle={{ color: colors.white, fontSize: 32, fontWeight: '500' }}>+</Text>
      </FilledIconButton>
    </Row>
  );
}
