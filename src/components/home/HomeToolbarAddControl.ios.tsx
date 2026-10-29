import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import { useMemo, type ReactNode } from 'react';

import type { AddMenuItem } from '@/components/common/AddMenuAnchor.types';

export function HomeToolbarAddControl({ items, children }: { items: AddMenuItem[]; children: ReactNode }) {
  const actions = useMemo<MenuAction[]>(
    () => items.map((item) => ({ id: item.label, title: item.label })),
    [items],
  );

  return (
    <MenuView
      actions={actions}
      onPressAction={({ nativeEvent: { event } }) => {
        items.find((item) => item.label === event)?.onPress();
      }}
    >
      {children}
    </MenuView>
  );
}
