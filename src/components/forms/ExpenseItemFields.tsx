import { Column, Row, Text } from '@expo/ui';

import { Button } from '@/components/common/Button';
import { colors, space, type as typeScale } from '@/constants/theme';
import type { LocalAttachment } from '@/models/expense';
import { formatFileSize } from '@/utils/text';

interface AttachmentListProps {
  attachments: LocalAttachment[];
  onOpen: (attachment: LocalAttachment) => void;
  onRemove: (attachment: LocalAttachment) => void;
  onRetry: (attachment: LocalAttachment) => void;
}

function statusOf(attachment: LocalAttachment): { label: string; color: string } | null {
  if (attachment.status === 'uploading') {
    return { label: `Yükleniyor %${Math.round(attachment.progress * 100)}`, color: colors.navy };
  }
  if (attachment.status === 'uploaded') {
    return { label: '✓ Yüklendi', color: colors.accent };
  }
  if (attachment.status === 'error') {
    return { label: attachment.errorMessage ?? 'Yüklenemedi', color: colors.danger };
  }
  return { label: 'Kaydedince yüklenecek', color: colors.faint };
}

export function AttachmentList({ attachments, onOpen, onRemove, onRetry }: AttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <Column spacing={2} style={{ backgroundColor: colors.fill, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text textStyle={{ color: colors.ink, fontSize: typeScale.label, fontWeight: '600' }}>Henüz ek yok</Text>
        <Text textStyle={{ color: colors.faint, fontSize: typeScale.small }}>Galeri, Kamera veya PDF ile ekleyebilirsiniz.</Text>
      </Column>
    );
  }
  return (
    <Column spacing={space.sm}>
      <Text textStyle={{ color: colors.faint, fontSize: typeScale.small, fontWeight: '600', letterSpacing: 0.4 }}>{`EKLER (${attachments.length})`}</Text>
      {attachments.map((attachment) => {
        const kind = attachment.mimeType.startsWith('image/') ? 'Resim' : 'Doküman';
        const status = statusOf(attachment);
        return (
          <Column
            key={attachment.id}
            spacing={4}
            style={{ backgroundColor: colors.fill, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <Text numberOfLines={1} textStyle={{ color: colors.ink, fontSize: typeScale.body, fontWeight: '600' }}>
              {attachment.fileName}
            </Text>
            <Row spacing={space.sm} alignment="center">
              <Text textStyle={{ color: colors.muted, fontSize: typeScale.small }}>{kind === 'Resim' ? kind : `${kind} · ${formatFileSize(attachment.fileSize)}`}</Text>
              {status ? <Text textStyle={{ color: status.color, fontSize: typeScale.small, fontWeight: '600' }}>{status.label}</Text> : null}
            </Row>
            <Row spacing={space.sm}>
              {attachment.status === 'error' ? <Button variant="secondary" label="Tekrar dene" onPress={() => onRetry(attachment)} /> : null}
              <Button variant="secondary" label="Aç" onPress={() => onOpen(attachment)} />
              <Button variant="danger" label="Kaldır" onPress={() => onRemove(attachment)} />
            </Row>
          </Column>
        );
      })}
    </Column>
  );
}
