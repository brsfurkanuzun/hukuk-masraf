import { Column, FieldGroup } from '@expo/ui';
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text as BarText, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { DetailRowsCard } from '@/components/common/DetailRowsCard';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { DeleteExpenseButton } from '@/components/expenses/DeleteExpenseButton';
import { ExpenseDetailLayout } from '@/components/expenses/ExpenseDetailLayout';
import { ExpenseLineHeader, ExpenseLineReadRow, ExpenseLineTotal } from '@/components/forms/ItemLinesTable';
import { ScreenHost } from '@/components/native/ScreenHost';
import { expenseTypeLabel } from '@/constants/expenseTypes';
import { useExpenseTypes } from '@/hooks/useExpenseTypes';
import { colors, type as typeScale } from '@/constants/theme';
import { useExpense } from '@/hooks/useExpense';
import type { ExpenseItem } from '@/models/expense';
import { useAuth } from '@/providers/AuthProvider';
import { queryClient } from '@/providers/queryClient';
import { cacheDeletedExpense } from '@/services/expenses/cacheUpdates';
import { deleteExpense } from '@/services/expenses/expenseService';
import { displayTotalKurus } from '@/services/expenses/mapExpense';
import { formatTrDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';
import { formatAmountInput, formatKurus } from '@/utils/money';
import { formatFileSize } from '@/utils/text';

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
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
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
          disabled: !expenseId,
          onPress: () => editRef.current(),
        },
      ],
      headerRight: () => (
        <Pressable accessibilityRole="button" disabled={!expenseId} onPress={() => editRef.current()} hitSlop={8} style={styles.edit}>
          <BarText style={styles.editLabel}>Düzenle</BarText>
        </Pressable>
      ),
    });
  }, [navigation, expenseId]);

  function openDocuments(item: ExpenseItem) {
    const only = item.attachments.length === 1 ? item.attachments[0] : null;
    if (only) {
      router.push({ pathname: '/preview', params: { dosyaId, expenseId, attachmentId: only.id } });
      return;
    }
    setOpenDocsId((current) => (current === item.id ? null : item.id));
  }

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
    <View style={styles.page}>
      <DetailRowsCard
        heading="Masraf bilgileri"
        rows={[
          { label: 'Tarih', value: formatTrDate(expense.expenseDate) },
          { label: 'Esas no', value: expense.fileCaseNumber },
          { label: 'Müvekkil', value: expense.clientName },
          { label: 'İcra dairesi', value: expense.enforcementOffice },
          { label: 'Borçlu', value: expense.debtorName },
          { label: 'Talimat no', value: expense.instructionNumber },
          { label: 'Not', value: expense.note },
        ]}
      />
      <ScreenHost fill>
      <ExpenseDetailLayout footer={<DeleteExpenseButton onPress={confirmDelete} />}>
        <FieldGroup.Section title="Masraflar">
          <ExpenseLineHeader />
          {expense.expenseItems.map((item) => (
            <Column key={item.id} spacing={8}>
              <ExpenseLineReadRow
                cells={[
                  expenseTypeLabel(item.type, item.customType, expenseTypes),
                  formatAmountInput(item.amountKurus),
                  item.note?.trim() || '-',
                  item.attachments.length > 0 ? String(item.attachments.length) : '-',
                ]}
                onDocs={item.attachments.length > 0 ? () => openDocuments(item) : undefined}
              />
              {openDocsId === item.id
                ? item.attachments.map((attachment) => (
                    <Button
                      key={attachment.id}
                      variant="ghost"
                      label={`${attachment.fileName} · ${attachment.mimeType === 'application/pdf' ? 'PDF' : 'Fotoğraf'} · ${formatFileSize(attachment.fileSize)}`}
                      onPress={() => router.push({ pathname: '/preview', params: { dosyaId, expenseId: expense.id, attachmentId: attachment.id } })}
                    />
                  ))
                : null}
            </Column>
          ))}
          <ExpenseLineTotal amount={formatKurus(displayTotalKurus(expense))} />
        </FieldGroup.Section>
      </ExpenseDetailLayout>
      </ScreenHost>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  edit: { paddingHorizontal: 4 },
  editLabel: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
});
