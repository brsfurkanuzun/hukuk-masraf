import { Button, Row, Text } from '@expo/ui';
import { View } from 'react-native';

import { colors, type as typeScale } from '@/constants/theme';

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
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
        <View style={{ flex: 1 }} />
        <View style={{ flex: 3 }}>
          <Text numberOfLines={1} textStyle={{ color: colors.ink, fontSize: 15, fontWeight: '700', textAlign: 'left' }}>
            {cells[1] ?? ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Row spacing={8} alignment="center">
      {cells.map((label, index) => {
        const tappable = onPress !== undefined && (pressIndexes === undefined || pressIndexes.includes(index));
        if (tappable) {
          return <Button key={`${index}-${label}`} variant={selected === index ? 'filled' : 'text'} label={label} onPress={() => onPress(index)} />;
        }
        return (
          <Text
            key={`${index}-${label}`}
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
