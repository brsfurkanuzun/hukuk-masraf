import { ListItem, Text } from '@expo/ui';
import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { DosyaFilterBar } from '@/components/dosya/DosyaFilterBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { HomeToolbar } from '@/components/home/HomeToolbar';
import { FittingList } from '@/components/native/FittingList';
import { ScreenHost } from '@/components/native/ScreenHost';
import { colors } from '@/constants/theme';
import { useDosyalar, useRefreshDosyalar } from '@/hooks/useDosyalar';
import { useLawyerHeading } from '@/hooks/useLawyerHeading';
import { useHasUnreadNotices } from '@/hooks/useTutanakNotices';
import type { Dosya } from '@/models/dosya';
import { useAuth } from '@/providers/AuthProvider';
import { emptyDosyaFilters } from '@/services/dosyalar/dosyaQueryPlan';
import { toUserMessage } from '@/utils/errors';

function groupByClient(items: Dosya[]) {
  const groups = new Map<string, { key: string; name: string; dosyalar: Dosya[] }>();
  for (const item of items) {
    const name = item.clientName.trim() || 'Müvekkilsiz';
    const key = item.clientNameNormalized.trim() || name.toLocaleLowerCase('tr');
    const group = groups.get(key);
    if (group) {
      group.dosyalar.push(item);
    } else {
      groups.set(key, { key, name, dosyalar: [item] });
    }
  }
  return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name, 'tr'));
}

export default function DosyaListScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const heading = useLawyerHeading(user?.uid, user?.displayName);
  const hasUnread = useHasUnreadNotices();
  const [filters, setFilters] = useState(emptyDosyaFilters());
  const query = useDosyalar(filters);
  const refresh = useRefreshDosyalar(query.plan);
  const items = !query.isLoading && !query.isError ? query.items : [];
  const clients = useMemo(() => groupByClient(items), [items]);
  const [openClients, setOpenClients] = useState<string[]>([]);

  return (
    <ScreenHost fill>
      <FittingList
        onRefresh={async () => {
          await refresh();
        }}
        header={<HomeToolbar title={heading} hasUnread={hasUnread} onNotifications={() => router.push('/notifications' as Href)} />}
        footer={<Button label="Çıkış yap" variant="danger" onPress={() => void signOut()} />}
      >
        <DosyaFilterBar filters={filters} onChange={setFilters} />
        {query.isLoading ? (
          <LoadingState label="Dosyalar yükleniyor" />
        ) : query.isError ? (
          <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Atanan dosya yok"
            message={
              user?.uid
                ? `assignedUserIds içinde şu UID olmalı:\n${user.uid}\n\nFirestore’daki dosyada bu UID yoksa veya kurallar güncel değilse liste boş kalır. Profil → UID ile Console’u karşılaştırın.`
                : 'Size atanmış bir dosya bulunamadı.'
            }
          />
        ) : (
          clients.flatMap((client) => {
            const open = openClients.includes(client.key);
            const header = (
              <ListItem
                key={`client-${client.key}`}
                onPress={() =>
                  setOpenClients((current) =>
                    current.includes(client.key) ? current.filter((key) => key !== client.key) : [...current, client.key],
                  )
                }
                supportingText={`${client.dosyalar.length} dosya`}
                trailing={<Text textStyle={{ color: colors.faint, fontSize: 22, fontWeight: '400' }}>{open ? '⌄' : '›'}</Text>}
              >
                {client.name}
              </ListItem>
            );
            if (!open) {
              return [header];
            }
            return [
              header,
              ...client.dosyalar.map((item) => (
                <ListItem
                  key={item.id}
                  onPress={() => router.push(`/dosya/${item.id}` as Href)}
                  supportingText={`Esas No: ${item.fileCaseNumber}${item.enforcementOffice ? ` · ${item.enforcementOffice}` : ''}`}
                  trailing={<Text textStyle={{ color: colors.faint, fontSize: 22, fontWeight: '400' }}>›</Text>}
                >
                  {item.debtorName.trim() || item.fileCaseNumber}
                </ListItem>
              )),
            ];
          })
        )}
        {query.hasNextPage ? <Button variant="ghost" label={query.isFetchingNextPage ? 'Yükleniyor…' : 'Daha fazla'} onPress={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage} /> : null}
      </FittingList>
    </ScreenHost>
  );
}
