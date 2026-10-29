import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { signInWithIdentifier, signOutAndClear } from '@/services/auth/authService';
import { flushOrphanAssets } from '@/services/cloudinary/flushOrphans';
import { getFirebase, isFirebaseConfigured } from '@/services/firebase/config';
import { registerPushToken } from '@/services/notifications/pushRegistration';
import { ensureUserProfile } from '@/services/users/userService';
import { logError, toUserMessage } from '@/utils/errors';

interface AuthState {
  ready: boolean;
  configured: boolean;
  user: User | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(getFirebase().auth, (nextUser) => {
      setUser(nextUser);
      setReady(true);
      if (!nextUser) {
        return;
      }
      void ensureUserProfile(nextUser.uid, nextUser.email).catch((error: unknown) => logError('profile', error));
      void registerPushToken(nextUser.uid).catch((error: unknown) => logError('push-register', error));
      void flushOrphanAssets(nextUser.uid).catch((error: unknown) => logError('orphan-flush', error));
    });
  }, [configured]);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      await signInWithIdentifier(username, password);
    } catch (error) {
      throw new Error(toUserMessage(error));
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutAndClear(queryClient);
  }, [queryClient]);

  const value = useMemo(
    () => ({ ready, configured, user, signIn, signOut }),
    [ready, configured, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth AuthProvider içinde kullanılmalı.');
  }
  return value;
}
