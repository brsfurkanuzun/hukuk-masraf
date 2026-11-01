import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Loader } from '@/components/common/Loader';
import { closeOpenSwipeRow, SwipeDeleteRow } from '@/components/common/SwipeDeleteRow';
import { DosyaDetailsCard, type DosyaStat } from '@/components/dosya/DosyaDetailsCard';
import { dosyaDetailStyles as styles } from '@/components/dosya/dosyaDetailStyles';
import { DosyaAddMenuButton } from '@/components/dosya/DosyaAddMenuButton';
import { ExpenseListRow } from '@/components/expenses/ExpenseListRow';
import { TutanakAttachmentsViewer } from '@/components/tutanak/TutanakAttachmentsViewer';
import { TutanakListRow } from '@/components/tutanak/TutanakListRow';
import { colors, space } from '@/constants/theme';
import { useAuthorNames } from '@/hooks/useAuthorNames';
import { useDosyaDetailModel } from '@/hooks/useDosyaDetailModel';
import type { AttachmentMeta } from '@/models/expense';
import { useAuth } from '@/providers/AuthProvider';
import { queryClient } from '@/providers/queryClient';
import { cacheDeletedExpense } from '@/services/expenses/cacheUpdates';
import { deleteExpense } from '@/services/expenses/expenseService';
import { displayTotalKurus } from '@/services/expenses/mapExpense';
import { deleteTutanak } from '@/services/tutanak/tutanakService';
import { toUserMessage } from '@/utils/errors';
import { formatKurus, sumKurus } from '@/utils/money';

/** Dosya detay — yalnızca RN (Expo Go çökmesini önler). */
export default function DosyaDetailScreen() {
  const navigation = useNavigation();
  const { dosyaId: rawDosyaId } = useLocalSearchParams<{ dosyaId: string }>();
  const dosyaId = typeof rawDosyaId === 'string' ? rawDosyaId : '';
  const model = useDosyaDetailModel(dosyaId);
  const tutanakReady = !model.tutanakQuery.isLoading && !model.tutanakQuery.isError;
  const refetchExpenses = model.query.refetch;
  const refetchTutanaklar = model.tutanakQuery.refetch;
  const [openImages, setOpenImages] = useState<AttachmentMeta[] | null>(null);
  const { user } = useAuth();

  // "+" menüsü, diğer ekranlardaki gibi yığın başlığında durur.
  const menuItems = useRef(model.addMenuItems);
  menuItems.current = model.addMenuItems;
  useEffect(() => {
    navigation.setOptions({
      // iOS: sistemin kendi başlık düğmesi (menülü). Özel görünümü sarmaladığı için çift çerçeve oluşmaz.
      unstable_headerRightItems: () => [
        {
          type: 'menu',
          label: 'Ekle',
          icon: { type: 'sfSymbol', name: 'plus' },
          tintColor: colors.navy,
          menu: {
            items: menuItems.current.map((item) => ({ type: 'action' as const, label: item.label, onPress: item.onPress })),
          },
        },
      ],
      // Android: kendi menü düğmemiz.
      headerRight: () => <DosyaAddMenuButton items={menuItems.current} />,
    });
  }, [navigation]);

  function confirmDeleteExpense(expenseId: string) {
    Alert.alert('Masraf silinsin mi?', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteExpense(dosyaId, expenseId);
              if (user) {
                cacheDeletedExpense(queryClient, user.uid, dosyaId, expenseId);
              }
              void refetchExpenses();
            } catch (error) {
              Alert.alert('Silinemedi', toUserMessage(error));
            }
          })();
        },
      },
    ]);
  }

  function confirmDeleteTutanak(tutanakId: string) {
    Alert.alert('Tutanak silinsin mi?', undefined, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteTutanak(dosyaId, tutanakId);
              void refetchTutanaklar();
            } catch (error) {
              Alert.alert('Silinemedi', toUserMessage(error));
            }
          })();
        },
      },
    ]);
  }

  const authorNames = useAuthorNames([...model.items.map((item) => item.userId), ...model.tutanaklar.map((item) => item.userId)]);

  // Toplam tutar yalnızca tüm masraflar yüklendiyse doğru olur.
  const stats: DosyaStat[] = [
    { label: 'Masraf', value: `${model.items.length}${model.query.hasNextPage ? '+' : ''}`, weight: 0.8 },
    ...(model.listReady && !model.query.hasNextPage
      ? [{ label: 'Toplam masraf', value: formatKurus(sumKurus(model.items.map((item) => displayTotalKurus(item)))), weight: 2 }]
      : []),
    { label: 'Tutanak', value: String(model.tutanaklar.length), weight: 0.9 },
  ];

  useFocusEffect(
    useCallback(() => {
      void refetchExpenses();
      void refetchTutanaklar();
    }, [refetchExpenses, refetchTutanaklar]),
  );

  if (model.dosyaQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <Loader label="Dosya yükleniyor" />
      </View>
    );
  }

  if (model.dosyaQuery.isError || !model.dosya) {
    return (
      <View style={[styles.centered, { paddingHorizontal: space.lg }]}>
        <Text style={styles.error}>{model.errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => void model.dosyaQuery.refetch()} style={styles.retry}>
          <Text style={styles.retryLabel}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={styles.screen}
      // Açık satırın dışına dokunulunca kapat. Gecikme, "Sil" düğmesine basışın tamamlanmasına izin verir.
      onTouchStartCapture={() => {
        setTimeout(closeOpenSwipeRow, 250);
      }}
    >
      <ScrollView
        style={styles.scroll}
        onScrollBeginDrag={closeOpenSwipeRow}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={model.refreshing} onRefresh={() => void model.onRefresh()} />}
      >
        <DosyaDetailsCard dosya={model.dosya} stats={stats} />
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Masraf</Text>
          {model.items.length > 0 ? (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionMeta}>{`${model.items.length}${model.query.hasNextPage ? '+' : ''} kayıt`}</Text>
            </View>
          ) : null}
        </View>
        {model.query.isLoading ? (
          <View style={styles.inlineState}>
            <Loader label="Masraflar yükleniyor" />
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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz masraf yok</Text>
            <Text style={styles.emptyHint}>Sağ üstteki + ile masraf ekleyebilirsiniz.</Text>
          </View>
        ) : null}
        {model.listReady ? (
          <View style={styles.list}>
            {model.items.map((item) => (
              <SwipeDeleteRow key={item.id} enabled={item.userId === user?.uid} onDelete={() => confirmDeleteExpense(item.id)}>
                <ExpenseListRow expense={item} authorName={authorNames[item.userId]} onPress={() => model.openExpense(item.id)} />
              </SwipeDeleteRow>
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
          {model.tutanaklar.length > 0 ? (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionMeta}>{`${model.tutanaklar.length} kayıt`}</Text>
            </View>
          ) : null}
        </View>
        {model.tutanakQuery.isLoading ? (
          <View style={styles.inlineState}>
            <Loader label="Tutanaklar yükleniyor" />
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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz tutanak yok</Text>
            <Text style={styles.emptyHint}>Sağ üstteki + ile tutanak ekleyebilirsiniz.</Text>
          </View>
        ) : null}
        {tutanakReady && model.tutanaklar.length > 0 ? (
          <View style={styles.list}>
            {model.tutanaklar.map((item) => (
              <SwipeDeleteRow key={item.id} enabled={item.userId === user?.uid} onDelete={() => confirmDeleteTutanak(item.id)}>
                <TutanakListRow
                  tutanak={item}
                  authorName={authorNames[item.userId]}
                  onPress={() => {
                    const files = item.attachments.filter((attachment) => attachment.url);
                    if (files.length === 0) {
                      Alert.alert('Ek yok', 'Bu tutanakta açılacak bir ek yok.');
                      return;
                    }
                    setOpenImages(files);
                  }}
                />
              </SwipeDeleteRow>
            ))}
          </View>
        ) : null}
      </ScrollView>
      {openImages ? <TutanakAttachmentsViewer attachments={openImages} onClose={() => setOpenImages(null)} /> : null}
    </View>
  );
}
