import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, type as typeScale } from '@/constants/theme';

/** Sürüm yazısının kapladığı alan; liste bu kadar yer bırakır. */
export const APP_VERSION_HEIGHT = 28;

/** Uygulama sürümü: app.json'daki version (ve varsa yapı numarası). */
export function appVersionLabel(): string {
  const config = Constants.expoConfig;
  const build = Constants.platform?.ios ? config?.ios?.buildNumber : config?.android?.versionCode;
  const version = config?.version ?? '—';
  return build ? `Sürüm ${version} (${build})` : `Sürüm ${version}`;
}

/** Ekranın en altına yapışık sürüm yazısı (güvenli alanın üstünde). */
export function AppVersionBar() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.bar, { bottom: insets.bottom }]}>
      <Text style={styles.label}>{appVersionLabel()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, height: APP_VERSION_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.faint, fontSize: typeScale.small },
});
