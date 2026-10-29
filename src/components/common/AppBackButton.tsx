import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

export function AppBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={onPress} hitSlop={12} style={styles.button}>
      <Text style={styles.label}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.navy,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 34,
  },
});
