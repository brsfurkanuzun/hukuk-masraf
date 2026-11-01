import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';
import {
  listTutanakNotices,
  loadNoticeReadAt,
  loadReadNoticeIds,
  markNoticeRead,
  type TutanakNotice,
} from '@/services/tutanak/tutanakNoticeService';
import { logError } from '@/utils/errors';

/** Ana ekrandaki zil işareti için: yeni bildirim gelince ekran yeniden odaklanmasa da güncellenir. */
const UNREAD_POLL_MS = 30_000;

export function useTutanakNotices() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  return useQuery({
    queryKey: ['tutanak-notices', uid],
    enabled: Boolean(user),
    queryFn: () => listTutanakNotices(uid),
  });
}

/**
 * Okundu bilgisi: bildirim, kullanıcı ona dokununca okunur (readIds). Eski sürümde ekran açılınca
 * kaydedilen zaman (lastReadAt) geriye dönük olarak okunmuş sayılır.
 */
function useReadData(uid: string, enabled: boolean, poll: boolean) {
  const legacy = useQuery({
    queryKey: ['notice-read', uid],
    enabled,
    queryFn: () => loadNoticeReadAt(uid),
    refetchInterval: poll ? UNREAD_POLL_MS : false,
  });
  const ids = useQuery({
    queryKey: ['notice-read-ids', uid],
    enabled,
    queryFn: () => loadReadNoticeIds(uid),
    refetchInterval: poll ? UNREAD_POLL_MS : false,
  });
  return { legacy, ids };
}

function isUnread(notice: TutanakNotice, lastReadAt: string, readIds: string[]): boolean {
  return notice.createdAt > lastReadAt && !readIds.includes(notice.id);
}

export function useHasUnreadNotices(): boolean {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const notices = useQuery({
    queryKey: ['tutanak-notices', uid],
    enabled: Boolean(user),
    queryFn: () => listTutanakNotices(uid),
    refetchInterval: UNREAD_POLL_MS,
  });
  const { legacy, ids } = useReadData(uid, Boolean(user), true);

  const refetchNotices = notices.refetch;
  const refetchLegacy = legacy.refetch;
  const refetchIds = ids.refetch;
  const refresh = useCallback(() => {
    void refetchNotices();
    void refetchLegacy();
    void refetchIds();
  }, [refetchNotices, refetchLegacy, refetchIds]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          refresh();
        }
      });
      const received = Notifications.addNotificationReceivedListener(() => refresh());
      return () => {
        subscription.remove();
        received.remove();
      };
    }, [refresh]),
  );

  const lastReadAt = legacy.data ?? '';
  const readIds = ids.data ?? [];
  return (notices.data ?? []).some((notice) => isUnread(notice, lastReadAt, readIds));
}

/** Bildirimler ekranı: bildirim bazında okundu durumu ve "okundu işaretle". */
export function useNoticeReadState() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const queryClient = useQueryClient();
  const { legacy, ids } = useReadData(uid, Boolean(user), false);
  const lastReadAt = legacy.data ?? '';
  const readIds = ids.data ?? [];

  const markRead = useCallback(
    (notice: TutanakNotice) => {
      if (!uid || readIds.includes(notice.id)) {
        return;
      }
      queryClient.setQueryData<string[]>(['notice-read-ids', uid], (current) => [...(current ?? []), notice.id]);
      void markNoticeRead(uid, notice.id).catch((error: unknown) => {
        logError('notice-read', error);
        void queryClient.invalidateQueries({ queryKey: ['notice-read-ids', uid] });
      });
    },
    [queryClient, readIds, uid],
  );

  const refetchLegacy = legacy.refetch;
  const refetchIds = ids.refetch;
  const refetch = useCallback(() => {
    void refetchLegacy();
    void refetchIds();
  }, [refetchLegacy, refetchIds]);

  return {
    isUnread: (notice: TutanakNotice) => isUnread(notice, lastReadAt, readIds),
    markRead,
    refetch,
  };
}
