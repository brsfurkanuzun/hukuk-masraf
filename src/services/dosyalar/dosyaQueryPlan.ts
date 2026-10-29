import { SEARCH_MIN_LENGTH } from '@/constants/limits';
import type { Dosya } from '@/models/dosya';
import { normalizeCaseNumber, normalizeSearchText } from '@/utils/text';

export type DosyaSearchField = 'client' | 'case';

export interface DosyaFilters {
  searchField: DosyaSearchField;
  searchText: string;
}

export type DosyaQueryPlan =
  | { mode: 'recent' }
  | { mode: 'client'; prefix: string }
  | { mode: 'case'; prefix: string };

export interface DosyaCursor {
  updatedAt: string;
  clientNameNormalized: string;
  fileCaseNumberNormalized: string;
}

export function emptyDosyaFilters(): DosyaFilters {
  return { searchField: 'client', searchText: '' };
}

export function buildDosyaQueryPlan(filters: DosyaFilters): DosyaQueryPlan {
  const clientPrefix = normalizeSearchText(filters.searchText);
  const casePrefix = normalizeCaseNumber(filters.searchText);
  const prefix = filters.searchField === 'case' ? casePrefix : clientPrefix;
  if (prefix.length >= SEARCH_MIN_LENGTH) {
    return filters.searchField === 'case' ? { mode: 'case', prefix } : { mode: 'client', prefix };
  }
  return { mode: 'recent' };
}

export function orderFieldsForDosya(plan: DosyaQueryPlan): string[] {
  if (plan.mode === 'recent') {
    return ['updatedAt'];
  }
  return [plan.mode === 'client' ? 'clientNameNormalized' : 'fileCaseNumberNormalized', 'updatedAt'];
}

export function prefixUpperBound(prefix: string): string {
  return `${prefix}\uf8ff`;
}

export function cursorValuesForDosya(plan: DosyaQueryPlan, cursor: DosyaCursor): string[] {
  return orderFieldsForDosya(plan).map((field) => {
    if (field === 'updatedAt') {
      return cursor.updatedAt;
    }
    if (field === 'clientNameNormalized') {
      return cursor.clientNameNormalized;
    }
    return cursor.fileCaseNumberNormalized;
  });
}

export function cursorFromDosya(dosya: Dosya): DosyaCursor {
  return {
    updatedAt: dosya.updatedAt,
    clientNameNormalized: dosya.clientNameNormalized,
    fileCaseNumberNormalized: dosya.fileCaseNumberNormalized,
  };
}
