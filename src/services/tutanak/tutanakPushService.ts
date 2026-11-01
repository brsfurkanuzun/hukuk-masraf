import { getFirebase } from '@/services/firebase/config';
import { logError } from '@/utils/errors';

const NOTIFY_TIMEOUT_MS = 10000;

/**
 * Tutanak kaydedildikten sonra web sunucusunu çağırır; sunucu diğer kullanıcılara bildirim gönderir.
 * Hata kaydı bozmaz: bildirim gitmese de tutanak kaydedilmiş olur.
 */
export async function notifyTutanakAdded(dosyaId: string, tutanakId: string): Promise<void> {
  const baseUrl = (process.env.EXPO_PUBLIC_NOTIFY_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (!baseUrl) {
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NOTIFY_TIMEOUT_MS);
  try {
    const idToken = await getFirebase().auth.currentUser?.getIdToken();
    if (!idToken) {
      return;
    }
    const response = await fetch(`${baseUrl}/api/notify/tutanak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ dosyaId, tutanakId }),
      signal: controller.signal,
    });
    if (!response.ok) {
      logError('tutanak-push', new Error(String(response.status)));
    }
  } catch (error) {
    logError('tutanak-push', error);
  } finally {
    clearTimeout(timer);
  }
}
