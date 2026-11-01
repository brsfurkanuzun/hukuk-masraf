import { Directory, File, Paths } from 'expo-file-system';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TutanakImageViewer } from '@/components/tutanak/TutanakImageViewer';
import { colors, radius, space, type as typeScale } from '@/constants/theme';
import type { AttachmentMeta } from '@/models/expense';
import { toUserMessage } from '@/utils/errors';
import { formatFileSize } from '@/utils/text';

function isImage(attachment: AttachmentMeta): boolean {
  return attachment.resourceType === 'image';
}

function extensionOf(attachment: AttachmentMeta): string {
  if (attachment.mimeType === 'application/pdf') {
    return 'pdf';
  }
  const fromName = /\.([A-Za-z0-9]{1,5})$/.exec(attachment.fileName)?.[1];
  return fromName ? fromName.toLowerCase() : 'bin';
}

/** iOS'ta Modal kapanırken başka ekran/uyarı açmak dokunmaları kilitler; bu yüzden kısa gecikme bırakılır. */
const AFTER_MODAL_MS = 450;

/** Görsel olmayan eki (PDF vb.) indirip cihazın belge görüntüleyicisinde açar; hatayı kullanıcıya gösterir. */
async function openDocument(attachment: AttachmentMeta): Promise<void> {
  try {
    const directory = new Directory(Paths.cache, 'previews');
    directory.create({ idempotent: true, intermediates: true });
    const file = await File.downloadFileAsync(attachment.url, new File(directory, `${attachment.id}.${extensionOf(attachment)}`), {
      idempotent: true,
    });
    await File.preview(file, { mimeType: attachment.mimeType || undefined, title: attachment.fileName });
  } catch (error) {
    setTimeout(() => Alert.alert('Belge açılamadı', toUserMessage(error)), AFTER_MODAL_MS);
  }
}

/**
 * Tutanak eklerini açar: tek görsel doğrudan görüntüleyicide, tek belge cihazın görüntüleyicisinde,
 * birden fazla ek (veya karışık) varsa önce liste gösterilir.
 */
export function TutanakAttachmentsViewer({
  attachments,
  directOpenId,
  onClose,
}: {
  attachments: AttachmentMeta[];
  /** Verilirse liste gösterilmez: o ek doğrudan açılır (resimde diğer resimlere kaydırılabilir). */
  directOpenId?: string;
  onClose: () => void;
}) {
  const usable = attachments.filter((attachment) => attachment.url);
  const images = usable.filter(isImage);
  const [listVisible, setListVisible] = useState(true);
  const [imageStart, setImageStart] = useState<number | null>(null);
  const started = useRef(false);

  const focus = directOpenId ? usable.find((attachment) => attachment.id === directOpenId) : undefined;
  const onlyOne = focus ?? (usable.length === 1 ? usable[0] : null);
  const singleImage = onlyOne && isImage(onlyOne);
  const singleDocument = onlyOne && !isImage(onlyOne) ? onlyOne : null;

  // Tek belge: liste ve Modal olmadan doğrudan aç, sonra kapat.
  useEffect(() => {
    if (!singleDocument || started.current) {
      return;
    }
    started.current = true;
    void openDocument(singleDocument).finally(onClose);
  }, [singleDocument, onClose]);

  if (usable.length === 0) {
    return null;
  }
  if (singleImage) {
    return <TutanakImageViewer images={images} initialIndex={Math.max(0, images.findIndex((candidate) => candidate.id === onlyOne.id))} onClose={onClose} />;
  }
  if (singleDocument) {
    // Modal kullanılmaz: kapanış yarışı dokunmaları kilitlemesin.
    return (
      <View pointerEvents="none" style={styles.busyOverlay}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }
  if (imageStart !== null) {
    return <TutanakImageViewer images={images} initialIndex={imageStart} onClose={onClose} />;
  }
  return (
    <AttachmentList
      attachments={usable}
      visible={listVisible}
      onOpen={(attachment) => {
        setListVisible(false);
        if (isImage(attachment)) {
          setTimeout(() => setImageStart(Math.max(0, images.findIndex((candidate) => candidate.id === attachment.id))), AFTER_MODAL_MS);
          return;
        }
        setTimeout(() => {
          void openDocument(attachment).finally(onClose);
        }, AFTER_MODAL_MS);
      }}
      onClose={onClose}
    />
  );
}

function AttachmentList({
  attachments,
  visible,
  onOpen,
  onClose,
}: {
  attachments: AttachmentMeta[];
  visible: boolean;
  onOpen: (attachment: AttachmentMeta) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Kapat" style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Ekler</Text>
          </View>
          {attachments.map((attachment, index) => {
            const image = isImage(attachment);
            return (
              <Pressable
                key={attachment.id}
                accessibilityRole="button"
                onPress={() => onOpen(attachment)}
                style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.rowPressed]}
              >
                <View style={[styles.icon, image ? styles.iconImage : styles.iconDoc]}>
                  <SymbolView
                    name={image ? { ios: 'photo.fill', android: 'image' } : { ios: 'doc.richtext.fill', android: 'description' }}
                    size={20}
                    tintColor={image ? colors.navy : colors.accent}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {image ? 'Resim' : `Doküman · ${formatFileSize(attachment.fileSize)}`}
                  </Text>
                </View>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={16} tintColor={colors.faint} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  busyOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.35)', alignItems: 'center', justifyContent: 'center' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.separator, marginBottom: space.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  title: { color: colors.ink, fontSize: typeScale.title, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowPressed: { backgroundColor: colors.fill },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconImage: { backgroundColor: '#E3EDF6' },
  iconDoc: { backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontSize: typeScale.body, fontWeight: '500' },
  rowMeta: { color: colors.faint, fontSize: typeScale.small },
});
