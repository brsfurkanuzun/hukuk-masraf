import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

/** Android: Material Symbol "arrow_back". */
export function AppBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Geri"
      onPress={onPress}
      hitSlop={12}
      android_ripple={{ color: colors.fill, borderless: true, radius: 24 }}
      style={styles.button}
    >
      <SymbolView name={{ android: 'arrow_back' }} size={24} tintColor={colors.navy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
