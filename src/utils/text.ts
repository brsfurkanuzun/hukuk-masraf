import { SEARCH_MIN_LENGTH, SUGGESTION_LIMIT } from '@/constants/limits';

export function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}

export function normalizeCaseNumber(value: string): string {
  return value.trim().replace(/\s+/g, '').toLocaleLowerCase('tr-TR');
}

export function prefixUpperBound(prefix: string): string {
  return `${prefix}\uf8ff`;
}

export function uniqueNames(names: string[], limit = SUGGESTION_LIMIT): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      continue;
    }
    const key = normalizeSearchText(trimmed);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

export function namesToAdd(existing: string[], incoming: string[]): string[] {
  const have = new Set(existing.map((name) => normalizeSearchText(name)));
  return uniqueNames(incoming).filter((name) => !have.has(normalizeSearchText(name)));
}

export function filterSuggestions(options: string[], query: string, limit = 8): string[] {
  const normalized = normalizeSearchText(query);
  if (normalized.length < 1) {
    return [];
  }
  return options.filter((option) => normalizeSearchText(option).includes(normalized)).slice(0, limit);
}

export function isSearchReady(value: string): boolean {
  return normalizeSearchText(value).length >= SEARCH_MIN_LENGTH || normalizeCaseNumber(value).length >= SEARCH_MIN_LENGTH;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
