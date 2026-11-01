import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type as typeScale } from '@/constants/theme';

export interface HeroStat {
  label: string;
  value: string;
  /** Satırdaki genişlik payı (varsayılan 1). Tutar gibi uzun değerlere daha büyük pay verilir. */
  weight?: number;
}

export interface DosyaHeroInfo {
  debtorName: string;
  fileCaseNumber: string;
  clientName: string;
  enforcementOffice?: string;
  instructionNumber?: string;
  note?: string;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/**
 * Ortak üst kart: dosya/masraf/tutanak ekranlarında aynı lacivert alan. Borçlu adı, Esas no ve müvekkil rozetleri,
 * icra dairesi / talimat no / not satırları ve (varsa) özet kutuları hepsi mavi alanın içinde durur.
 */
export function DosyaHeroCard({ info, stats = [], embedded = false }: { info: DosyaHeroInfo; stats?: HeroStat[]; embedded?: boolean }) {
  const note = info.note?.trim() ?? '';
  const chips = [
    info.fileCaseNumber.trim() ? `Esas ${info.fileCaseNumber.trim()}` : '',
    info.clientName.trim(),
    info.enforcementOffice?.trim() ? info.enforcementOffice.trim() : '',
    info.instructionNumber?.trim() ? `Talimat ${info.instructionNumber.trim()}` : '',
  ].filter((text) => text.length > 0);

  return (
    <View style={[styles.card, embedded && styles.cardEmbedded]}>
      <Text style={styles.kicker}>BORÇLU</Text>
      <Text style={styles.title}>
        {info.debtorName.trim() || 'Borçlu belirtilmemiş'}
      </Text>
      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map((text) => (
            <View key={text} style={styles.chip}>
              <Text style={styles.chipText}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {note ? <Detail label="Not" value={note} /> : null}
      {stats.length > 0 ? (
        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.stat, { flex: stat.weight ?? 1 }]}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space.lg,
    marginTop: space.xs,
    marginBottom: space.md,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    gap: space.xs,
  },
  cardEmbedded: { marginHorizontal: 0, marginTop: 0, marginBottom: 0 },
  kicker: { color: 'rgba(255, 255, 255, 0.65)', fontSize: typeScale.small, fontWeight: '600', letterSpacing: 0.8 },
  title: { color: colors.onNavy, fontSize: typeScale.title, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  chip: { maxWidth: '100%', flexShrink: 1, paddingHorizontal: space.md, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.14)' },
  chipText: { flexShrink: 1, color: colors.onNavy, fontSize: typeScale.label, fontWeight: '500', lineHeight: 18 },
  detail: { gap: 1, marginTop: space.md },
  detailLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: typeScale.small, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  detailValue: { color: colors.onNavy, fontSize: typeScale.label + 1, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  stat: {
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    gap: 2,
  },
  statValue: { color: colors.onNavy, fontSize: typeScale.label + 2, fontWeight: '700' },
  statLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: typeScale.small, fontWeight: '500' },
});
