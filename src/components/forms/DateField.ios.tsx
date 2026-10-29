import { HStack, Spacer, Text } from '@expo/ui/swift-ui';
import { datePickerStyle, font, foregroundStyle, frame, labelsHidden, padding } from '@expo/ui/swift-ui/modifiers';
import { DatePicker } from '@expo/ui/swift-ui';

import { colors, type as typeScale } from '@/constants/theme';
import { isoToLocalDate, toIsoDate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  divider?: boolean;
  framed?: boolean;
}

export function DateField({ label, value, onChange, error, framed = false }: DateFieldProps) {
  const date = value ? isoToLocalDate(value) : new Date();
  const picker = (
    <DatePicker
      title={framed ? '' : label}
      selection={date}
      displayedComponents={['date']}
      onDateChange={(next) => onChange(toIsoDate(next))}
      modifiers={[datePickerStyle('compact'), ...(framed ? [labelsHidden()] : [])]}
    />
  );
  if (!framed) {
    return (
      <>
        {picker}
        {error ? <Text modifiers={[font({ size: typeScale.small }), foregroundStyle(colors.danger)]}>{error}</Text> : null}
      </>
    );
  }
  return (
    <HStack alignment="center" spacing={12} modifiers={[frame({ maxWidth: Infinity, alignment: 'trailing' }), padding({ horizontal: 16, vertical: 8 })]}>
      <Text modifiers={[font({ size: typeScale.body }), foregroundStyle(colors.ink)]}>{label}</Text>
      <Spacer />
      {picker}
      {error ? <Text modifiers={[font({ size: typeScale.small }), foregroundStyle(colors.danger)]}>{error}</Text> : null}
    </HStack>
  );
}
