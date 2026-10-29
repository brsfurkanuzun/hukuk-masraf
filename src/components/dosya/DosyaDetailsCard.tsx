import { DetailRowsCard } from '@/components/common/DetailRowsCard';
import type { Dosya } from '@/models/dosya';

export function DosyaDetailsCard({ dosya }: { dosya: Dosya }) {
  return (
    <DetailRowsCard
      heading="Dosya bilgileri"
      rows={[
        { label: 'Esas no', value: dosya.fileCaseNumber },
        { label: 'Müvekkil', value: dosya.clientName },
        { label: 'İcra dairesi', value: dosya.enforcementOffice },
        { label: 'Borçlu', value: dosya.debtorName },
        { label: 'Talimat no', value: dosya.instructionNumber },
      ]}
    />
  );
}
