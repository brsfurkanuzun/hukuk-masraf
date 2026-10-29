import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { SEARCH_DEBOUNCE_MS } from '@/constants/limits';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/providers/AuthProvider';
import { buildDosyaQueryPlan, emptyDosyaFilters, type DosyaFilters } from '@/services/dosyalar/dosyaQueryPlan';
import type { DosyaCursor } from '@/services/dosyalar/dosyaQueryPlan';
import { getDosya, listAssignedDosyalar } from '@/services/dosyalar/dosyaService';

export function useDosyalar(filters: DosyaFilters = emptyDosyaFilters()) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const debouncedSearch = useDebouncedValue(filters.searchText, SEARCH_DEBOUNCE_MS);
  const plan = useMemo(
    () => buildDosyaQueryPlan({ ...filters, searchText: debouncedSearch }),
    [filters.searchField, debouncedSearch],
  );
  const query = useInfiniteQuery({
    queryKey: ['dosyalar', uid, 'assigned', plan],
    enabled: Boolean(user),
    initialPageParam: null as DosyaCursor | null,
    staleTime: 5 * 60 * 1000,
    queryFn: ({ pageParam }) => listAssignedDosyalar(uid, plan, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const items = useMemo(() => {
    const flat = query.data?.pages.flatMap((page) => page.items) ?? [];
    const seen = new Set<string>();
    return flat.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [query.data]);
  return { ...query, items, plan, debouncedSearch };
}

export function useDosya(dosyaId: string) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  return useQuery({
    queryKey: ['dosya', uid, dosyaId],
    enabled: Boolean(user && dosyaId),
    staleTime: 5 * 60 * 1000,
    queryFn: () => getDosya(uid, dosyaId),
  });
}

export function useRefreshDosyalar(plan: ReturnType<typeof buildDosyaQueryPlan>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return async () => {
    if (!user) {
      return;
    }
    await queryClient.resetQueries({ queryKey: ['dosyalar', user.uid, 'assigned', plan], exact: true });
  };
}

export type { DosyaFilters };
