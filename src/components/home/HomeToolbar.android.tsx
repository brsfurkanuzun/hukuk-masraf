import { RNHostView, Row, Text } from '@expo/ui';
import { FilledIconButton } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, size, weight } from '@expo/ui/jetpack-compose/modifiers';
import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';

import { HomeToolbarAddControl } from './HomeToolbarAddControl';
import type { HomeToolbarProps } from './HomeToolbar.types';

export function HomeToolbar({ title, onAdd, onNotifications, hasUnread = false, addMenuItems }: HomeToolbarProps) {
  const plusTrigger = (
    <FilledIconButton colors={{ containerColor: colors.navy, contentColor: colors.white }} modifiers={[size(56, 56)]}>
      <Text textStyle={{ color: colors.white, fontSize: 32, fontWeight: '500' }}>+</Text>
    </FilledIconButton>
  );

  const plusButton = (onPress: () => void) => (
    <FilledIconButton onClick={onPress} colors={{ containerColor: colors.navy, contentColor: colors.white }} modifiers={[size(56, 56)]}>
      <Text textStyle={{ color: colors.white, fontSize: 32, fontWeight: '500' }}>+</Text>
    </FilledIconButton>
  );

  const addControl =
    addMenuItems && addMenuItems.length > 0 ? (
      <HomeToolbarAddControl items={addMenuItems}>{plusTrigger}</HomeToolbarAddControl>
    ) : onAdd ? (
      plusButton(onAdd)
    ) : null;

  return (
    <Row alignment="center" style={{ width: '100%' }} modifiers={[fillMaxWidth(), padding(16, 8, 16, 4)]}>
      <Text modifiers={[weight(1)]} numberOfLines={1} textStyle={{ color: colors.ink, fontSize: 22, fontWeight: '700' }}>
        {title}
      </Text>
      {addControl}
      {onNotifications ? (
        <RNHostView matchContents>
          <Pressable accessibilityRole="button" accessibilityLabel="Bildirimler" hitSlop={8} onPress={onNotifications} style={{ width: 32, height: 32 }}>
            <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} size={24} tintColor={colors.navy} />
            {hasUnread ? <View style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFCC00' }} /> : null}
          </Pressable>
        </RNHostView>
      ) : null}
    </Row>
  );
}
