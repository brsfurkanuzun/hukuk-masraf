import { Column, Row, Text } from '@expo/ui';

import { Button } from '@/components/common/Button';
import { SearchField } from '@/components/expenses/SearchField';
import { SearchScope } from '@/components/expenses/SearchScope';
import { SEARCH_MIN_LENGTH } from '@/constants/limits';
import { colors, space, type as typeScale } from '@/constants/theme';
import type { DosyaFilters } from '@/services/dosyalar/dosyaQueryPlan';
import type { SearchField as SearchFieldMode } from '@/services/expenses/queryPlan';

interface DosyaFilterBarProps {
  filters: DosyaFilters;
  onChange: (filters: DosyaFilters) => void;
}

export function DosyaFilterBar({ filters, onChange }: DosyaFilterBarProps) {
  const shortQuery = filters.searchText.trim().length > 0 && filters.searchText.trim().length < SEARCH_MIN_LENGTH;

  return (
    <Column spacing={space.lg} style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl }}>
      <SearchField
        value={filters.searchText}
        onChangeText={(searchText) => onChange({ ...filters, searchText })}
        placeholder={filters.searchField === 'client' ? 'Müvekkil ara' : 'Esas numarası ara'}
      />
      {shortQuery ? <Text textStyle={{ color: colors.faint, fontSize: typeScale.small }}>Arama için en az 2 karakter yazın.</Text> : null}
      <Row spacing={space.md} alignment="center">
        <SearchScope value={filters.searchField as SearchFieldMode} onChange={(searchField) => onChange({ ...filters, searchField: searchField as DosyaFilters['searchField'] })} />
        {filters.searchText ? <Button variant="ghost" label="Temizle" onPress={() => onChange({ ...filters, searchText: '' })} /> : null}
      </Row>
    </Column>
  );
}
