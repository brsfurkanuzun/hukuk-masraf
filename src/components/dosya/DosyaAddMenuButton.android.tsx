import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AddMenuItem } from '@/components/common/AddMenuAnchor.types';
import { colors } from '@/constants/theme';

/** Android: Compose DropdownMenu (yerel açılır menü). */
export function DosyaAddMenuButton({ items }: { items: AddMenuItem[] }) {
  const actions = useMemo<MenuAction[]>(() => items.map((item) => ({ id: item.label, title: item.label })), [items]);

  return (
    <MenuView
      actions={actions}
      onPressAction={({ nativeEvent: { event } }) => {
        items.find((item) => item.label === event)?.onPress();
      }}
    >
      <View accessibilityRole="button" accessibilityLabel="Yeni kayıt ekle" style={styles.button}>
        <SymbolView name={{ android: 'add' }} size={20} tintColor={colors.white} />
      </View>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  button: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
});
