import { useLocalSearchParams } from 'expo-router';

import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { useExpense } from '@/hooks/useExpense';
import { toUserMessage } from '@/utils/errors';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = typeof id === 'string' ? id : '';
  const query = useExpense(expenseId);
  if (query.isLoading) {
    return <LoadingState label="Kayıt yükleniyor" />;
  }
  if (query.isError || !query.data) {
    return <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />;
  }
  return <ExpenseForm mode="edit" initial={query.data} />;
}
