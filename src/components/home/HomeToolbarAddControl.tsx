import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { AddMenuAnchor } from '@/components/common/AddMenuAnchor';
import type { AddMenuItem } from '@/components/common/AddMenuAnchor.types';

export function HomeToolbarAddControl({ items, children }: { items: AddMenuItem[]; children: ReactNode }) {
  return (
    <AddMenuAnchor items={items}>
      {({ onPress }) => (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Yeni kayıt menüsü">
          {children}
        </Pressable>
      )}
    </AddMenuAnchor>
  );
}
