import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { colors, type as typeScale } from '@/constants/theme';

/** Aynı anda tek satır açık kalır; ekranın başka yerine dokunulunca kapatılır. */
let openRow: SwipeableMethods | null = null;

export function closeOpenSwipeRow(): void {
  openRow?.close();
  openRow = null;
}

/**
 * Satırı sola çekince sağda kırmızı "Sil" düğmesi açar. Düğmeye basınca onDelete çağrılır
 * (onay sormak çağıranın işidir); satır kendiliğinden kapanır.
 */
export function SwipeDeleteRow({ onDelete, enabled = true, children }: { onDelete: () => void; enabled?: boolean; children: ReactNode }) {
  const ref = useRef<SwipeableMethods>(null);

  const action = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sil"
      onPress={() => {
        ref.current?.close();
        onDelete();
      }}
      style={styles.action}
    >
      <Text style={styles.actionLabel}>Sil</Text>
    </Pressable>
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <GestureHandlerRootView>
      <ReanimatedSwipeable
        ref={ref}
        friction={2}
        overshootRight={false}
        renderRightActions={action}
        onSwipeableOpen={() => {
          if (openRow && openRow !== ref.current) {
            openRow.close();
          }
          openRow = ref.current;
        }}
        onSwipeableClose={() => {
          if (openRow === ref.current) {
            openRow = null;
          }
        }}
      >
        {/* Opak zemin: kırmızı alan satırın arkasından görünmesin, yalnızca çekilince açılsın. */}
        <View style={styles.surface}>{children}</View>
      </ReanimatedSwipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  surface: { backgroundColor: colors.surface },
  action: { width: 88, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger },
  actionLabel: { color: colors.white, fontSize: typeScale.body, fontWeight: '600' },
});
