import { collection, doc, getDocFromServer, getDocsFromServer, limit, orderBy, query, setDoc, writeBatch, type DocumentData } from 'firebase/firestore';

import type { AttachmentMeta } from '@/models/expense';
import type { Tutanak } from '@/models/tutanak';
import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';

export async function listTutanaklar(dosyaId: string): Promise<Tutanak[]> {
  const snapshot = await getDocsFromServer(
    query(collection(getFirebase().db, 'dosyalar', dosyaId, 'tutanaklar'), orderBy('tutanakDate', 'desc'), limit(50)),
  );
  recordDocumentReads(snapshot.size);
  return snapshot.docs.flatMap((item) => {
    const mapped = mapTutanak(item.id, dosyaId, item.data());
    return mapped ? [mapped] : [];
  });
}

export async function getTutanak(dosyaId: string, tutanakId: string): Promise<Tutanak | null> {
  const snapshot = await getDocFromServer(doc(getFirebase().db, 'dosyalar', dosyaId, 'tutanaklar', tutanakId));
  recordDocumentReads(1);
  if (!snapshot.exists()) {
    return null;
  }
  return mapTutanak(snapshot.id, dosyaId, snapshot.data());
}

export async function saveTutanak(dosyaId: string, tutanak: Tutanak): Promise<void> {
  await setDoc(doc(getFirebase().db, 'dosyalar', dosyaId, 'tutanaklar', tutanak.id), tutanakPayload(tutanak));
}

export async function saveTutanaklar(dosyaId: string, records: Tutanak[]): Promise<void> {
  const batch = writeBatch(getFirebase().db);
  for (const tutanak of records) {
    batch.set(doc(getFirebase().db, 'dosyalar', dosyaId, 'tutanaklar', tutanak.id), tutanakPayload(tutanak));
  }
  await batch.commit();
}

function mapTutanak(id: string, dosyaId: string, data: DocumentData): Tutanak | null {
  if (typeof data.ownerId !== 'string' || typeof data.tutanakDate !== 'string' || typeof data.content !== 'string') {
    return null;
  }
  return {
    id,
    dosyaId,
    ownerId: data.ownerId,
    userId: typeof data.userId === 'string' ? data.userId : '',
    tutanakDate: data.tutanakDate,
    content: data.content,
    attachments: Array.isArray(data.attachments) ? (data.attachments as AttachmentMeta[]) : [],
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
  };
}

function tutanakPayload(tutanak: Tutanak) {
  return {
    ownerId: tutanak.ownerId,
    userId: tutanak.userId,
    tutanakDate: tutanak.tutanakDate,
    content: tutanak.content,
    attachments: tutanak.attachments,
    createdAt: tutanak.createdAt,
    updatedAt: tutanak.updatedAt,
  };
}
