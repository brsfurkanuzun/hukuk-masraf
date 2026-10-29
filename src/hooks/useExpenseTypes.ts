import { useQuery } from '@tanstack/react-query';

import { EXPENSE_TYPE_OPTIONS } from '@/constants/expenseTypes';
import { useAuth } from '@/providers/AuthProvider';
import { loadExpenseTypes } from '@/services/catalog/expenseTypeService';

export function useExpenseTypes() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['expense-types', user?.uid ?? ''],
    enabled: Boolean(user),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    queryFn: loadExpenseTypes,
  });

  return {
    options: query.data ?? EXPENSE_TYPE_OPTIONS,
    isLoading: query.isLoading,
  };
}
