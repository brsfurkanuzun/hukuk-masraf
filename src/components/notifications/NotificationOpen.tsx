import { useRouter, type Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

/** Opens the notifications screen when a tutanak push is tapped. */
export function NotificationOpen() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const opened = useRef<string | null>(null);

  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    const data = response.notification.request.content.data;
    if (!data || data.screen !== 'notifications') {
      return;
    }
    const id = response.notification.request.identifier;
    if (opened.current === id) {
      return;
    }
    opened.current = id;
    router.push('/notifications' as Href);
  }, [response, router]);

  return null;
}
