import { collection, doc, getDocFromServer, getDocsFromServer, limit, orderBy, query, setDoc } from 'firebase/firestore';

import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';
import { nowIso } from '@/utils/date';

export interface TutanakNotice {
  id: string;
  kind: 'tutanak' | 'dosya';
  dosyaId: string;
  actorId: string;
  actorName: string;
  debtorName: string;
  createdAt: string;
}

export async function listTutanakNotices(uid: string): Promise<TutanakNotice[]> {
  const snapshot = await getDocsFromServer(
    query(collection(getFirebase().db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50)),
  );
  recordDocumentReads(snapshot.size);
  return snapshot.docs
    .flatMap((item) => {
      const data = item.data();
      if (typeof data.dosyaId !== 'string' || typeof data.createdAt !== 'string') {
        return [];
      }
      const kind = data.kind === 'dosya' ? 'dosya' : 'tutanak';
      if (kind === 'tutanak' && typeof data.actorName !== 'string') {
        return [];
      }
      return [
        {
          id: item.id,
          kind,
          dosyaId: data.dosyaId,
          actorId: typeof data.actorId === 'string' ? data.actorId : '',
          actorName: typeof data.actorName === 'string' ? data.actorName : '',
          debtorName: typeof data.debtorName === 'string' ? data.debtorName : '',
          createdAt: data.createdAt,
        },
      ];
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function loadNoticeReadAt(uid: string): Promise<string> {
  const snapshot = await getDocFromServer(doc(getFirebase().db, 'users', uid, 'meta', 'noticeState'));
  recordDocumentReads(1);
  const value = snapshot.data()?.lastReadAt;
  return typeof value === 'string' ? value : '';
}

export async function markNoticesRead(uid: string): Promise<void> {
  await setDoc(doc(getFirebase().db, 'users', uid, 'meta', 'noticeState'), { lastReadAt: nowIso() });
}
