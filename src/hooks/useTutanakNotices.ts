import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import { listTutanakNotices, loadNoticeReadAt } from '@/services/tutanak/tutanakNoticeService';

export function useTutanakNotices() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  return useQuery({
    queryKey: ['tutanak-notices', uid],
    enabled: Boolean(user),
    queryFn: () => listTutanakNotices(uid),
  });
}

export function useHasUnreadNotices(): boolean {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const notices = useTutanakNotices();
  const read = useQuery({
    queryKey: ['notice-read', uid],
    enabled: Boolean(user),
    queryFn: () => loadNoticeReadAt(uid),
  });

  const refetchNotices = notices.refetch;
  const refetchRead = read.refetch;
  const refresh = useCallback(() => {
    void refetchNotices();
    void refetchRead();
  }, [refetchNotices, refetchRead]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          refresh();
        }
      });
      return () => subscription.remove();
    }, [refresh]),
  );

  const lastReadAt = read.data ?? '';
  return (notices.data ?? []).some((notice) => notice.createdAt > lastReadAt);
}
