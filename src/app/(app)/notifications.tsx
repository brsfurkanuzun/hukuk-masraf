import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { Loader } from '@/components/common/Loader';
import { TutanakAttachmentsViewer } from '@/components/tutanak/TutanakAttachmentsViewer';
import { colors, radius, space, type as typeScale } from '@/constants/theme';
import { useNoticeReadState, useTutanakNotices } from '@/hooks/useTutanakNotices';
import type { AttachmentMeta } from '@/models/expense';
import type { TutanakNotice } from '@/services/tutanak/tutanakNoticeService';
import { getTutanak } from '@/services/tutanak/tutanakService';
import { toUserMessage } from '@/utils/errors';

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useTutanakNotices();
  const refetchNotices = query.refetch;
  const readState = useNoticeReadState();
  const refetchRead = readState.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchNotices();
      refetchRead();
    }, [refetchNotices, refetchRead]),
  );
  const [images, setImages] = useState<AttachmentMeta[] | null>(null);
  const sections = useMemo(() => groupByDay(query.data ?? []), [query.data]);

  async function openNotice(notice: TutanakNotice) {
    // Bildirim, dokunulunca okunmuş sayılır.
    readState.markRead(notice);
    if (notice.kind === 'dosya') {
      router.push(`/dosya/${notice.dosyaId}` as Href);
      return;
    }
    try {
      const tutanak = await getTutanak(notice.dosyaId, notice.id);
      const files = tutanak?.attachments.filter((attachment) => attachment.url) ?? [];
      if (files.length === 0) {
        Alert.alert('Ek yok', 'Bu tutanakta açılacak bir ek yok.');
        return;
      }
      setImages(files);
    } catch (error) {
      Alert.alert('Açılamadı', toUserMessage(error));
    }
  }

  if (query.isLoading) {
    return (
      <NotificationsFrame>
        <View style={styles.centered}>
          <Loader label="Bildirimler yükleniyor" />
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
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={sections.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <BellGlyph color={colors.faint} />
            </View>
            <Text style={styles.emptyTitle}>Bildirim yok</Text>
            <Text style={styles.emptyHint}>Yeni tutanak ve dosya atamaları burada görünür.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item, index, section }) => {
          const unread = readState.isUnread(item);
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => void openNotice(item)}
              style={({ pressed }) => [
                styles.card,
                first && styles.cardFirst,
                last && styles.cardLast,
                !last && styles.cardDivider,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.iconCircle, item.kind === 'dosya' ? styles.iconDosya : styles.iconTutanak]}>
                {item.kind === 'dosya' ? <FolderGlyph color={colors.navy} /> : <PageGlyph color={colors.accent} />}
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>
                    {item.kind === 'dosya' ? 'Dosya atandı' : 'Yeni tutanak'}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>
                <Text style={styles.detail} numberOfLines={2}>
                  {noticeText(item)}
                </Text>
              </View>
              {unread ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          );
        }}
      />
      {images ? <TutanakAttachmentsViewer attachments={images} onClose={() => setImages(null)} /> : null}
    </NotificationsFrame>
  );
}

function NotificationsFrame({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

function noticeText(notice: TutanakNotice): string {
  const debtor = notice.debtorName.trim();
  if (notice.kind === 'dosya') {
    return debtor ? `${debtor} dosyası size tanımlandı` : 'Size bir dosya tanımlandı';
  }
  const actor = notice.actorName.trim() || 'Bir kullanıcı';
  return debtor ? `${actor}, ${debtor} dosyasına tutanak ekledi` : `${actor} bir dosyaya tutanak ekledi`;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayTitle(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Daha önce';
  }
  const now = new Date();
  if (dayKey(date) === dayKey(now)) {
    return 'Bugün';
  }
  if (dayKey(date) === dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) {
    return 'Dün';
  }
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(notices: TutanakNotice[]): { title: string; data: TutanakNotice[] }[] {
  const sections: { key: string; title: string; data: TutanakNotice[] }[] = [];
  for (const notice of notices) {
    const date = new Date(notice.createdAt);
    const key = Number.isNaN(date.getTime()) ? '' : dayKey(date);
    const last = sections[sections.length - 1];
    if (last && last.key === key) {
      last.data.push(notice);
    } else {
      sections.push({ key, title: dayTitle(notice.createdAt), data: [notice] });
    }
  }
  return sections;
}

function PageGlyph({ color }: { color: string }) {
  return <SymbolView name={{ ios: 'doc.text.fill', android: 'description' }} size={22} tintColor={color} />;
}

function FolderGlyph({ color }: { color: string }) {
  return <SymbolView name={{ ios: 'folder.fill', android: 'folder' }} size={22} tintColor={color} />;
}

function BellGlyph({ color }: { color: string }) {
  return <SymbolView name={{ ios: 'bell.fill', android: 'notifications' }} size={30} tintColor={color} />;
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
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  listContent: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  emptyBox: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  emptyTitle: { color: colors.ink, fontSize: typeScale.section, fontWeight: '600' },
  emptyHint: { color: colors.muted, fontSize: typeScale.label, textAlign: 'center' },
  empty: { color: colors.muted, fontSize: typeScale.body, textAlign: 'center' },
  retry: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
  sectionTitle: {
    color: colors.muted,
    fontSize: typeScale.label,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: space.xl,
    marginBottom: space.sm,
    marginLeft: space.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
  },
  cardFirst: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  cardLast: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  cardDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  cardPressed: { backgroundColor: colors.fill },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconDosya: { backgroundColor: '#E3EDF6' },
  iconTutanak: { backgroundColor: colors.accentSoft },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  title: { flexShrink: 1, color: colors.ink, fontSize: typeScale.body, fontWeight: '500' },
  titleUnread: { fontWeight: '700' },
  time: { color: colors.faint, fontSize: typeScale.small },
  detail: { color: colors.muted, fontSize: typeScale.label, lineHeight: 18 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.navy },
});
