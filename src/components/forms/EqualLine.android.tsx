import { Button, Row, Text } from '@expo/ui';
import { weight } from '@expo/ui/jetpack-compose/modifiers';

import { colors, type as typeScale } from '@/constants/theme';

const stretch = [weight(1)];

export function EqualLine({
  cells,
  onPress,
  pressIndexes,
  selected,
  kind = 'header',
}: {
  cells: string[];
  onPress?: (index: number) => void;
  pressIndexes?: number[];
  selected?: number | null;
  kind?: 'header' | 'row' | 'total';
}) {
  if (kind === 'total') {
    return (
      <Row spacing={0} alignment="center" style={{ width: '100%' }}>
        <Text modifiers={[weight(1)]} numberOfLines={1} textStyle={{ fontSize: 15 }}>
          {' '}
        </Text>
        <Text
          modifiers={[weight(3)]}
          numberOfLines={1}
          textStyle={{ color: colors.ink, fontSize: 15, fontWeight: '700', textAlign: 'left' }}
        >
          {cells[1] ?? ''}
        </Text>
      </Row>
    );
  }

  return (
    <Row spacing={0} alignment="center" style={{ width: '100%' }}>
      {cells.map((label, index) => {
        const tappable = onPress !== undefined && (pressIndexes === undefined || pressIndexes.includes(index));
        if (tappable) {
          return (
            <Button
              key={`${index}-${label}`}
              modifiers={stretch}
              variant={selected === index ? 'filled' : 'text'}
              label={label}
              onPress={() => onPress(index)}
            />
          );
        }
        return (
          <Text
            key={`${index}-${label}`}
            modifiers={stretch}
            numberOfLines={kind === 'header' ? 1 : 2}
            textStyle={{
              color: kind === 'header' ? colors.muted : colors.ink,
              fontSize: kind === 'header' ? typeScale.small : 15,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        );
      })}
    </Row>
  );
}
