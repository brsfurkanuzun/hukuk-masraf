import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text as BarText, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { TutanakAttachmentsViewer } from '@/components/tutanak/TutanakAttachmentsViewer';
import { ExpenseItemsList } from '@/components/expenses/ExpenseItemsList';
import { ExpenseStatusBadge } from '@/components/expenses/ExpenseStatusBadge';
import { ExpenseSummaryCard } from '@/components/expenses/ExpenseSummaryCard';
import { ScreenHost } from '@/components/native/ScreenHost';
import { expenseTypeLabel } from '@/constants/expenseTypes';
import { useExpenseTypes } from '@/hooks/useExpenseTypes';
import { colors, type as typeScale } from '@/constants/theme';
import { useExpense } from '@/hooks/useExpense';
import type { AttachmentMeta } from '@/models/expense';
import { useAuth } from '@/providers/AuthProvider';
import { queryClient } from '@/providers/queryClient';
import { cacheDeletedExpense } from '@/services/expenses/cacheUpdates';
import { deleteExpense } from '@/services/expenses/expenseService';
import { displayTotalKurus } from '@/services/expenses/mapExpense';
import { formatTrDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';
import { formatKurus } from '@/utils/money';

export default function DosyaExpenseDetailScreen() {
  const { dosyaId: rawDosyaId, id } = useLocalSearchParams<{ dosyaId: string; id: string }>();
  const dosyaId = typeof rawDosyaId === 'string' ? rawDosyaId : '';
  const expenseId = typeof id === 'string' ? id : '';
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { options: expenseTypes } = useExpenseTypes();
  const query = useExpense(dosyaId, expenseId);
  const expense = query.data;
  const [viewer, setViewer] = useState<{ items: AttachmentMeta[]; id: string } | null>(null);
  // Düzenleme ve silme yalnızca masrafı giren kullanıcıya açık; teslim edilen masraf kilitlenir.
  const canEdit = Boolean(expense && user && expense.userId === user.uid && expense.deliveryStatus !== 'delivered');
  const editRef = useRef<() => void>(() => {});
  editRef.current = () => {
    if (dosyaId && expenseId) {
      router.push(`/dosya/${dosyaId}/expense/${expenseId}/edit` as Href);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [
        {
          type: 'button',
          label: 'Düzenle',
          variant: 'plain',
          tintColor: colors.navy,
          disabled: !expenseId || !canEdit,
          onPress: () => editRef.current(),
        },
      ],
      headerRight: () => (
        <Pressable accessibilityRole="button" disabled={!expenseId || !canEdit} onPress={() => editRef.current()} hitSlop={8} style={styles.edit}>
          <BarText style={[styles.editLabel, !canEdit && styles.editDisabled]}>Düzenle</BarText>
        </Pressable>
      ),
    });
  }, [navigation, expenseId, canEdit]);

  function confirmDelete() {
    if (!expense || !user) {
      return;
    }
    Alert.alert('Masraf silinsin mi?', '', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteExpense(dosyaId, expense.id);
              cacheDeletedExpense(queryClient, user.uid, dosyaId, expense.id);
              router.back();
            } catch (error) {
              Alert.alert('Silinemedi', toUserMessage(error));
            }
          })();
        },
      },
    ]);
  }

  if (query.isLoading) {
    return (
      <ScreenHost>
        <LoadingState label="Kayıt yükleniyor" />
      </ScreenHost>
    );
  }
  if (query.isError || !expense) {
    return (
      <ScreenHost>
        <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />
      </ScreenHost>
    );
  }

  return (
    <>
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <ExpenseStatusBadge status={expense.deliveryStatus} />
      </View>
      <ExpenseSummaryCard
        summary={{
          debtorName: expense.debtorName,
          fileCaseNumber: expense.fileCaseNumber,
          clientName: expense.clientName,
          date: formatTrDate(expense.expenseDate),
          total: formatKurus(displayTotalKurus(expense)),
          itemCount: expense.expenseItems.length,
          enforcementOffice: expense.enforcementOffice,
          instructionNumber: expense.instructionNumber,
          note: expense.note,
        }}
      />
      <ExpenseItemsList
        items={expense.expenseItems.map((item) => ({
          id: item.id,
          typeLabel: expenseTypeLabel(item.type, item.customType, expenseTypes),
          amount: formatKurus(item.amountKurus),
          note: item.note?.trim() ?? '',
          attachments: item.attachments,
        }))}
        total={formatKurus(displayTotalKurus(expense))}
        onOpenAttachment={(attachment) => {
          const owner = expense.expenseItems.find((item) => item.attachments.some((candidate) => candidate.id === attachment.id));
          setViewer({ items: owner?.attachments ?? [attachment], id: attachment.id });
        }}
      />
      {canEdit ? (
        <Pressable accessibilityRole="button" onPress={confirmDelete} style={({ pressed }) => [styles.delete, pressed && styles.deletePressed]}>
          <BarText style={styles.deleteLabel}>Masrafı sil</BarText>
        </Pressable>
      ) : null}
    </ScrollView>
    {viewer ? <TutanakAttachmentsViewer attachments={viewer.items} directOpenId={viewer.id} onClose={() => setViewer(null)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: 4, paddingBottom: 40 },
  statusRow: { paddingHorizontal: 16, paddingBottom: 8 },
  delete: { marginHorizontal: 16, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft },
  deletePressed: { opacity: 0.7 },
  deleteLabel: { color: colors.danger, fontSize: typeScale.body, fontWeight: '600' },
  edit: { paddingHorizontal: 4 },
  editLabel: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
  editDisabled: { color: colors.disabled },
});
