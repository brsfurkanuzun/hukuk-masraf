import { ListItem, Text } from '@expo/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { ExpenseFilterBar } from '@/components/expenses/ExpenseFilterBar';
import { HomeToolbar } from '@/components/home/HomeToolbar';
import { FittingList } from '@/components/native/FittingList';
import { ScreenHost } from '@/components/native/ScreenHost';
import { colors, type as typeScale } from '@/constants/theme';
import { useExpenses, useRefreshExpenses } from '@/hooks/useExpenses';
import { useLawyerHeading } from '@/hooks/useLawyerHeading';
import { useAuth } from '@/providers/AuthProvider';
import { displayTotalKurus } from '@/services/expenses/mapExpense';
import { emptyFilters, type ExpenseFilters } from '@/services/expenses/queryPlan';
import { formatTrDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';
import { formatKurus } from '@/utils/money';

export default function ExpenseListScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const heading = useLawyerHeading(user?.uid, user?.displayName);
  const [filters, setFilters] = useState<ExpenseFilters>(emptyFilters());
  const query = useExpenses(filters);
  const refresh = useRefreshExpenses(query.plan);
  const items = query.dateRangeValid && !query.isLoading && !query.isError ? query.items : [];

  return (
    <ScreenHost fill>
      <FittingList
        onRefresh={async () => {
          await refresh();
        }}
        header={<HomeToolbar title={heading} onAdd={() => router.push('/expense/new')} />}
        footer={<Button label="Çıkış yap" variant="danger" onPress={() => void signOut()} />}
      >
        <ExpenseFilterBar filters={filters} onChange={setFilters} />
        {!query.dateRangeValid ? null : query.isLoading ? (
          <LoadingState label="Masraflar yükleniyor" />
        ) : query.isError ? (
          <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title="Kayıt yok" message="Bu filtreye uygun masraf bulunamadı." />
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              onPress={() => router.push(`/expense/${item.id}`)}
              supportingText={`${formatTrDate(item.expenseDate)} · ${item.fileCaseNumber}`}
              trailing={<Text textStyle={{ color: colors.ink, fontSize: typeScale.body, fontWeight: '600' }}>{formatKurus(displayTotalKurus(item))}</Text>}
            >
              {item.clientName}
            </ListItem>
          ))
        )}
        {query.hasNextPage ? <Button variant="ghost" label={query.isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla'} onPress={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage} /> : null}
      </FittingList>
    </ScreenHost>
  );
}
