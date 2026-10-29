import { Column, FieldGroup, Row, Text } from '@expo/ui';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, Text as BarText, Pressable, StyleSheet } from 'react-native';

import { Button } from '@/components/common/Button';
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
import { deleteUnreferencedAsset } from '@/services/cloudinary/flushOrphans';
import { cacheDeletedExpense } from '@/services/expenses/cacheUpdates';
import { deleteExpense } from '@/services/expenses/expenseService';
import { displayTotalKurus } from '@/services/expenses/mapExpense';
import { formatTrDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';
import { formatAmountInput, formatKurus } from '@/utils/money';
import { formatFileSize } from '@/utils/text';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = typeof id === 'string' ? id : '';
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { options: expenseTypes } = useExpenseTypes();
  const query = useExpense(expenseId);
  const expense = query.data;
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
  const editRef = useRef<() => void>(() => {});
  editRef.current = () => {
    if (expenseId) {
      router.push(`/expense/${expenseId}/edit`);
    }
  };

  useLayoutEffect(() => {
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
      router.push({ pathname: '/preview', params: { expenseId, attachmentId: only.id } });
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
              await deleteExpense(expense.id);
              cacheDeletedExpense(queryClient, user.uid, expense.id);
              await Promise.all(
                expense.expenseItems.flatMap((item) =>
                  item.attachments.map((attachment) =>
                    deleteUnreferencedAsset({
                      uid: user.uid,
                      expenseId: expense.id,
                      publicId: attachment.cloudinaryPublicId,
                      resourceType: attachment.resourceType,
                    }),
                  ),
                ),
              );
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
    <ScreenHost fill>
      <ExpenseDetailLayout footer={<DeleteExpenseButton onPress={confirmDelete} />}>
        <FieldGroup.Section title={formatTrDate(expense.expenseDate)}>
          <Info label="Müvekkil" value={expense.clientName} />
          <Info label="Dosya Borçlusu" value={expense.debtorName || '—'} />
          <Info label="İcra Dairesi" value={expense.enforcementOffice || '—'} />
          <Info label="Esas No" value={expense.fileCaseNumber} />
          <Info label="Talimat No" value={expense.instructionNumber || '—'} />
          <Info label="Not" value={expense.note || '—'} />
        </FieldGroup.Section>
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
                      onPress={() => router.push({ pathname: '/preview', params: { expenseId: expense.id, attachmentId: attachment.id } })}
                    />
                  ))
                : null}
            </Column>
          ))}
          <ExpenseLineTotal amount={formatKurus(displayTotalKurus(expense))} />
        </FieldGroup.Section>
      </ExpenseDetailLayout>
    </ScreenHost>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Row spacing={6} alignment="center">
      <Text textStyle={{ color: colors.ink, fontSize: typeScale.body, fontWeight: '700' }}>{`${label}:`}</Text>
      <Text textStyle={{ color: colors.ink, fontSize: typeScale.body }}>{value}</Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  edit: { paddingHorizontal: 4 },
  editLabel: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
});
