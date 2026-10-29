import { Button, Grid, HStack, Spacer, Text } from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle, frame, gridCellColumns, gridCellUnsizedAxes, lineLimit } from '@expo/ui/swift-ui/modifiers';

import { colors } from '@/constants/theme';

const stretch = frame({ maxWidth: Infinity, alignment: 'center' });

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
    const amount = cells[1] ?? '';
    const column = frame({ maxWidth: Infinity, maxHeight: 0 });
    return (
      <Grid alignment="leading" horizontalSpacing={0} verticalSpacing={0} modifiers={[frame({ maxWidth: Infinity })]}>
        <Grid.Row>
          <Spacer modifiers={[column]} />
          <Spacer modifiers={[column]} />
          <Spacer modifiers={[column]} />
          <Spacer modifiers={[column]} />
        </Grid.Row>
        <Grid.Row>
          <Spacer modifiers={[gridCellUnsizedAxes('horizontal')]} />
          <Text
            modifiers={[
              gridCellColumns(3),
              frame({ maxWidth: Infinity, alignment: 'leading' }),
              font({ size: 15, weight: 'bold' }),
              foregroundStyle(colors.ink),
              lineLimit(1),
            ]}
          >
            {amount}
          </Text>
        </Grid.Row>
      </Grid>
    );
  }

  return (
    <HStack spacing={0} alignment="center" modifiers={[frame({ maxWidth: Infinity })]}>
      {cells.map((label, index) => {
        const tappable = onPress !== undefined && (pressIndexes === undefined || pressIndexes.includes(index));
        if (tappable) {
          return (
            <Button
              key={`${index}-${label}`}
              label={label}
              onPress={() => onPress(index)}
              modifiers={[buttonStyle(selected === index ? 'borderedProminent' : 'plain'), stretch, lineLimit(kind === 'row' ? 2 : 1)]}
            />
          );
        }
        return (
          <Text
            key={`${index}-${label}`}
            modifiers={[
              stretch,
              font({ size: kind === 'row' ? 15 : 13, weight: 'semibold' }),
              foregroundStyle(kind === 'header' ? colors.muted : colors.ink),
              lineLimit(kind === 'header' ? 1 : 2),
            ]}
          >
            {label}
          </Text>
        );
      })}
    </HStack>
  );
}
