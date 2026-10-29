import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { SEARCH_DEBOUNCE_MS } from '@/constants/limits';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/providers/AuthProvider';
import { dedupeExpenses } from '@/services/expenses/cacheUpdates';
import { listExpenses } from '@/services/expenses/expenseService';
import { buildQueryPlan, type ExpenseCursor, type ExpenseFilters } from '@/services/expenses/queryPlan';
import { isDateRangeValid } from '@/utils/date';

export function useExpenses(filters: ExpenseFilters) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const debouncedSearch = useDebouncedValue(filters.searchText, SEARCH_DEBOUNCE_MS);
  const plan = useMemo(
    () =>
      buildQueryPlan({
        searchField: filters.searchField,
        searchText: debouncedSearch,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
    [filters.searchField, filters.dateFrom, filters.dateTo, debouncedSearch],
  );
  const dateRangeValid = isDateRangeValid(filters.dateFrom, filters.dateTo);
  const query = useInfiniteQuery({
    queryKey: ['expenses', uid, 'list', plan],
    enabled: Boolean(user) && dateRangeValid,
    initialPageParam: null as ExpenseCursor | null,
    staleTime: 5 * 60 * 1000,
    queryFn: ({ pageParam }) => listExpenses(uid, plan, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  const items = useMemo(() => dedupeExpenses(query.data?.pages.flatMap((page) => page.items) ?? []), [query.data]);
  return { ...query, items, plan, debouncedSearch, dateRangeValid };
}

export function useRefreshExpenses(plan: ReturnType<typeof buildQueryPlan>) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return async () => {
    if (!user) {
      return;
    }
    await queryClient.resetQueries({ queryKey: ['expenses', user.uid, 'list', plan], exact: true });
  };
}
