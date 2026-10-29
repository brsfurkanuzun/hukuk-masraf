import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

import { PAGE_SIZE } from '@/constants/limits';
import type { Dosya } from '@/models/dosya';
import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';
import {
  cursorFromDosya,
  cursorValuesForDosya,
  orderFieldsForDosya,
  type DosyaCursor,
  type DosyaQueryPlan,
} from '@/services/dosyalar/dosyaQueryPlan';
import { AppError } from '@/utils/errors';
import { prefixUpperBound } from '@/utils/text';

export interface DosyaPage {
  items: Dosya[];
  nextCursor: DosyaCursor | null;
}

function dosyaCollection() {
  return collection(getFirebase().db, 'dosyalar');
}

function asDosya(id: string, data: DocumentData): Dosya {
  if (typeof data.ownerId !== 'string' || !Array.isArray(data.assignedUserIds)) {
    throw new AppError('Dosya kaydı okunamadı.', 'app/invalid-document');
  }
  return {
    id,
    ownerId: data.ownerId,
    assignedUserIds: data.assignedUserIds.filter((uid): uid is string => typeof uid === 'string'),
    clientName: String(data.clientName ?? ''),
    clientNameNormalized: String(data.clientNameNormalized ?? ''),
    debtorName: String(data.debtorName ?? ''),
    enforcementOffice: String(data.enforcementOffice ?? ''),
    enforcementOfficeNormalized: String(data.enforcementOfficeNormalized ?? ''),
    fileCaseNumber: String(data.fileCaseNumber ?? ''),
    fileCaseNumberNormalized: String(data.fileCaseNumberNormalized ?? ''),
    instructionNumber: String(data.instructionNumber ?? ''),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

export function canAccessDosya(dosya: Dosya, uid: string): boolean {
  return dosya.ownerId === uid || dosya.assignedUserIds.includes(uid);
}

function constraintsForAssigned(uid: string, plan: DosyaQueryPlan, cursor: DosyaCursor | null): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where('assignedUserIds', 'array-contains', uid)];
  if (plan.mode === 'client' || plan.mode === 'case') {
    const field = plan.mode === 'client' ? 'clientNameNormalized' : 'fileCaseNumberNormalized';
    constraints.push(where(field, '>=', plan.prefix), where(field, '<=', prefixUpperBound(plan.prefix)));
  }
  for (const field of orderFieldsForDosya(plan)) {
    const direction = field === 'clientNameNormalized' || field === 'fileCaseNumberNormalized' ? 'asc' : 'desc';
    constraints.push(orderBy(field, direction));
  }
  constraints.push(limit(PAGE_SIZE));
  if (cursor) {
    constraints.push(startAfter(...cursorValuesForDosya(plan, cursor)));
  }
  return constraints;
}

export async function listAssignedDosyalar(uid: string, plan: DosyaQueryPlan, cursor: DosyaCursor | null): Promise<DosyaPage> {
  const assignedSnapshot = await getDocsFromServer(query(dosyaCollection(), ...constraintsForAssigned(uid, plan, cursor)));
  recordDocumentReads(assignedSnapshot.size);
  let items = assignedSnapshot.docs.map((document) => asDosya(document.id, document.data()));

  if (plan.mode === 'recent' && cursor === null) {
    try {
      const ownedSnapshot = await getDocsFromServer(
        query(dosyaCollection(), where('ownerId', '==', uid), orderBy('updatedAt', 'desc'), limit(PAGE_SIZE)),
      );
      recordDocumentReads(ownedSnapshot.size);
      const owned = ownedSnapshot.docs.map((document) => asDosya(document.id, document.data()));
      const seen = new Set(items.map((item) => item.id));
      for (const dosya of owned) {
        if (!seen.has(dosya.id)) {
          seen.add(dosya.id);
          items.push(dosya);
        }
      }
      items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
    } catch {
      // ownerId + updatedAt index henüz hazır olmayabilir; atanan dosya sorgusu yeterli.
    }
  }

  const last = items[items.length - 1];
  return {
    items,
    nextCursor: items.length < PAGE_SIZE || !last ? null : cursorFromDosya(last),
  };
}

export async function getDosya(uid: string, dosyaId: string): Promise<Dosya> {
  const snapshot = await getDocFromServer(doc(getFirebase().db, 'dosyalar', dosyaId));
  recordDocumentReads(1);
  if (!snapshot.exists()) {
    throw new AppError('Dosya bulunamadı.', 'app/not-found');
  }
  const dosya = asDosya(snapshot.id, snapshot.data());
  if (!canAccessDosya(dosya, uid)) {
    throw new AppError('Bu dosya için yetkiniz yok.', 'app/forbidden');
  }
  return dosya;
}

export async function assertDosyaAccess(uid: string, dosyaId: string): Promise<Dosya> {
  return getDosya(uid, dosyaId);
}
