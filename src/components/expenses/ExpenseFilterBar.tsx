import { Column, Row, Text } from '@expo/ui';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { SearchField } from '@/components/expenses/SearchField';
import { SearchScope } from '@/components/expenses/SearchScope';
import { DateField } from '@/components/forms/DateField';
import { SEARCH_MIN_LENGTH } from '@/constants/limits';
import { colors, space, type as typeScale } from '@/constants/theme';
import type { ExpenseFilters } from '@/services/expenses/queryPlan';
import { formatTrDate, isDateRangeValid } from '@/utils/date';

interface ExpenseFilterBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
}

export function ExpenseFilterBar({ filters, onChange }: ExpenseFilterBarProps) {
  const hasDates = Boolean(filters.dateFrom || filters.dateTo);
  const [datesOpen, setDatesOpen] = useState(false);
  const dateError = isDateRangeValid(filters.dateFrom, filters.dateTo) ? undefined : 'Başlangıç tarihi bitişten sonra olamaz.';
  const hasFilters = Boolean(filters.searchText || hasDates);
  const shortQuery = filters.searchText.trim().length > 0 && filters.searchText.trim().length < SEARCH_MIN_LENGTH;

  function clearFilters() {
    setDatesOpen(false);
    onChange({ ...filters, searchText: '', dateFrom: null, dateTo: null });
  }

  return (
    <Column spacing={space.lg} style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl }}>
      <SearchField
        value={filters.searchText}
        onChangeText={(searchText) => onChange({ ...filters, searchText })}
        placeholder={filters.searchField === 'client' ? 'Müvekkil ara' : 'Esas numarası ara'}
      />
      {shortQuery ? <Text textStyle={{ color: colors.faint, fontSize: typeScale.small }}>Arama için en az 2 karakter yazın.</Text> : null}
      <SearchScope value={filters.searchField} onChange={(searchField) => onChange({ ...filters, searchField })} />
      <Row spacing={space.lg} alignment="center">
        <Button label={dateLabel(filters.dateFrom, filters.dateTo)} variant="secondary" onPress={() => setDatesOpen((current) => !current)} />
        {hasFilters ? <Button variant="ghost" label="Temizle" onPress={clearFilters} /> : null}
      </Row>
      {datesOpen ? (
        <Column spacing={space.md}>
          <DateField label="Başlangıç" value={filters.dateFrom ?? ''} onChange={(dateFrom) => onChange({ ...filters, dateFrom })} error={dateError} />
          <DateField label="Bitiş" value={filters.dateTo ?? ''} onChange={(dateTo) => onChange({ ...filters, dateTo })} />
        </Column>
      ) : null}
    </Column>
  );
}

function dateLabel(from: string | null, to: string | null): string {
  if (from && to) {
    return `${formatTrDate(from)} – ${formatTrDate(to)}`;
  }
  if (from) {
    return `${formatTrDate(from)} sonrası`;
  }
  if (to) {
    return `${formatTrDate(to)} öncesi`;
  }
  return 'Tarih';
}
