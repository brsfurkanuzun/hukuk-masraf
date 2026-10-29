import { Stack, useRouter } from 'expo-router';

import { AppBackButton } from '@/components/common/AppBackButton';
import { colors } from '@/constants/theme';

export default function AppLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: '600', color: colors.ink },
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackVisible: false,
        headerLeft: ({ canGoBack }) => (canGoBack ? <AppBackButton onPress={() => router.back()} /> : null),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Dosyalarım' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false, title: 'Bildirimler' }} />
      <Stack.Screen name="dosya/[dosyaId]/index" options={{ headerShown: false, title: 'Dosya' }} />
      <Stack.Screen name="dosya/[dosyaId]/expense/new" options={{ headerShown: false, title: 'Yeni Masraf' }} />
      <Stack.Screen name="dosya/[dosyaId]/expense/[id]/index" options={{ title: 'Masraf Detayı' }} />
      <Stack.Screen name="dosya/[dosyaId]/expense/[id]/edit" options={{ title: 'Masrafı Düzenle' }} />
      <Stack.Screen name="dosya/[dosyaId]/tutanak/new" options={{ headerShown: false, title: 'Tutanak gir' }} />
      <Stack.Screen name="expense/new" options={{ title: 'Yeni Masraf' }} />
      <Stack.Screen name="expense/[id]/index" options={{ title: 'Masraf Detayı' }} />
      <Stack.Screen name="expense/[id]/edit" options={{ title: 'Masrafı Düzenle' }} />
      <Stack.Screen name="preview" options={{ title: 'Belge' }} />
    </Stack>
  );
}
