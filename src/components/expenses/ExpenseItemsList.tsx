import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type as typeScale } from '@/constants/theme';
import type { AttachmentMeta } from '@/models/expense';
import { formatFileSize } from '@/utils/text';

export interface ExpenseItemRow {
  id: string;
  typeLabel: string;
  amount: string;
  note: string;
  attachments: AttachmentMeta[];
}

/**
 * Masraf kalemleri: her kalem kendi kartında. Tür ve tutar üstte, not ve ekler tam genişlikte alt alta
 * olduğundan uzun metinler satırı bozmaz, hiçbir bilgi kesilmez (not satırlara sarılır).
 */
export function ExpenseItemsList({
  items,
  total,
  onOpenAttachment,
}: {
  items: ExpenseItemRow[];
  total: string;
  onOpenAttachment: (attachment: AttachmentMeta) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{`MASRAFLAR (${items.length})`}</Text>
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.id} style={[styles.item, index > 0 && styles.itemDivider]}>
            <View style={styles.head}>
              <Text style={styles.type}>{item.typeLabel}</Text>
              <Text style={styles.amount}>{item.amount}</Text>
            </View>
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            {item.attachments.map((attachment) => {
              const image = attachment.resourceType === 'image';
              return (
                <Pressable
                  key={attachment.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${attachment.fileName} aç`}
                  onPress={() => onOpenAttachment(attachment)}
                  style={({ pressed }) => [styles.attachment, pressed && styles.attachmentPressed]}
                >
                  <View style={[styles.attachmentIcon, image ? styles.iconImage : styles.iconDoc]}>
                    <SymbolView
                      name={image ? { ios: 'photo.fill', android: 'image' } : { ios: 'doc.richtext.fill', android: 'description' }}
                      size={16}
                      tintColor={image ? colors.navy : colors.accent}
                    />
                  </View>
                  <View style={styles.attachmentText}>
                    <Text style={styles.attachmentName} numberOfLines={2}>
                      {attachment.fileName}
                    </Text>
                    <Text style={styles.attachmentMeta}>{image ? 'Resim' : `Doküman · ${formatFileSize(attachment.fileSize)}`}</Text>
                  </View>
                  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} tintColor={colors.faint} />
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={[styles.item, styles.itemDivider, styles.totalRow]}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text style={styles.totalAmount}>{total}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: space.lg, marginBottom: space.md },
  heading: { color: colors.faint, fontSize: typeScale.small, fontWeight: '600', letterSpacing: 0.6, marginBottom: space.sm, marginLeft: space.xs },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  item: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
  itemDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md },
  type: { flex: 1, color: colors.ink, fontSize: typeScale.body, fontWeight: '600' },
  amount: { flexShrink: 0, color: colors.navy, fontSize: typeScale.body, fontWeight: '700' },
  note: { color: colors.muted, fontSize: typeScale.label + 1, lineHeight: 20 },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.md, backgroundColor: colors.fill },
  attachmentPressed: { opacity: 0.7 },
  attachmentIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconImage: { backgroundColor: '#E3EDF6' },
  iconDoc: { backgroundColor: colors.accentSoft },
  attachmentText: { flex: 1, gap: 1 },
  attachmentName: { color: colors.ink, fontSize: typeScale.label + 1, fontWeight: '500' },
  attachmentMeta: { color: colors.faint, fontSize: typeScale.small },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background },
  totalLabel: { color: colors.muted, fontSize: typeScale.body, fontWeight: '600' },
  totalAmount: { color: colors.navy, fontSize: typeScale.section, fontWeight: '700' },
});
