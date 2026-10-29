import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DosyaDetailsCard } from '@/components/dosya/DosyaDetailsCard';
import { dosyaDetailStyles as styles } from '@/components/dosya/dosyaDetailStyles';
import { DosyaDetailTopBar } from '@/components/dosya/DosyaDetailTopBar';
import { ExpenseListRow } from '@/components/expenses/ExpenseListRow';
import { TutanakImageViewer } from '@/components/tutanak/TutanakImageViewer';
import { TutanakListRow } from '@/components/tutanak/TutanakListRow';
import { colors, space } from '@/constants/theme';
import { useAuthorNames } from '@/hooks/useAuthorNames';
import { useDosyaDetailModel } from '@/hooks/useDosyaDetailModel';
import type { AttachmentMeta } from '@/models/expense';
import { toUserMessage } from '@/utils/errors';

/** Dosya detay — yalnızca RN (Expo Go çökmesini önler). */
export default function DosyaDetailScreen() {
  const insets = useSafeAreaInsets();
  const { dosyaId: rawDosyaId } = useLocalSearchParams<{ dosyaId: string }>();
  const dosyaId = typeof rawDosyaId === 'string' ? rawDosyaId : '';
  const model = useDosyaDetailModel(dosyaId);
  const tutanakReady = !model.tutanakQuery.isLoading && !model.tutanakQuery.isError;
  const refetchExpenses = model.query.refetch;
  const refetchTutanaklar = model.tutanakQuery.refetch;
  const [openImages, setOpenImages] = useState<AttachmentMeta[] | null>(null);
  const authorNames = useAuthorNames([...model.items.map((item) => item.userId), ...model.tutanaklar.map((item) => item.userId)]);

  useFocusEffect(
    useCallback(() => {
      void refetchExpenses();
      void refetchTutanaklar();
    }, [refetchExpenses, refetchTutanaklar]),
  );

  if (model.dosyaQuery.isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.navy} />
        <Text style={styles.hint}>Dosya yükleniyor…</Text>
      </View>
    );
  }

  if (model.dosyaQuery.isError || !model.dosya) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingHorizontal: space.lg }]}>
        <Text style={styles.error}>{model.errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => void model.dosyaQuery.refetch()} style={styles.retry}>
          <Text style={styles.retryLabel}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <DosyaDetailTopBar title={model.topTitle} addMenuItems={model.addMenuItems} onBack={() => model.router.back()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={model.refreshing} onRefresh={() => void model.onRefresh()} />}
      >
        <DosyaDetailsCard dosya={model.dosya} />
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Masraf</Text>
          {model.items.length > 0 ? <Text style={styles.sectionMeta}>{`${model.items.length} kayıt`}</Text> : null}
        </View>
        {model.query.isLoading ? (
          <View style={styles.inlineState}>
            <ActivityIndicator color={colors.navy} />
            <Text style={styles.hint}>Masraflar yükleniyor…</Text>
          </View>
        ) : null}
        {model.query.isError ? (
          <View style={styles.inlineState}>
            <Text style={styles.error}>{model.errorMessage}</Text>
            <Pressable accessibilityRole="button" onPress={() => void model.query.refetch()} style={styles.retry}>
              <Text style={styles.retryLabel}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : null}
        {model.listReady && model.items.length === 0 ? (
          <View style={styles.inlineState}>
            <Text style={styles.emptyTitle}>Henüz masraf yok</Text>
          </View>
        ) : null}
        {model.listReady ? (
          <View style={styles.list}>
            {model.items.map((item) => (
              <ExpenseListRow key={item.id} expense={item} authorName={authorNames[item.userId]} onPress={() => model.openExpense(item.id)} />
            ))}
          </View>
        ) : null}
        {model.listReady && model.query.hasNextPage ? (
          <Pressable
            accessibilityRole="button"
            disabled={model.query.isFetchingNextPage}
            onPress={() => void model.query.fetchNextPage()}
            style={styles.more}
          >
            <Text style={styles.moreLabel}>{model.query.isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla'}</Text>
          </Pressable>
        ) : null}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Tutanak</Text>
          {model.tutanaklar.length > 0 ? <Text style={styles.sectionMeta}>{`${model.tutanaklar.length} kayıt`}</Text> : null}
        </View>
        {model.tutanakQuery.isLoading ? (
          <View style={styles.inlineState}>
            <ActivityIndicator color={colors.navy} />
            <Text style={styles.hint}>Tutanaklar yükleniyor…</Text>
          </View>
        ) : null}
        {model.tutanakQuery.isError ? (
          <View style={styles.inlineState}>
            <Text style={styles.error}>{toUserMessage(model.tutanakQuery.error)}</Text>
            <Pressable accessibilityRole="button" onPress={() => void model.tutanakQuery.refetch()} style={styles.retry}>
              <Text style={styles.retryLabel}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : null}
        {tutanakReady && model.tutanaklar.length === 0 ? (
          <View style={styles.inlineState}>
            <Text style={styles.emptyTitle}>Henüz tutanak yok</Text>
          </View>
        ) : null}
        {tutanakReady && model.tutanaklar.length > 0 ? (
          <View style={styles.list}>
            {model.tutanaklar.map((item) => (
              <TutanakListRow
                key={item.id}
                tutanak={item}
                authorName={authorNames[item.userId]}
                onPress={() => {
                  const images = item.attachments.filter((attachment) => attachment.resourceType === 'image' && attachment.url);
                  if (images.length === 0) {
                    Alert.alert('Görsel yok', 'Bu tutanakta açılacak bir görsel yok.');
                    return;
                  }
                  setOpenImages(images);
                }}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
      {openImages ? <TutanakImageViewer images={openImages} onClose={() => setOpenImages(null)} /> : null}
    </View>
  );
}
