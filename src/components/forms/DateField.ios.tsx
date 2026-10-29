import { Text } from '@expo/ui';
import { DatePicker } from '@expo/ui/swift-ui';
import { datePickerStyle } from '@expo/ui/swift-ui/modifiers';

import { colors, type as typeScale } from '@/constants/theme';
import { isoToLocalDate, toIsoDate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  divider?: boolean;
}

export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const date = value ? isoToLocalDate(value) : new Date();
  return (
    <>
      <DatePicker title={label} selection={date} displayedComponents={['date']} onDateChange={(next) => onChange(toIsoDate(next))} modifiers={[datePickerStyle('compact')]} />
      {error ? <Text textStyle={{ color: colors.danger, fontSize: typeScale.small }}>{error}</Text> : null}
    </>
  );
}
