import { signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import type { QueryClient } from '@tanstack/react-query';

import { resolveLoginEmail } from '@/services/auth/usernameService';
import { normalizeUsername } from '@/utils/username';
import { flushOrphanAssets, resetOrphanFlushGuard } from '@/services/cloudinary/flushOrphans';
import { unregisterPushToken } from '@/services/notifications/pushRegistration';
import { getFirebase } from '@/services/firebase/config';
import { resetDocumentReadCount } from '@/services/firebase/readCounter';
import { logError } from '@/utils/errors';

export async function signInWithIdentifier(identifier: string, password: string): Promise<User> {
  const email = await resolveLoginEmail(identifier);
  const credential = await signInWithEmailAndPassword(getFirebase().auth, email, password);
  if (!identifier.includes('@')) {
    const username = normalizeUsername(identifier);
    if (credential.user.displayName !== username) {
      try {
        await updateProfile(credential.user, { displayName: username });
      } catch (error) {
        logError('display-name', error);
      }
    }
  }
  return credential.user;
}

export async function signOutAndClear(queryClient: QueryClient): Promise<void> {
  const uid = getFirebase().auth.currentUser?.uid;
  if (uid) {
    try {
      await flushOrphanAssets(uid, { force: true });
    } catch (error) {
      logError('sign-out-flush', error);
    }
    await unregisterPushToken();
  }
  queryClient.cancelQueries();
  queryClient.clear();
  resetDocumentReadCount();
  resetOrphanFlushGuard();
  await signOut(getFirebase().auth);
}
