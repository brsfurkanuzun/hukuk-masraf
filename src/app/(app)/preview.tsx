import { Column, RNHostView, Row, Spacer, Text } from '@expo/ui';
import { Image } from 'expo-image';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { previewColumnModifiers } from '@/components/expenses/previewColumnModifiers';
import { previewFrameModifiers } from '@/components/expenses/previewFrameModifiers';
import { ScreenHost } from '@/components/native/ScreenHost';
import { colors, space, type as typeScale } from '@/constants/theme';
import { useExpense } from '@/hooks/useExpense';
import { toUserMessage } from '@/utils/errors';
import { formatFileSize } from '@/utils/text';

export default function PreviewScreen() {
  const params = useLocalSearchParams<{ dosyaId: string; expenseId: string; attachmentId: string }>();
  const dosyaId = typeof params.dosyaId === 'string' ? params.dosyaId : '';
  const expenseId = typeof params.expenseId === 'string' ? params.expenseId : '';
  const attachmentId = typeof params.attachmentId === 'string' ? params.attachmentId : '';
  const expenseQuery = useExpense(dosyaId, expenseId);
  const attachment = expenseQuery.data?.expenseItems.flatMap((item) => item.attachments).find((item) => item.id === attachmentId) ?? null;
  const fileUrl = attachment?.url || null;
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (!localUri) {
        return;
      }
      try {
        new File(localUri).delete();
      } catch {
        // The OS can already have removed the cache file.
      }
    };
  }, [localUri]);

  async function download(): Promise<string> {
    if (!fileUrl || !attachment) {
      throw new Error('Belge bağlantısı yok.');
    }
    const directory = new Directory(Paths.cache, 'previews');
    directory.create({ idempotent: true, intermediates: true });
    const extension = attachment.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
    const file = await File.downloadFileAsync(fileUrl, new File(directory, `${attachment.id}.${extension}`), {
      idempotent: true,
    });
    setLocalUri(file.uri);
    return file.uri;
  }

  async function openPdf() {
    if (!attachment) {
      return;
    }
    setBusy(true);
    setFileError(null);
    try {
      const uri = localUri ?? (await download());
      await File.preview(new File(uri), { mimeType: attachment.mimeType, title: attachment.fileName });
    } catch (error) {
      setFileError(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!attachment) {
      return;
    }
    setBusy(true);
    setFileError(null);
    try {
      const uri = localUri ?? (await download());
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: attachment.mimeType, dialogTitle: attachment.fileName });
      }
    } catch (error) {
      setFileError(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (expenseQuery.isLoading) {
    return (
      <ScreenHost>
        <LoadingState label="Belge hazırlanıyor" />
      </ScreenHost>
    );
  }
  if (expenseQuery.isError || !attachment) {
    return (
      <ScreenHost>
        <ErrorState message={expenseQuery.isError ? toUserMessage(expenseQuery.error) : 'Belge bulunamadı.'} />
      </ScreenHost>
    );
  }
  if (!fileUrl) {
    return (
      <ScreenHost>
        <ErrorState message="Belge adresi yok." />
      </ScreenHost>
    );
  }

  const isPdf = attachment.mimeType === 'application/pdf';
  return (
    <ScreenHost fill>
      <Column spacing={12} modifiers={previewColumnModifiers} style={layout.column}>
        <Text style={layout.full} textStyle={{ color: colors.ink, fontSize: typeScale.section, fontWeight: '700' }}>
          {attachment.fileName}
        </Text>
        <Text style={layout.full} textStyle={{ color: colors.muted, fontSize: typeScale.body }}>
          {`${isPdf ? 'PDF' : 'Fotoğraf'} · ${formatFileSize(attachment.fileSize)}`}
        </Text>
        {isPdf ? (
          <Text style={layout.full} textStyle={{ color: colors.muted, fontSize: typeScale.body }}>
            PDF, cihazın belge görüntüleyicisinde açılır.
          </Text>
        ) : Platform.OS === 'web' ? (
          <View style={styles.preview}>
            <Image source={{ uri: fileUrl }} style={styles.image} contentFit="contain" accessibilityLabel={attachment.fileName} />
          </View>
        ) : (
          <Column modifiers={previewFrameModifiers} style={layout.preview}>
            <RNHostView>
              <Image source={{ uri: fileUrl }} style={styles.image} contentFit="contain" accessibilityLabel={attachment.fileName} />
            </RNHostView>
          </Column>
        )}
        {isPdf ? <Button label="PDF'i aç" onPress={() => void openPdf()} loading={busy} style={layout.full} /> : null}
        {fileError ? (
          <Text style={layout.full} textStyle={{ color: colors.danger, fontSize: typeScale.body }}>
            {fileError}
          </Text>
        ) : null}
        <Row alignment="center" style={layout.full}>
          <Spacer flexible />
          <Button label="Paylaş" variant="secondary" onPress={() => void share()} disabled={busy} />
          <Spacer flexible />
        </Row>
      </Column>
    </ScreenHost>
  );
}

const layout = {
  column: { width: '100%', height: '100%', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl },
  full: { width: '100%' },
  preview: { width: '100%' },
} as const;

const styles = StyleSheet.create({
  preview: { width: '100%', flex: 1, minHeight: 240 },
  image: { width: '100%', height: '100%' },
});
