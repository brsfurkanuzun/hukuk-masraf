import { Text } from '@expo/ui';
import { DatePickerDialog } from '@expo/ui/jetpack-compose';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { colors, type as typeScale } from '@/constants/theme';
import { formatTrDate, isoToLocalDate, toIsoDate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  divider?: boolean;
}

export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const date = value ? isoToLocalDate(value) : new Date();
  const shown = value ? formatTrDate(value) : 'Seç';
  return (
    <>
      <Button variant="secondary" label={`${label}: ${shown}`} onPress={() => setOpen(true)} />
      {open ? (
        <DatePickerDialog
          initialDate={date.toISOString()}
          confirmButtonLabel="Tamam"
          dismissButtonLabel="Vazgeç"
          onDateSelected={(selected) => {
            onChange(toIsoDate(selected));
            setOpen(false);
          }}
          onDismissRequest={() => setOpen(false)}
        />
      ) : null}
      {error ? <Text textStyle={{ color: colors.danger, fontSize: typeScale.small }}>{error}</Text> : null}
    </>
  );
}
