import { doc, getDocFromServer } from 'firebase/firestore';

import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';
import { AppError, errorCode } from '@/utils/errors';
import { assertUsername } from '@/utils/username';

export { assertUsername, normalizeUsername } from '@/utils/username';

export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const username = assertUsername(trimmed);
  const ref = doc(getFirebase().db, 'usernames', username);
  let snap;
  try {
    snap = await getDocFromServer(ref);
  } catch (error) {
    if (errorCode(error).endsWith('permission-denied')) {
      throw new AppError(
        'Kullanıcı adı eşlemesi okunamadı. Firestore kurallarını yayınlayıp kullanıcı belgesini oluşturun.',
        'app/username-rules',
      );
    }
    throw error;
  }
  recordDocumentReads(1);
  const email = snap.exists() ? snap.get('email') : '';
  if (typeof email !== 'string' || !email.includes('@')) {
    throw new AppError('Kullanıcı adı bulunamadı.', 'app/username-not-found');
  }
  return email.trim();
}
