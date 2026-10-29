import { Column, Row, Text } from '@expo/ui';

import type { Dosya } from '@/models/dosya';
import { colors, radius, space, type as typeScale } from '@/constants/theme';

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) {
    return null;
  }
  return (
    <Row spacing={space.md} alignment="top" style={{ paddingVertical: space.xs }}>
      <Text textStyle={{ color: colors.faint, fontSize: typeScale.small, fontWeight: '600', width: 88 }}>{label}</Text>
      <Text textStyle={{ color: colors.ink, fontSize: typeScale.body, flexShrink: 1 }}>{value}</Text>
    </Row>
  );
}

export function DosyaSummary({
  dosya,
  embedded = false,
  showEsasNo = true,
}: {
  dosya: Dosya;
  embedded?: boolean;
  showEsasNo?: boolean;
}) {
  return (
    <Column
      spacing={space.sm}
      style={{
        marginHorizontal: embedded ? 0 : space.lg,
        marginBottom: embedded ? space.md : space.md,
        marginTop: embedded ? 0 : space.sm,
        paddingHorizontal: space.lg,
        paddingVertical: space.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      {showEsasNo ? (
        <>
          <Text textStyle={{ color: colors.faint, fontSize: typeScale.small, fontWeight: '600', letterSpacing: 0.6 }}>ESAS NO</Text>
          <Text textStyle={{ color: colors.navy, fontSize: typeScale.title, fontWeight: '700' }}>{dosya.fileCaseNumber}</Text>
        </>
      ) : null}
      <Column
        spacing={0}
        style={{
          marginTop: showEsasNo ? space.sm : 0,
          paddingTop: showEsasNo ? space.sm : 0,
          borderTopWidth: showEsasNo ? 1 : 0,
          borderTopColor: colors.line,
        }}
      >
        <DetailRow label="Müvekkil" value={dosya.clientName} />
        <DetailRow label="İcra" value={dosya.enforcementOffice} />
        <DetailRow label="Borçlu" value={dosya.debtorName} />
        <DetailRow label="Talimat" value={dosya.instructionNumber} />
      </Column>
    </Column>
  );
}
