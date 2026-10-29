import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/common/AppBackButton';
import { TutanakImageViewer } from '@/components/tutanak/TutanakImageViewer';
import { colors, space, type as typeScale } from '@/constants/theme';
import { useTutanakNotices } from '@/hooks/useTutanakNotices';
import type { AttachmentMeta } from '@/models/expense';
import { useAuth } from '@/providers/AuthProvider';
import { markNoticesRead, type TutanakNotice } from '@/services/tutanak/tutanakNoticeService';
import { getTutanak } from '@/services/tutanak/tutanakService';
import { logError, toUserMessage } from '@/utils/errors';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useTutanakNotices();
  const refetchNotices = query.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchNotices();
      if (!user) {
        return;
      }
      void markNoticesRead(user.uid)
        .then(() => queryClient.invalidateQueries({ queryKey: ['notice-read', user.uid] }))
        .catch((error: unknown) => logError('notice-read', error));
    }, [queryClient, refetchNotices, user]),
  );
  const [images, setImages] = useState<AttachmentMeta[] | null>(null);
  const notices = query.data ?? [];

  async function openNotice(notice: TutanakNotice) {
    if (notice.kind === 'dosya') {
      router.push(`/dosya/${notice.dosyaId}` as Href);
      return;
    }
    try {
      const tutanak = await getTutanak(notice.dosyaId, notice.id);
      const photos = tutanak?.attachments.filter((attachment) => attachment.resourceType === 'image' && attachment.url) ?? [];
      if (photos.length === 0) {
        Alert.alert('Görsel yok', 'Bu tutanakta açılacak bir görsel yok.');
        return;
      }
      setImages(photos);
    } catch (error) {
      Alert.alert('Açılamadı', toUserMessage(error));
    }
  }

  if (query.isLoading) {
    return (
      <NotificationsFrame>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.navy} />
        </View>
      </NotificationsFrame>
    );
  }

  if (query.isError) {
    return (
      <NotificationsFrame>
        <View style={styles.centered}>
          <Text style={styles.empty}>{toUserMessage(query.error)}</Text>
          <Pressable accessibilityRole="button" onPress={() => void query.refetch()}>
            <Text style={styles.retry}>Tekrar dene</Text>
          </Pressable>
        </View>
      </NotificationsFrame>
    );
  }

  return (
    <NotificationsFrame>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notices.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={<Text style={styles.empty}>Bildirim yok</Text>}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => void openNotice(item)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <Text style={styles.title}>{noticeText(item)}</Text>
          </Pressable>
        )}
      />
      {images ? <TutanakImageViewer images={images} onClose={() => setImages(null)} /> : null}
    </NotificationsFrame>
  );
}

function NotificationsFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <AppBackButton onPress={() => router.back()} />
        <Text style={styles.topTitle} numberOfLines={1}>
          Bildirimler
        </Text>
        <View style={styles.topSlot} />
      </View>
      {children}
    </View>
  );
}

function noticeText(notice: TutanakNotice): string {
  if (notice.kind === 'dosya') {
    const debtor = notice.debtorName.trim();
    return debtor ? `Kullanıcınıza dosya tanımlanmıştır · ${debtor}` : 'Kullanıcınıza dosya tanımlanmıştır';
  }
  if (!notice.debtorName.trim()) {
    return `${notice.actorName} bir dosyaya tutanak ekledi`;
  }
  return `${notice.actorName} ${notice.debtorName.trim()} dosyasına tutanak ekledi`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    minHeight: 44,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontSize: typeScale.section,
    fontWeight: '600',
  },
  topSlot: { width: 44 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.lg, backgroundColor: colors.background },
  emptyList: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.muted, fontSize: typeScale.body, textAlign: 'center' },
  retry: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
  row: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  rowPressed: { backgroundColor: colors.fill },
  title: { color: colors.ink, fontSize: typeScale.body },
});
