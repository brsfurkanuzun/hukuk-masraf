import { Pressable, StyleSheet, Text } from 'react-native';

import { AddMenuAnchor } from '@/components/common/AddMenuAnchor';
import type { AddMenuItem } from '@/components/common/AddMenuAnchor.types';
import { colors } from '@/constants/theme';

export function DosyaAddMenuButton({ items }: { items: AddMenuItem[] }) {
  return (
    <AddMenuAnchor items={items}>
      {({ onPress }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yeni kayıt ekle"
          onPress={onPress}
          hitSlop={8}
          style={styles.button}
        >
          <Text style={styles.plus}>+</Text>
        </Pressable>
      )}
    </AddMenuAnchor>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
});
