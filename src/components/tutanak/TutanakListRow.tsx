import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, space, type as typeScale } from '@/constants/theme';
import type { Tutanak } from '@/models/tutanak';
import { formatTrDate } from '@/utils/date';

export function TutanakListRow({ tutanak, authorName, onPress }: { tutanak: Tutanak; authorName?: string; onPress: () => void }) {
  const imageCount = tutanak.attachments.filter((attachment) => attachment.resourceType === 'image').length;
  const documentCount = tutanak.attachments.length - imageCount;
  const name = authorName?.trim() ?? '';
  const note = tutanak.content.trim();
  const date = formatTrDate(tutanak.tutanakDate);
  // Başlık: not varsa not, yoksa tarih. Alt satır: kalan bilgiler.
  const title = note || date;
  const meta = [note ? date : '', name, imageCount > 0 ? `${imageCount} resim` : '', documentCount > 0 ? `${documentCount} doküman` : '']
    .filter((part) => part.length > 0)
    .join(' · ');
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowPressed: { backgroundColor: colors.fill },
  row: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 2,
  },
  title: { color: colors.ink, fontSize: typeScale.body, fontWeight: '500' },
  meta: { color: colors.faint, fontSize: typeScale.small },
});
