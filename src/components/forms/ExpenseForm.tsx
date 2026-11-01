import { Column, FieldGroup, RNHostView, Row, Spacer, Text } from '@expo/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { File } from 'expo-file-system';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, Text as BarText, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { flushRow } from '@/components/forms/flushRow';
import type { Dosya } from '@/models/dosya';
import { DateField } from '@/components/forms/DateField';
import { ExpenseSummaryCard } from '@/components/expenses/ExpenseSummaryCard';
import { ExpenseAddHeader } from '@/components/forms/ExpenseAddHeader';
import { AttachmentList } from '@/components/forms/ExpenseItemFields';
import { ExpenseTypeField } from '@/components/forms/ExpenseTypeField';
import { ScreenHost } from '@/components/native/ScreenHost';
import { withCurrentExpenseType } from '@/constants/expenseTypes';
import { MAX_EXPENSE_ITEMS } from '@/constants/limits';
import { colors, radius, space, type as typeScale } from '@/constants/theme';
import { useExpenseTypes } from '@/hooks/useExpenseTypes';
import type { AttachmentMeta, Expense, LocalAttachment } from '@/models/expense';
import { useAuth } from '@/providers/AuthProvider';
import { queryClient } from '@/providers/queryClient';
import { expenseEntryFormSchema, type ExpenseEntryFormValues, type ExpenseItemFormValues } from '@/schemas/expenseSchema';
import { assertAttachmentCapacity, pickImages, pickPdf } from '@/services/attachments/pickAttachment';
import { deleteUnreferencedAsset } from '@/services/cloudinary/flushOrphans';
import { forgetOrphanAssets } from '@/services/cloudinary/orphanStore';
import { uploadLocalAttachment } from '@/services/cloudinary/uploadService';
import { cacheCreatedExpense, cacheUpdatedExpense } from '@/services/expenses/cacheUpdates';
import { saveExpense } from '@/services/expenses/expenseService';
import { createEmptyEntryValues, createEmptyItem, expenseToEntryValues, formToExpense } from '@/services/expenses/mapExpense';
import { formatTrDate, nowIso, todayIsoDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';
import { createId } from '@/utils/id';
import { formatAmountInput, formatKurus, liveTotalKurus, parseTlToKurus } from '@/utils/money';
import { createSubmitLock } from '@/utils/submitLock';

interface ExpenseFormProps {
  mode: 'create' | 'edit';
  dosya: Dosya;
  initial?: Expense;
}

export function ExpenseForm({ mode, dosya, initial }: ExpenseFormProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { options: expenseTypes } = useExpenseTypes();
  const expenseIdRef = useRef(initial?.id ?? createId());
  const createdAtRef = useRef(initial?.createdAt ?? nowIso());
  const savedRef = useRef(false);
  const lock = useRef(createSubmitLock());
  const controllers = useRef(new Map<string, AbortController>());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const originalAttachments = useRef<AttachmentMeta[]>(initial?.expenseItems.flatMap((item) => item.attachments) ?? []);

  const { control, handleSubmit, setValue, getValues, reset, formState } = useForm<ExpenseEntryFormValues>({
    resolver: zodResolver(expenseEntryFormSchema),
    defaultValues: initial ? expenseToEntryValues(initial) : { ...createEmptyEntryValues(todayIsoDate()), items: [] },
  });
  const items = useWatch({ control, name: 'items' }) ?? [];
  const expenseDate = useWatch({ control, name: 'expenseDate' });
  const note = useWatch({ control, name: 'note' });
  const total = liveTotalKurus(items.map((item) => item.amount));
  const errors = formState.errors;
  const saveRef = useRef<() => void>(() => {});
  saveRef.current = () => {
    void handleSubmit(onValid)();
  };

  useEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [
        {
          type: 'button',
          label: 'Kaydet',
          variant: 'done',
          tintColor: colors.navy,
          disabled: saving,
          onPress: () => saveRef.current(),
        },
      ],
      headerRight: () => (
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => saveRef.current()} hitSlop={8} style={styles.save}>
          <BarText style={[styles.saveLabel, saving && styles.saveBusy]}>Kaydet</BarText>
        </Pressable>
      ),
    });
  }, [mode, navigation, saving]);

  function patchItem(itemId: string, patch: (item: ExpenseItemFormValues) => ExpenseItemFormValues) {
    setValue(
      'items',
      getValues('items').map((item) => (item.id === itemId ? patch(item) : item)),
      { shouldDirty: true },
    );
  }

  function findAttachment(itemId: string, attachmentId: string): LocalAttachment | undefined {
    return getValues('items')
      .find((item) => item.id === itemId)
      ?.attachments.find((attachment) => attachment.id === attachmentId);
  }

  async function uploadAttachment(itemId: string, attachmentId: string): Promise<void> {
    if (!user) {
      throw new Error('Oturum bulunamadı.');
    }
    const current = findAttachment(itemId, attachmentId);
    if (!current || current.status === 'uploaded') {
      return;
    }
    controllers.current.get(attachmentId)?.abort();
    const controller = new AbortController();
    controllers.current.set(attachmentId, controller);
    patchItem(itemId, (item) => ({
      ...item,
      attachments: item.attachments.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, status: 'uploading', progress: 0, errorMessage: undefined } : attachment,
      ),
    }));
    try {
      const uploaded = await uploadLocalAttachment({
        uid: user.uid,
        expenseId: expenseIdRef.current,
        itemId,
        attachment: current,
        signal: controller.signal,
        onProgress: (progress) => {
          patchItem(itemId, (item) => ({
            ...item,
            attachments: item.attachments.map((attachment) =>
              attachment.id === attachmentId ? { ...attachment, progress } : attachment,
            ),
          }));
        },
      });
      patchItem(itemId, (item) => ({
        ...item,
        attachments: item.attachments.map((attachment) =>
          attachment.id === attachmentId ? { ...attachment, status: 'uploaded', progress: 1, uploaded } : attachment,
        ),
      }));
    } catch (error) {
      const message = toUserMessage(error);
      patchItem(itemId, (item) => ({
        ...item,
        attachments: item.attachments.map((attachment) =>
          attachment.id === attachmentId ? { ...attachment, status: 'error', errorMessage: message } : attachment,
        ),
      }));
      throw error;
    } finally {
      controllers.current.delete(attachmentId);
    }
  }

  async function waitUntilSettled(itemId: string, attachmentId: string): Promise<void> {
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const attachment = findAttachment(itemId, attachmentId);
      if (!attachment || attachment.status === 'uploaded') {
        return;
      }
      if (attachment.status === 'error') {
        throw new Error(attachment.errorMessage ?? 'Belge yüklenemedi.');
      }
      if (attachment.status !== 'uploading') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error('Belge yüklemesi zaman aşımına uğradı.');
  }

  async function ensureUploads(): Promise<void> {
    const snapshot = getValues('items');
    for (const item of snapshot) {
      for (const attachment of item.attachments) {
        const latest = findAttachment(item.id, attachment.id);
        if (!latest || latest.status === 'uploaded') {
          continue;
        }
        if (latest.status === 'uploading') {
          await waitUntilSettled(item.id, attachment.id);
          continue;
        }
        await uploadAttachment(item.id, attachment.id);
      }
    }
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove' as never, () => {
      if (savedRef.current || !user) {
        return;
      }
      const originalIds = new Set(originalAttachments.current.map((attachment) => attachment.id));
      const pending = getValues('items')
        .flatMap((item) => item.attachments)
        .filter((attachment) => attachment.uploaded && !originalIds.has(attachment.id));
      for (const attachment of pending) {
        if (!attachment.uploaded) {
          continue;
        }
        void deleteUnreferencedAsset({
          uid: user.uid,
          expenseId: expenseIdRef.current,
          publicId: attachment.uploaded.cloudinaryPublicId,
          resourceType: attachment.uploaded.resourceType,
        });
      }
    });
    return unsubscribe;
  }, [getValues, navigation, user]);

  async function addDocuments(itemId: string, source: 'library' | 'camera' | 'pdf') {
    try {
      const incoming = source === 'pdf' ? await pickPdf() : await pickImages(source === 'camera' ? 'camera' : 'library');
      if (incoming.length === 0) {
        return;
      }
      const owner = getValues('items').find((item) => item.id === itemId);
      const currentCount = owner?.attachments.length ?? 0;
      assertAttachmentCapacity(currentCount, incoming.length);
      // Yükleme Kaydet'e basılınca yapılır (ensureUploads); burada yalnızca listeye eklenir.
      patchItem(itemId, (item) => ({ ...item, attachments: [...item.attachments, ...incoming] }));
    } catch (error) {
      Alert.alert('Belge eklenemedi', toUserMessage(error));
    }
  }

  function removeAttachment(itemId: string, attachment: LocalAttachment) {
    controllers.current.get(attachment.id)?.abort();
    patchItem(itemId, (item) => ({
      ...item,
      attachments: item.attachments.filter((candidate) => candidate.id !== attachment.id),
    }));
    const originalIds = new Set(originalAttachments.current.map((item) => item.id));
    if (attachment.uploaded && user && !originalIds.has(attachment.id)) {
      void deleteUnreferencedAsset({
        uid: user.uid,
        expenseId: expenseIdRef.current,
        publicId: attachment.uploaded.cloudinaryPublicId,
        resourceType: attachment.uploaded.resourceType,
      });
    }
  }

  async function openAttachment(attachment: LocalAttachment) {
    if (!attachment.localUri) {
      if (!initial) {
        return;
      }
      router.push({ pathname: '/preview', params: { dosyaId: dosya.id, expenseId: initial.id, attachmentId: attachment.id } });
      return;
    }
    if (attachment.mimeType === 'application/pdf') {
      const file = new File(attachment.localUri);
      await File.preview(file, { mimeType: attachment.mimeType, title: attachment.fileName });
      return;
    }
    setPreviewUri(attachment.localUri);
  }

  function addLine() {
    const current = getValues('items');
    if (current.length >= MAX_EXPENSE_ITEMS) {
      Alert.alert('Masraf eklenemedi', 'En fazla 20 masraf kalemi eklenebilir.');
      return;
    }
    const next = createEmptyItem(expenseTypes[0]?.value ?? 'yol');
    setValue('items', [...current, next], { shouldDirty: true });
  }

  function deleteLine(item: ExpenseItemFormValues) {
    for (const attachment of item.attachments) {
      removeAttachment(item.id, attachment);
    }
    setValue(
      'items',
      getValues('items').filter((candidate) => candidate.id !== item.id),
      { shouldDirty: true },
    );
  }

  async function onValid(_values: ExpenseEntryFormValues) {
    if (!user || !lock.current.tryLock()) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await ensureUploads();
      const expense = formToExpense({
        id: expenseIdRef.current,
        dosya,
        userId: initial?.userId ?? user.uid,
        values: getValues(),
        createdAt: createdAtRef.current,
      });
      await saveExpense(dosya.id, expense);
      await forgetOrphanAssets(
        user.uid,
        expense.expenseItems.flatMap((item) => item.attachments.map((attachment) => attachment.cloudinaryPublicId)),
      );
      if (mode === 'create') {
        cacheCreatedExpense(queryClient, user.uid, expense);
      } else {
        cacheUpdatedExpense(queryClient, user.uid, expense);
        const kept = new Set(expense.expenseItems.flatMap((item) => item.attachments.map((attachment) => attachment.id)));
        const removed = originalAttachments.current.filter((attachment) => !kept.has(attachment.id));
        await Promise.all(
          removed.map((attachment) =>
            deleteUnreferencedAsset({
              uid: user.uid,
              expenseId: expense.id,
              publicId: attachment.cloudinaryPublicId,
              resourceType: attachment.resourceType,
            }),
          ),
        );
      }
      if (mode === 'create') {
        expenseIdRef.current = createId();
        createdAtRef.current = nowIso();
        reset({ ...createEmptyEntryValues(todayIsoDate()), items: [] });
        Alert.alert('Masraf kaydedildi', 'Kayıt listeye eklendi.');
      } else {
        savedRef.current = true;
        Alert.alert('Masraf güncellendi', 'Değişiklikler kaydedildi.');
        router.back();
      }
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      lock.current.unlock();
      setSaving(false);
    }
  }

  const itemErrors = errors.items;
  const itemsMessage =
    itemErrors && 'message' in itemErrors && typeof itemErrors.message === 'string'
      ? itemErrors.message
      : itemErrors && 'root' in itemErrors && itemErrors.root && typeof itemErrors.root.message === 'string'
        ? itemErrors.root.message
        : items
            .map((_, index) => {
              const rowError = itemErrors?.[index];
              if (rowError && 'amount' in rowError && typeof rowError.amount?.message === 'string') {
                return rowError.amount.message;
              }
              if (rowError && 'note' in rowError && typeof rowError.note?.message === 'string') {
                return rowError.note.message;
              }
              return undefined;
            })
            .find((message) => message !== undefined);
  const summary = formError || errors.expenseDate?.message || itemsMessage;

  return (
    <>
      <View style={styles.page}>
        <ScreenHost fill>
        <FieldGroup>
          <FieldGroup.Section>
            {/* RN kart, kaydırılan yerel listenin içinde: form kayarken birlikte kayar. Genişlik üst öğeden, yükseklik karttan gelir. */}
            <Column modifiers={flushRow}>
              <RNHostView matchContents={{ vertical: true }}>
                <ExpenseSummaryCard
                  summary={{
                    debtorName: dosya.debtorName,
                    fileCaseNumber: dosya.fileCaseNumber,
                    clientName: dosya.clientName,
                    date: formatTrDate(expenseDate),
                    total: formatKurus(total),
                    itemCount: items.length,
                    enforcementOffice: dosya.enforcementOffice,
                    instructionNumber: dosya.instructionNumber,
                    note: '',
                  }}
                />
              </RNHostView>
            </Column>
          </FieldGroup.Section>
          <FieldGroup.Section>
            <DateField label="Tarih" value={expenseDate} onChange={(value) => setValue('expenseDate', value, { shouldValidate: true })} error={errors.expenseDate?.message} />
            <TextField label="Not" value={note} onChangeText={(value) => setValue('note', value)} placeholder="İsteğe bağlı" multiline />
          </FieldGroup.Section>
          <FieldGroup.Section>
            <FieldGroup.SectionHeader>
              <ExpenseAddHeader onAdd={addLine} />
            </FieldGroup.SectionHeader>
            <Row spacing={8} alignment="center" style={{ width: '100%' }}>
              <Text textStyle={{ color: colors.muted, fontSize: typeScale.body, fontWeight: '600' }}>{`Toplam (${items.length} kalem)`}</Text>
              <Spacer flexible />
              <Text textStyle={{ color: colors.navy, fontSize: typeScale.section, fontWeight: '700' }}>{formatKurus(total)}</Text>
            </Row>
          </FieldGroup.Section>
          {items.map((item, index) => {
            const rowError = errors.items?.[index];
            const amountError = rowError && 'amount' in rowError && typeof rowError.amount?.message === 'string' ? rowError.amount.message : undefined;
            const noteError = rowError && 'note' in rowError && typeof rowError.note?.message === 'string' ? rowError.note.message : undefined;
            return (
              <FieldGroup.Section key={item.id} title={`Kalem ${index + 1}`}>
                <ExpenseTypeField
                  appearance="menu"
                  value={item.type}
                  options={withCurrentExpenseType(expenseTypes, item.type)}
                  onChange={(type) => patchItem(item.id, (current) => ({ ...current, type }))}
                />
                <TextField
                  label="Tutar"
                  value={item.amount}
                  onChangeText={(value) => patchItem(item.id, (current) => ({ ...current, amount: value }))}
                  onBlur={() => {
                    const kurus = parseTlToKurus(item.amount);
                    if (kurus !== null) {
                      patchItem(item.id, (current) => ({ ...current, amount: formatAmountInput(kurus) }));
                    }
                  }}
                  error={amountError}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                />
                <TextField
                  label="Not"
                  value={item.note ?? ''}
                  onChangeText={(value) => patchItem(item.id, (current) => ({ ...current, note: value }))}
                  error={noteError}
                  placeholder="İsteğe bağlı"
                  multiline
                />
                <Row spacing={8}>
                  <Button label="Galeri" variant="secondary" onPress={() => void addDocuments(item.id, 'library')} />
                  <Button label="Kamera" variant="secondary" onPress={() => void addDocuments(item.id, 'camera')} />
                  <Button label="PDF" variant="secondary" onPress={() => void addDocuments(item.id, 'pdf')} />
                </Row>
                <AttachmentList
                  attachments={item.attachments}
                  onOpen={(attachment) => void openAttachment(attachment)}
                  onRemove={(attachment) => removeAttachment(item.id, attachment)}
                  onRetry={(attachment) => void uploadAttachment(item.id, attachment.id)}
                />
                <Button label="Kalemi sil" variant="danger" onPress={() => deleteLine(item)} />
              </FieldGroup.Section>
            );
          })}
          {summary ? (
            <FieldGroup.Section>
              <Text textStyle={{ color: colors.danger, fontSize: typeScale.body }}>{summary}</Text>
            </FieldGroup.Section>
          ) : null}
        </FieldGroup>
        </ScreenHost>
      </View>
      <Modal visible={previewUri !== null} animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewUri(null)}>
        <View style={styles.preview}>
          {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="contain" accessibilityLabel="Fotoğraf önizleme" /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            onPress={() => setPreviewUri(null)}
            hitSlop={12}
            style={[styles.previewClose, { top: insets.top + 8 }]}
          >
            <BarText style={styles.previewCloseLabel}>Kapat</BarText>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
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
  saveSlot: { minWidth: 72, alignItems: 'flex-end', paddingRight: space.sm },
  savePill: {
    minWidth: 72,
    alignItems: 'center',
    marginRight: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.navy,
  },
  savePillLabel: { color: colors.onNavy, fontSize: typeScale.label, fontWeight: '700' },
  hero: {
    marginHorizontal: space.lg,
    marginTop: space.xs,
    marginBottom: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    gap: space.xs,
  },
  heroKicker: { color: 'rgba(255, 255, 255, 0.65)', fontSize: typeScale.small, fontWeight: '600', letterSpacing: 0.8 },
  heroTitle: { color: colors.onNavy, fontSize: typeScale.title, fontWeight: '700' },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  heroChip: { maxWidth: '100%', paddingHorizontal: space.md, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.14)' },
  heroChipText: { color: colors.onNavy, fontSize: typeScale.label, fontWeight: '500' },
  preview: { flex: 1, backgroundColor: '#000000' },
  previewClose: { position: 'absolute', left: 16, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.22)' },
  previewCloseLabel: { color: '#FFFFFF', fontSize: typeScale.body, fontWeight: '600' },
  previewImage: { flex: 1 },
  save: { paddingHorizontal: 4 },
  saveLabel: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
  saveBusy: { opacity: 0.45 },
});
