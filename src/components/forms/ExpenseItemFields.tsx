import { Column, Row, Text } from '@expo/ui';

import { Button } from '@/components/common/Button';
import { colors, type as typeScale } from '@/constants/theme';
import type { LocalAttachment } from '@/models/expense';
import { formatFileSize } from '@/utils/text';

interface AttachmentListProps {
  attachments: LocalAttachment[];
  onOpen: (attachment: LocalAttachment) => void;
  onRemove: (attachment: LocalAttachment) => void;
  onRetry: (attachment: LocalAttachment) => void;
}

export function AttachmentList({ attachments, onOpen, onRemove, onRetry }: AttachmentListProps) {
  if (attachments.length === 0) {
    return <Text textStyle={{ color: colors.faint, fontSize: typeScale.label }}>Henüz belge yok.</Text>;
  }
  return (
    <Column spacing={8}>
      {attachments.map((attachment) => {
        const kind = attachment.mimeType === 'application/pdf' ? 'PDF' : 'Fotoğraf';
        const progress = attachment.status === 'uploading' ? ` · %${Math.round(attachment.progress * 100)}` : '';
        const uploaded = attachment.status === 'uploaded' ? ' · yüklendi' : '';
        const failed = attachment.status === 'error' ? ` · ${attachment.errorMessage ?? 'yüklenemedi'}` : '';
        return (
          <Column key={attachment.id} spacing={2}>
            <Text textStyle={{ color: colors.ink, fontSize: typeScale.body }}>{attachment.fileName}</Text>
            <Text textStyle={{ color: colors.muted, fontSize: typeScale.small }}>{`${kind} · ${formatFileSize(attachment.fileSize)}${progress}${uploaded}${failed}`}</Text>
            <Row spacing={8}>
              {attachment.status === 'error' ? <Button variant="ghost" label="Dene" onPress={() => onRetry(attachment)} /> : null}
              <Button variant="ghost" label="Aç" onPress={() => onOpen(attachment)} />
              <Button variant="danger" label="Kaldır" onPress={() => onRemove(attachment)} />
            </Row>
          </Column>
        );
      })}
    </Column>
  );
}
