import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { getFirebase } from '@/services/firebase/config';
import { nowIso } from '@/utils/date';
import { logError } from '@/utils/errors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registered: { uid: string; tokenId: string } | null = null;

export async function registerPushToken(uid: string): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return;
  }
  const current = await Notifications.getPermissionsAsync();
  const next = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!next.granted) {
    return;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Tutanak',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return;
  }
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token);
  const tokenId = digest.slice(0, 32);
  await setDoc(doc(getFirebase().db, 'users', uid, 'pushTokens', tokenId), {
    expoPushToken: token,
    updatedAt: nowIso(),
  });
  registered = { uid, tokenId };
}

export async function unregisterPushToken(): Promise<void> {
  if (!registered) {
    return;
  }
  const current = registered;
  registered = null;
  try {
    await deleteDoc(doc(getFirebase().db, 'users', current.uid, 'pushTokens', current.tokenId));
  } catch (error) {
    logError('push-unregister', error);
  }
}
