import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { colors, radius, type as typeScale } from '@/constants/theme';
import { formatTrDate, isoToLocalDate, isIsoDate, toIsoDate } from '@/utils/date';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  divider?: boolean;
}

export function DateField({ label, value, onChange, error, divider = false }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [webText, setWebText] = useState(formatTrDate(value));
  const date = value ? isoToLocalDate(value) : new Date();
  const labelValue = value ? formatTrDate(value) : 'Seç';

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    onChange(toIsoDate(selected));
  }

  return (
    <View style={[divider && styles.divider, error ? styles.errorWrap : null]}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {Platform.OS === 'web' ? (
          <TextInput
            accessibilityLabel={label}
            value={webText}
            placeholder="GG.AA.YYYY"
            onChangeText={(text) => {
              setWebText(text);
              const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
              if (!match) {
                return;
              }
              const iso = `${match[3]}-${match[2]}-${match[1]}`;
              if (isIsoDate(iso)) {
                onChange(iso);
              }
            }}
            style={styles.webInput}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${labelValue}`}
            onPress={() => setOpen((current) => !current)}
            style={styles.valueButton}
          >
            <Text style={styles.value}>{labelValue}</Text>
          </Pressable>
        )}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {open && Platform.OS !== 'web' ? (
        <View>
          <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} locale="tr-TR" onChange={handleChange} />
          {Platform.OS === 'ios' ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Tarihi kapat" onPress={() => setOpen(false)} style={styles.done}>
              <Text style={styles.doneLabel}>Tamam</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  errorWrap: { backgroundColor: colors.dangerSoft },
  label: { color: colors.ink, fontSize: typeScale.body, flexShrink: 1 },
  valueButton: { backgroundColor: colors.fill, borderRadius: radius.sm, borderCurve: 'continuous', paddingHorizontal: 12, paddingVertical: 6 },
  value: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
  webInput: { minWidth: 120, textAlign: 'right', color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
  error: { color: colors.danger, fontSize: typeScale.small, paddingHorizontal: 16, paddingBottom: 8 },
  done: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  doneLabel: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
});
