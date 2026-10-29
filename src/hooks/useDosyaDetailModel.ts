import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import type { AddMenuItem } from '@/components/common/AddMenuAnchor.types';
import { useDosya } from '@/hooks/useDosyalar';
import { useExpenses, useRefreshExpenses } from '@/hooks/useExpenses';
import { useRefreshTutanaklar, useTutanaklar } from '@/hooks/useTutanaklar';
import { emptyFilters } from '@/services/expenses/queryPlan';
import { toUserMessage } from '@/utils/errors';

export function useDosyaDetailModel(dosyaId: string) {
  const router = useRouter();
  const dosyaQuery = useDosya(dosyaId);
  const dosya = dosyaQuery.data;
  const filters = useMemo(() => emptyFilters(), []);
  const query = useExpenses(dosyaId, filters);
  const tutanakQuery = useTutanaklar(dosyaId);
  const refresh = useRefreshExpenses(dosyaId, query.plan);
  const refreshTutanaklar = useRefreshTutanaklar(dosyaId);
  const items = !query.isLoading && !query.isError ? query.items : [];
  const tutanaklar = !tutanakQuery.isLoading && !tutanakQuery.isError ? (tutanakQuery.data ?? []) : [];
  const [refreshing, setRefreshing] = useState(false);

  const addMenuItems = useMemo<AddMenuItem[]>(
    () => [
      { label: 'Masraf Ekle', onPress: () => router.push(`/dosya/${dosyaId}/expense/new` as Href) },
      { label: 'Tutanak Ekle', onPress: () => router.push(`/dosya/${dosyaId}/tutanak/new` as Href) },
    ],
    [dosyaId, router],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      await refreshTutanaklar();
      await dosyaQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [dosyaQuery, refresh, refreshTutanaklar]);

  const openExpense = useCallback(
    (expenseId: string) => {
      router.push(`/dosya/${dosyaId}/expense/${expenseId}` as Href);
    },
    [dosyaId, router],
  );

  const listReady = !query.isLoading && !query.isError;
  const topTitle = dosya ? dosya.debtorName.trim() || dosya.fileCaseNumber : '';

  return {
    dosyaQuery,
    dosya,
    query,
    tutanakQuery,
    items,
    tutanaklar,
    refreshing,
    onRefresh,
    addMenuItems,
    openExpense,
    listReady,
    topTitle,
    errorMessage: toUserMessage(dosyaQuery.error ?? query.error),
    router,
  };
}

export type DosyaDetailModel = ReturnType<typeof useDosyaDetailModel>;
