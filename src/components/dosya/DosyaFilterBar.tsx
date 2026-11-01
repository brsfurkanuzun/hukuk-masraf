import { Column, Text } from '@expo/ui';

import { SearchField } from '@/components/expenses/SearchField';
import { SEARCH_MIN_LENGTH } from '@/constants/limits';
import { colors, space, type as typeScale } from '@/constants/theme';
import type { DosyaFilters } from '@/services/dosyalar/dosyaQueryPlan';

interface DosyaFilterBarProps {
  filters: DosyaFilters;
  onChange: (filters: DosyaFilters) => void;
}

export function DosyaFilterBar({ filters, onChange }: DosyaFilterBarProps) {
  const shortQuery = filters.searchText.trim().length > 0 && filters.searchText.trim().length < SEARCH_MIN_LENGTH;

  return (
    <Column spacing={space.sm} style={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg }}>
      <SearchField
        value={filters.searchText}
        onChangeText={(searchText) => onChange({ ...filters, searchField: 'case', searchText })}
        placeholder="Esas no ile dosya ara"
      />
      {shortQuery ? (
        <Text textStyle={{ color: colors.faint, fontSize: typeScale.small }}>{`Aramak için en az ${SEARCH_MIN_LENGTH} karakter yazın.`}</Text>
      ) : null}
    </Column>
  );
}
