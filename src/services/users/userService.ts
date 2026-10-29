import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';

import { SUGGESTION_LIMIT } from '@/constants/limits';
import type { SuggestionLists } from '@/models/expense';
import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';
import { namesToAdd, uniqueNames } from '@/utils/text';
import { nowIso } from '@/utils/date';

const EMPTY: SuggestionLists = { enforcementOffices: [], clientNames: [] };

function suggestionsDoc(uid: string) {
  return doc(getFirebase().db, 'users', uid, 'meta', 'suggestions');
}

export async function loadSuggestions(uid: string): Promise<SuggestionLists> {
  const snapshot = await getDocFromServer(suggestionsDoc(uid));
  recordDocumentReads(1);
  if (!snapshot.exists()) {
    return EMPTY;
  }
  const data = snapshot.data();
  return {
    enforcementOffices: uniqueNames(Array.isArray(data.enforcementOffices) ? data.enforcementOffices : []),
    clientNames: uniqueNames(Array.isArray(data.clientNames) ? data.clientNames : []),
  };
}

export async function rememberSuggestions(uid: string, current: SuggestionLists, incoming: SuggestionLists): Promise<SuggestionLists> {
  const offices = namesToAdd(current.enforcementOffices, incoming.enforcementOffices);
  const clients = namesToAdd(current.clientNames, incoming.clientNames);
  if (current.enforcementOffices.length >= SUGGESTION_LIMIT) {
    offices.length = 0;
  }
  if (current.clientNames.length >= SUGGESTION_LIMIT) {
    clients.length = 0;
  }
  if (offices.length === 0 && clients.length === 0) {
    return current;
  }
  await setDoc(suggestionsDoc(uid), {
    enforcementOffices: uniqueNames([...current.enforcementOffices, ...offices]),
    clientNames: uniqueNames([...current.clientNames, ...clients]),
    updatedAt: nowIso(),
  });
  return {
    enforcementOffices: uniqueNames([...current.enforcementOffices, ...offices]),
    clientNames: uniqueNames([...current.clientNames, ...clients]),
  };
}

export interface UserName {
  firstName: string;
  lastName: string;
}

export async function loadUserName(uid: string): Promise<UserName> {
  const snapshot = await getDocFromServer(doc(getFirebase().db, 'users', uid));
  recordDocumentReads(1);
  if (!snapshot.exists()) {
    return { firstName: '', lastName: '' };
  }
  const data = snapshot.data();
  const firstName = textField(data.firstName);
  const lastName = textField(data.lastName);
  if (firstName || lastName) {
    return { firstName, lastName };
  }
  const displayName = textField(data.displayName);
  if (!displayName || displayName.includes('@') || !displayName.includes(' ')) {
    return { firstName: '', lastName: '' };
  }
  const [first = '', ...rest] = displayName.split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
}

export function formatLawyerName(name: UserName): string {
  const full = [name.firstName, name.lastName]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(' ');
  if (!full) {
    return 'AV.';
  }
  return `AV. ${full.toLocaleUpperCase('tr-TR')}`;
}

function textField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const PROFILE_FLAG = '@hukuk-masraf/profile-written';

export async function ensureUserProfile(uid: string, email: string | null): Promise<void> {
  const flagKey = `${PROFILE_FLAG}:${uid}`;
  const existing = await AsyncStorage.getItem(flagKey);
  if (existing === '1') {
    return;
  }
  const reference = doc(getFirebase().db, 'users', uid);
  const snapshot = await getDocFromServer(reference);
  recordDocumentReads(1);
  if (!snapshot.exists()) {
    const safeEmail = email ?? '';
    await setDoc(reference, {
      email: safeEmail,
      displayName: safeEmail,
      createdAt: nowIso(),
    });
  }
  await AsyncStorage.setItem(flagKey, '1');
}

export async function clearProfileFlag(uid: string): Promise<void> {
  await AsyncStorage.removeItem(`${PROFILE_FLAG}:${uid}`);
}
