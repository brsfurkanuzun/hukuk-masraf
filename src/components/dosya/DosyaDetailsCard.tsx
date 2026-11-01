import { DosyaHeroCard, type HeroStat } from '@/components/dosya/DosyaHeroCard';
import type { Dosya } from '@/models/dosya';

export type DosyaStat = HeroStat;

export function DosyaDetailsCard({ dosya, stats = [] }: { dosya: Dosya; stats?: DosyaStat[] }) {
  return (
    <DosyaHeroCard
      info={{
        debtorName: dosya.debtorName,
        fileCaseNumber: dosya.fileCaseNumber,
        clientName: dosya.clientName,
        enforcementOffice: dosya.enforcementOffice,
        instructionNumber: dosya.instructionNumber,
      }}
      stats={stats}
    />
  );
}
