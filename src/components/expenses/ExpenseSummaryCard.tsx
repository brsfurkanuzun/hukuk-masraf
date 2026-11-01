import { DosyaHeroCard } from '@/components/dosya/DosyaHeroCard';

export interface ExpenseSummary {
  debtorName: string;
  fileCaseNumber: string;
  clientName: string;
  date: string;
  total: string;
  itemCount: number;
  enforcementOffice: string;
  instructionNumber: string;
  note: string;
}

/** Masraf ekranlarının üst kartı: ortak lacivert kart + tarih / toplam / kalem özeti. */
export function ExpenseSummaryCard({ summary, embedded = false }: { summary: ExpenseSummary; embedded?: boolean }) {
  return (
    <DosyaHeroCard
      embedded={embedded}
      info={{
        debtorName: summary.debtorName,
        fileCaseNumber: summary.fileCaseNumber,
        clientName: summary.clientName,
        enforcementOffice: summary.enforcementOffice,
        instructionNumber: summary.instructionNumber,
        note: summary.note,
      }}
      stats={[
        { label: 'Tarih', value: summary.date, weight: 1.2 },
        { label: 'Toplam masraf', value: summary.total, weight: 2 },
        { label: 'Kalem', value: String(summary.itemCount), weight: 0.8 },
      ]}
    />
  );
}
