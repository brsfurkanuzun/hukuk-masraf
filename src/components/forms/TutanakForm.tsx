import { Image } from 'expo-image';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DosyaHeroCard } from '@/components/dosya/DosyaHeroCard';
import { DateField } from '@/components/forms/DateField';
import { InlineNativeHost } from '@/components/native/InlineNativeHost';
import { colors, radius, space, type as typeScale } from '@/constants/theme';
import type { Dosya } from '@/models/dosya';
import type { AttachmentMeta, LocalAttachment } from '@/models/expense';
import type { Tutanak } from '@/models/tutanak';
import { useAuth } from '@/providers/AuthProvider';
import { assertAttachmentCapacity, pickImages, pickPdf } from '@/services/attachments/pickAttachment';
import { uploadLocalAttachment } from '@/services/cloudinary/uploadService';
import { notifyTutanakAdded } from '@/services/tutanak/tutanakPushService';
import { saveTutanak } from '@/services/tutanak/tutanakService';
import { nowIso, todayIsoDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';
import { createId } from '@/utils/id';
import { createSubmitLock } from '@/utils/submitLock';

export function TutanakForm({ dosya }: { dosya: Dosya }) {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const tutanakId = useRef(createId());
  const [tutanakDate, setTutanakDate] = useState(todayIsoDate());
  const [content, setContent] = useState('');
  const draftNote = useRef('');
  const acceptedNote = useRef('');
  const noteLineHeight = useRef(0);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [missingDocument, setMissingDocument] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const lock = useRef(createSubmitLock());
  const saveRef = useRef<() => void>(() => {});

  saveRef.current = () => {
    void onSave();
  };

  // Kaydet, yığın başlığında (diğer ekranlardaki gibi) durur.
  useEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [
        {
          type: 'button',
          label: saving ? 'Kaydediliyor…' : 'Kaydet',
          variant: 'done',
          tintColor: colors.navy,
          disabled: saving,
          onPress: () => saveRef.current(),
        },
      ],
      headerRight: () => (
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => saveRef.current()} hitSlop={8} style={styles.headerSave}>
          <Text style={[styles.headerSaveLabel, saving && styles.saveBusy]}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text>
        </Pressable>
      ),
    });
  }, [navigation, saving]);

  function updateAttachment(id: string, patch: Partial<LocalAttachment>) {
    setAttachments((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadOne(attachment: LocalAttachment): Promise<AttachmentMeta | null> {
    if (!user) {
      return null;
    }
    updateAttachment(attachment.id, { status: 'uploading', progress: 0, errorMessage: undefined });
    try {
      const uploaded = await uploadLocalAttachment({
        uid: user.uid,
        expenseId: tutanakId.current,
        itemId: tutanakId.current,
        attachment,
        onProgress: (progress) => updateAttachment(attachment.id, { progress }),
      });
      updateAttachment(attachment.id, { status: 'uploaded', progress: 1, uploaded });
      return uploaded;
    } catch (error) {
      updateAttachment(attachment.id, { status: 'error', errorMessage: toUserMessage(error) });
      return null;
    }
  }

  function changeNote(text: string) {
    const next = text.replace(/\r?\n/g, '');
    draftNote.current = next;
    setContent(next);
  }

  function limitNoteToTwoLines(height: number) {
    if (height <= 0) {
      return;
    }
    if (noteLineHeight.current === 0) {
      noteLineHeight.current = height;
      acceptedNote.current = draftNote.current;
      return;
    }
    if (height > noteLineHeight.current * 2 + 6) {
      draftNote.current = acceptedNote.current;
      setContent(acceptedNote.current);
      return;
    }
    acceptedNote.current = draftNote.current;
  }

  function chooseDocuments() {
    Alert.alert('Belge ekle', undefined, [
      { text: 'Galeri', onPress: () => void addDocuments('library') },
      { text: 'Kamera', onPress: () => void addDocuments('camera') },
      { text: 'PDF', onPress: () => void addDocuments('pdf') },
      { text: 'Vazgeç', style: 'cancel' },
    ]);
  }

  async function addDocuments(source: 'library' | 'camera' | 'pdf') {
    try {
      const incoming = source === 'pdf' ? await pickPdf() : await pickImages(source === 'camera' ? 'camera' : 'library');
      if (incoming.length === 0) {
        return;
      }
      assertAttachmentCapacity(attachments.length, incoming.length);
      setAttachments((current) => [...current, ...incoming]);
      setMissingDocument(false);
      setFormError(null);
      // Yükleme Kaydet'e basılınca yapılır.
    } catch (error) {
      Alert.alert('Belge eklenemedi', toUserMessage(error));
    }
  }

  async function onSave() {
    if (!user || !lock.current.tryLock()) {
      return;
    }
    const trimmed = content.trim();
    if (attachments.length === 0) {
      setMissingDocument(true);
      setFormError('En az bir belge eklemelisiniz.');
      lock.current.unlock();
      return;
    }
    setSaving(true);
    setFormError(null);
    // Belgeler yalnızca Kaydet'te yüklenir; daha önce yüklenmiş olanlar atlanır.
    const uploadedFiles: AttachmentMeta[] = [];
    for (const item of attachments) {
      const uploaded = item.status === 'uploaded' && item.uploaded ? item.uploaded : await uploadOne(item);
      if (!uploaded) {
        setFormError('Belge yüklenemedi. Bağlantınızı kontrol edip tekrar kaydedin.');
        setSaving(false);
        lock.current.unlock();
        return;
      }
      uploadedFiles.push(uploaded);
    }
    const createdAt = nowIso();
    const record: Tutanak = {
      id: tutanakId.current,
      dosyaId: dosya.id,
      ownerId: dosya.ownerId,
      userId: user.uid,
      tutanakDate,
      content: trimmed,
      attachments: uploadedFiles,
      createdAt,
      updatedAt: createdAt,
    };
    try {
      await saveTutanak(dosya.id, record);
      void notifyTutanakAdded(dosya.id, record.id);
      Alert.alert('Tutanak kaydedildi', 'Kayıt dosyaya eklendi.');
      router.back();
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      lock.current.unlock();
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DosyaHeroCard
          embedded
          info={{
            debtorName: dosya.debtorName,
            fileCaseNumber: dosya.fileCaseNumber,
            clientName: dosya.clientName,
            enforcementOffice: dosya.enforcementOffice,
            instructionNumber: dosya.instructionNumber,
          }}
        />
        <View style={styles.card}>
          <InlineNativeHost>
            <DateField framed label="Tarih" value={tutanakDate} onChange={setTutanakDate} />
          </InlineNativeHost>
          <TextInput
            value={content}
            onChangeText={changeNote}
            onContentSizeChange={(event) => limitNoteToTwoLines(event.nativeEvent.contentSize.height)}
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Not Ekle"
            placeholderTextColor={colors.faint}
            multiline
            numberOfLines={2}
            blurOnSubmit
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Belge ekle"
            onPress={chooseDocuments}
            style={({ pressed }) => [styles.addDoc, pressed && styles.addDocPressed]}
          >
            <Text style={styles.addDocLabel}>Belge ekle</Text>
          </Pressable>
          {attachments.length === 0 ? (
            <Text style={[styles.requiredHint, missingDocument && styles.requiredHintError]}>En az bir belge eklemek zorunlu.</Text>
          ) : null}
          {attachments.length > 0 ? (
            <View style={styles.thumbs}>
              {attachments.map((attachment) => {
                const image = attachment.mimeType !== 'application/pdf';
                return (
                  <View key={attachment.id} style={styles.thumb}>
                    {image ? (
                      <Image source={{ uri: attachment.localUri }} style={styles.thumbImage} contentFit="cover" />
                    ) : (
                      <View style={styles.pdfTile}>
                        <Text style={styles.pdfLabel}>PDF</Text>
                      </View>
                    )}
                    {attachment.status === 'uploading' ? <View style={styles.thumbDim} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Belgeyi kaldır"
                      onPress={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                      hitSlop={6}
                      style={styles.thumbClose}
                    >
                      <Text style={styles.thumbCloseLabel}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
      </ScrollView>
    </View>
  );
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
  saveSlot: { minWidth: 72, alignItems: 'flex-end', paddingRight: space.sm },
  scroll: { flex: 1 },
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  headerSave: { paddingHorizontal: 4 },
  headerSaveLabel: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingBottom: space.sm,
  },
  fieldLabel: { color: colors.muted, fontSize: typeScale.label, paddingHorizontal: space.lg, paddingTop: space.sm },
  input: {
    height: 64,
    marginHorizontal: space.lg,
    marginTop: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    color: colors.ink,
    fontSize: typeScale.body,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  addDoc: {
    minHeight: 44,
    marginHorizontal: space.lg,
    marginTop: space.md,
    marginBottom: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  addDocPressed: { opacity: 0.75 },
  addDocLabel: { color: colors.white, fontSize: typeScale.body, fontWeight: '600' },
  thumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.fill,
  },
  thumbImage: { width: '100%', height: '100%' },
  pdfTile: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  pdfLabel: { color: colors.white, fontSize: typeScale.small, fontWeight: '700' },
  thumbDim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.45)' },
  thumbClose: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCloseLabel: { color: colors.white, fontSize: 14, lineHeight: 16, fontWeight: '700' },
  error: { color: colors.danger, fontSize: typeScale.body },
  requiredHint: { marginHorizontal: space.lg, marginBottom: space.xs, color: colors.faint, fontSize: typeScale.small },
  requiredHintError: { color: colors.danger, fontWeight: '600' },
  saveLabel: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
  saveBusy: { opacity: 0.45 },
});
