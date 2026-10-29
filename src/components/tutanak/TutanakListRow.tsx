import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, space, type as typeScale } from '@/constants/theme';
import type { Tutanak } from '@/models/tutanak';
import { formatTrDate } from '@/utils/date';

export function TutanakListRow({ tutanak, authorName, onPress }: { tutanak: Tutanak; authorName?: string; onPress: () => void }) {
  const attachmentCount = tutanak.attachments.length;
  const name = authorName?.trim() ?? '';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={styles.title} numberOfLines={2}>
        {tutanak.content.trim() || 'Tutanak'}
      </Text>
      <Text style={styles.meta}>
        {name ? `${formatTrDate(tutanak.tutanakDate)} · ${name}` : formatTrDate(tutanak.tutanakDate)}
        {attachmentCount > 0 ? ` · ${attachmentCount} belge` : ''}
      </Text>
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
