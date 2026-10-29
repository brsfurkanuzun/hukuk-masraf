import { useLocalSearchParams } from 'expo-router';

import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { useDosya } from '@/hooks/useDosyalar';
import { useExpense } from '@/hooks/useExpense';
import { toUserMessage } from '@/utils/errors';

export default function EditDosyaExpenseScreen() {
  const { dosyaId: rawDosyaId, id } = useLocalSearchParams<{ dosyaId: string; id: string }>();
  const dosyaId = typeof rawDosyaId === 'string' ? rawDosyaId : '';
  const expenseId = typeof id === 'string' ? id : '';
  const dosyaQuery = useDosya(dosyaId);
  const expenseQuery = useExpense(dosyaId, expenseId);
  if (dosyaQuery.isLoading || expenseQuery.isLoading) {
    return <LoadingState label="Kayıt yükleniyor" />;
  }
  if (dosyaQuery.isError || !dosyaQuery.data) {
    return <ErrorState message={toUserMessage(dosyaQuery.error)} onRetry={() => void dosyaQuery.refetch()} />;
  }
  if (expenseQuery.isError || !expenseQuery.data) {
    return <ErrorState message={toUserMessage(expenseQuery.error)} onRetry={() => void expenseQuery.refetch()} />;
  }
  return <ExpenseForm mode="edit" dosya={dosyaQuery.data} initial={expenseQuery.data} />;
}
