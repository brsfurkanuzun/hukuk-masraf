import { Button, Text } from '@expo/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import { colors } from '@/constants/theme';

import { HomeToolbarAddControl } from './HomeToolbarAddControl';
import type { HomeToolbarProps } from './HomeToolbar.types';

export function HomeToolbar({ title, onAdd, onNotifications, hasUnread = false, addMenuItems }: HomeToolbarProps) {
  const addControl =
    addMenuItems && addMenuItems.length > 0 ? (
      <HomeToolbarAddControl items={addMenuItems}>
        <Button variant="text" label="+" />
      </HomeToolbarAddControl>
    ) : onAdd ? (
      <Button variant="text" label="+" onPress={onAdd} />
    ) : null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 12 }}>
      <Text numberOfLines={1} textStyle={{ color: colors.ink, fontSize: 22, fontWeight: '700' }}>
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      {addControl}
      {onNotifications ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Bildirimler" hitSlop={8} onPress={onNotifications} style={{ width: 32, height: 32 }}>
          <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} size={24} tintColor={colors.navy} />
          {hasUnread ? <View style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFCC00' }} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}
