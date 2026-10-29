import { Button, Circle, HStack, Image, Spacer, Text, ZStack } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, font, foregroundStyle, frame, lineLimit, padding, tint, truncationMode } from '@expo/ui/swift-ui/modifiers';

import { colors } from '@/constants/theme';

import { HomeToolbarAddControl } from './HomeToolbarAddControl';
import type { HomeToolbarProps } from './HomeToolbar.types';

export function HomeToolbar({ title, onAdd, onNotifications, hasUnread = false, addMenuItems }: HomeToolbarProps) {
  const plusTrigger = (
    <Button
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
  );

  const plusButton = (onPress: () => void) => (
    <Button
      onPress={onPress}
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
  );

  const addControl =
    addMenuItems && addMenuItems.length > 0 ? (
      <HomeToolbarAddControl items={addMenuItems}>{plusTrigger}</HomeToolbarAddControl>
    ) : onAdd ? (
      plusButton(onAdd)
    ) : null;

  return (
    <HStack alignment="center" spacing={12} modifiers={[frame({ maxWidth: Infinity }), padding({ horizontal: 16, top: 8, bottom: 4 })]}>
      <Text modifiers={[font({ size: 22, weight: 'bold' }), foregroundStyle(colors.ink), lineLimit(1), truncationMode('tail')]}>{title}</Text>
      <Spacer />
      {addControl}
      {onNotifications ? (
        <ZStack alignment="topTrailing">
          <Button onPress={onNotifications} modifiers={[buttonStyle('plain'), frame({ width: 44, height: 44 })]}>
            <Image systemName="bell" size={22} color={colors.navy} />
          </Button>
          {hasUnread ? <Circle modifiers={[frame({ width: 10, height: 10 }), foregroundStyle('#FFCC00')]} /> : null}
        </ZStack>
      ) : null}
    </HStack>
  );
}
