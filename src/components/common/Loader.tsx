import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { colors, space, type as typeScale } from '@/constants/theme';

const DOT_COUNT = 3;
const STEP_MS = 180;
const PULSE_MS = 420;

function Dot({ index, color, size }: { index: number; color: string; size: number }) {
  const level = useSharedValue(0.25);

  useEffect(() => {
    level.value = withDelay(
      index * STEP_MS,
      withRepeat(withSequence(withTiming(1, { duration: PULSE_MS }), withTiming(0.25, { duration: PULSE_MS })), -1, false),
    );
  }, [index, level]);

  const style = useAnimatedStyle(() => ({
    opacity: level.value,
    transform: [{ scale: 0.65 + 0.35 * level.value }],
  }));

  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

/** Yükleme göstergesi: sırayla beliren üç nokta ve isteğe bağlı açıklama. Her ekranda aynı görünür. */
export function Loader({ label, color = colors.navy, size = 12 }: { label?: string; color?: string; size?: number }) {
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Yükleniyor'}>
      <View style={styles.dots}>
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <Dot key={index} index={index} color={color} size={size} />
        ))}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: space.md },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: colors.muted, fontSize: typeScale.label, fontWeight: '500' },
});
