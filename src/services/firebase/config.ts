import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  type Persistence,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import { type Firestore, getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { type Functions, connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { Platform } from 'react-native';

import { AppError, errorCode } from '@/utils/errors';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const FUNCTIONS_REGION = 'europe-west1';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function emulatorHost(): string {
  if (process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST) {
    return process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  }
  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
}

function createAuth(firebaseApp: FirebaseApp): Auth {
  try {
    if (Platform.OS === 'web') {
      return getAuth(firebaseApp);
    }
    const authModule = require('firebase/auth') as {
      getReactNativePersistence: (storage: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
      }) => Persistence;
    };
    return initializeAuth(firebaseApp, {
      persistence: authModule.getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (errorCode(error) === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; functions: Functions } {
  if (!isFirebaseConfigured()) {
    throw new AppError(
      'Firebase yapılandırması eksik. .env dosyasını .env.example üzerinden doldurun.',
      'app/config',
    );
  }
  if (!app || !auth || !db || !functions) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = createAuth(app);
    try {
      db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
      });
    } catch (error) {
      if (errorCode(error) !== 'failed-precondition') {
        throw error;
      }
      db = getFirestore(app);
    }
    functions = getFunctions(app, FUNCTIONS_REGION);
    if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === '1') {
      const host = emulatorHost();
      try {
        connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
        connectFirestoreEmulator(db, host, 8080);
        connectFunctionsEmulator(functions, host, 5001);
      } catch (error) {
        if (!errorCode(error).includes('already')) {
          throw error;
        }
      }
    }
  }
  return { app, auth, db, functions };
}

export function tryGetFirestore(): Firestore {
  try {
    return getFirebase().db;
  } catch (error) {
    if (errorCode(error) === 'failed-precondition') {
      return getFirestore();
    }
    throw error;
  }
}
