import { useCallback, useRef, useState, type ElementRef, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { AddMenuItem } from '@/components/common/AddMenuAnchor.types';
import { colors, radius, space, type as typeScale } from '@/constants/theme';

type AnchorLayout = { x: number; y: number; width: number; height: number };

/** RN modal menü — iOS, Android ve web. */
export function AddMenuAnchor({
  items,
  children,
}: {
  items: AddMenuItem[];
  children: (api: { onPress: () => void }) => ReactNode;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const anchorRef = useRef<ElementRef<typeof View>>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorLayout | null>(null);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    if (open) {
      close();
      return;
    }
    anchorRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  }, [close, open]);

  const menuTop = anchor ? anchor.y + anchor.height + space.xs : 0;
  const menuRight = anchor ? Math.max(space.lg, windowWidth - anchor.x - anchor.width) : space.lg;

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {children({ onPress: openMenu })}
      </View>
      {open ? (
        <Modal visible animationType="fade" transparent onRequestClose={close} statusBarTranslucent presentationStyle="overFullScreen">
          <View style={[styles.screen, { width: windowWidth, height: windowHeight }]}>
            <Pressable style={styles.dismissLayer} onPress={close} accessibilityRole="button" accessibilityLabel="Menüyü kapat" />
            {anchor ? (
              <View style={[styles.menu, { top: menuTop, right: menuRight }]} onStartShouldSetResponder={() => true}>
                {items.map((item, index) => (
                  <Pressable
                    key={item.label}
                    onPress={() => {
                      close();
                      item.onPress();
                    }}
                    style={({ pressed }) => [styles.menuItem, index > 0 && styles.menuItemBorder, pressed && styles.menuItemPressed]}
                  >
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  dismissLayer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.25)', zIndex: 0 },
  menu: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    minWidth: 168,
    overflow: 'hidden',
  },
  menuItem: { paddingVertical: space.md, paddingHorizontal: space.lg, backgroundColor: colors.surface },
  menuItemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  menuItemPressed: { backgroundColor: colors.fill },
  menuLabel: { color: colors.ink, fontSize: typeScale.body, fontWeight: '500' },
});
