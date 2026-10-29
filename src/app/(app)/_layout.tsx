import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: '600', color: colors.ink },
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Masraflar' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      <Stack.Screen name="expense/new" options={{ title: 'Yeni Masraf' }} />
      <Stack.Screen name="expense/[id]/index" options={{ title: 'Masraf Detayı' }} />
      <Stack.Screen name="expense/[id]/edit" options={{ title: 'Masrafı Düzenle' }} />
      <Stack.Screen name="preview" options={{ title: 'Belge' }} />
    </Stack>
  );
}
