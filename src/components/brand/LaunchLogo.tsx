import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const logo = require('../../../assets/images/logo.jpg');

export function LaunchLogo({ onDone }: { onDone: () => void }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const shift = useSharedValue(18);
  const veil = useSharedValue(1);

  useEffect(() => {
    const settle = { duration: 900, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(60, withTiming(1, settle));
    scale.value = withDelay(60, withTiming(1, settle));
    shift.value = withDelay(60, withTiming(0, settle));
    veil.value = withDelay(
      1500,
      withTiming(0, { duration: 420, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onDone)();
        }
      }),
    );
    const fallback = setTimeout(onDone, 2200);
    return () => clearTimeout(fallback);
  }, [onDone, opacity, scale, shift, veil]);

  const mark = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: shift.value }, { scale: scale.value }],
  }));
  const cover = useAnimatedStyle(() => ({ opacity: veil.value }));

  return (
    <Animated.View style={[styles.cover, cover]} pointerEvents="auto">
      <Animated.View style={mark}>
        <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Tohumcu Partners" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 20,
  },
  logo: { width: 300, height: 300 },
});
