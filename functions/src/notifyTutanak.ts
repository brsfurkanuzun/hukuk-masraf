import { getFirestore, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const notifyTutanakCreated = onDocumentCreated(
  {
    document: 'dosyalar/{dosyaId}/tutanaklar/{tutanakId}',
    region: 'europe-west1',
  },
  async (event) => {
    const dosyaId = event.params.dosyaId;
    const created = event.data?.data();
    const actorId = text(created?.userId);
    const db = getFirestore();
    const dosyaSnap = await db.doc(`dosyalar/${dosyaId}`).get();
    if (!dosyaSnap.exists) {
      return;
    }
    const dosya = dosyaSnap.data() ?? {};
    const recipients = await otherUserIds(db, actorId);
    if (recipients.length === 0) {
      return;
    }
    const actorSnap = actorId ? await db.doc(`users/${actorId}`).get() : null;
    const actorName = lawyerName(actorSnap?.data());
    const debtorName = text(dosya.debtorName);
    const body = tutanakNotice(actorName, debtorName);
    const createdAt = text(created?.createdAt) || new Date().toISOString();
    const batch = db.batch();
    for (const uid of recipients) {
      batch.set(db.doc(`users/${uid}/notifications/${event.params.tutanakId}`), {
        dosyaId,
        actorId,
        actorName,
        debtorName,
        createdAt,
      });
    }
    await batch.commit();
    const tokens = await pushTokens(db, recipients);
    if (tokens.length === 0) {
      return;
    }
    await sendPush(tokens, 'Yeni tutanak', body, dosyaId);
  },
);

const DOSYA_ASSIGNED = 'Kullanıcınıza dosya tanımlanmıştır';

export const notifyDosyaAssigned = onDocumentUpdated(
  {
    document: 'dosyalar/{dosyaId}',
    region: 'europe-west1',
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const added = userIds(after?.assignedUserIds).filter((id) => !userIds(before?.assignedUserIds).includes(id));
    if (added.length === 0) {
      return;
    }
    const dosyaId = event.params.dosyaId;
    const debtorName = text(after?.debtorName);
    const createdAt = new Date().toISOString();
    const db = getFirestore();
    const batch = db.batch();
    for (const uid of added) {
      batch.set(db.doc(`users/${uid}/notifications/${dosyaId}-${Date.now()}`), {
        kind: 'dosya',
        dosyaId,
        actorId: '',
        actorName: '',
        debtorName,
        createdAt,
      });
    }
    await batch.commit();
    const tokens = await pushTokens(db, added);
    if (tokens.length === 0) {
      return;
    }
    await sendPush(tokens, 'Dosya', DOSYA_ASSIGNED, dosyaId);
  },
);

function userIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0))];
}

async function otherUserIds(db: Firestore, actorId: string): Promise<string[]> {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map((item) => item.id).filter((id) => id !== actorId);
}

function lawyerName(data: DocumentData | undefined): string {
  const first = text(data?.firstName);
  const last = text(data?.lastName);
  const full = [first, last].filter((part) => part.length > 0).join(' ');
  if (full) {
    return full;
  }
  const display = text(data?.displayName);
  if (display && !display.includes('@')) {
    return display;
  }
  return 'Bir kullanıcı';
}

function tutanakNotice(lawyer: string, debtor: string): string {
  if (!debtor) {
    return `${lawyer} bir dosyaya yeni tutanak ekledi`;
  }
  return `${lawyer} ${debtor} dosyasına yeni tutanak ekledi`;
}

async function pushTokens(db: Firestore, userIds: string[]): Promise<{ uid: string; tokenId: string; token: string }[]> {
  const found: { uid: string; tokenId: string; token: string }[] = [];
  for (const uid of userIds) {
    const snapshot = await db.collection(`users/${uid}/pushTokens`).get();
    snapshot.forEach((item) => {
      const token = text(item.data().expoPushToken);
      if (token.includes('PushToken')) {
        found.push({ uid, tokenId: item.id, token });
      }
    });
  }
  return found;
}

async function sendPush(targets: { uid: string; tokenId: string; token: string }[], title: string, body: string, dosyaId: string): Promise<void> {
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(
      targets.map((target) => ({
        to: target.token,
        title,
        body,
        sound: 'default',
        data: { screen: 'notifications', dosyaId },
      })),
    ),
  });
  if (!response.ok) {
    logger.error('Expo push failed', { status: response.status });
    return;
  }
  const payload = (await response.json()) as { data?: { status?: string; details?: { error?: string } }[] };
  const tickets = payload.data ?? [];
  const db = getFirestore();
  await Promise.all(
    tickets.map(async (ticket, index) => {
      if (ticket.details?.error !== 'DeviceNotRegistered') {
        return;
      }
      const target = targets[index];
      if (!target) {
        return;
      }
      await db.doc(`users/${target.uid}/pushTokens/${target.tokenId}`).delete();
    }),
  );
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
