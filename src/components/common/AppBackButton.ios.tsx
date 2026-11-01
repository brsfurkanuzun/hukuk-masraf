import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

/** iOS: SF Symbol "chevron.left". */
export function AppBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={onPress} hitSlop={12} style={styles.button}>
      <SymbolView name="chevron.left" size={22} weight="semibold" tintColor={colors.navy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
