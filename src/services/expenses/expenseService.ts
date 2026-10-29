import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

import { PAGE_SIZE } from '@/constants/limits';
import type { Dosya } from '@/models/dosya';
import type { AttachmentMeta, Expense, ExpenseItem } from '@/models/expense';
import { assertDosyaAccess } from '@/services/dosyalar/dosyaService';
import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';
import { type ExpensePage } from '@/services/expenses/cacheUpdates';
import {
  cursorValues,
  orderFields,
  type ExpenseCursor,
  type QueryPlan,
} from '@/services/expenses/queryPlan';
import { nowIso } from '@/utils/date';
import { AppError } from '@/utils/errors';

function expenseCollection(dosyaId: string) {
  return collection(getFirebase().db, 'dosyalar', dosyaId, 'expenses');
}

function isSoftDeleted(data: DocumentData): boolean {
  return typeof data.deletedAt === 'string' && data.deletedAt.length > 0;
}

function mergeExpenseFromDosya(id: string, dosyaId: string, dosya: Dosya, data: DocumentData): Expense {
  if (typeof data.ownerId !== 'string' || !Array.isArray(data.expenseItems) || typeof data.expenseDate !== 'string') {
    throw new AppError('Masraf kaydı okunamadı.', 'app/invalid-document');
  }
  const expenseItems = data.expenseItems as ExpenseItem[];
  const attachmentsLookEmbedded = expenseItems.every(
    (item) => item && Array.isArray(item.attachments) && typeof item.amountKurus === 'number',
  );
  if (!attachmentsLookEmbedded) {
    throw new AppError('Masraf kaydı okunamadı.', 'app/invalid-document');
  }
  return {
    id,
    dosyaId,
    ownerId: data.ownerId,
    userId: typeof data.userId === 'string' && data.userId ? data.userId : data.ownerId,
    expenseDate: data.expenseDate,
    clientName: dosya.clientName,
    clientNameNormalized: dosya.clientNameNormalized,
    debtorName: dosya.debtorName,
    enforcementOffice: dosya.enforcementOffice,
    enforcementOfficeNormalized: dosya.enforcementOfficeNormalized,
    fileCaseNumber: dosya.fileCaseNumber,
    fileCaseNumberNormalized: dosya.fileCaseNumberNormalized,
    instructionNumber: dosya.instructionNumber,
    note: String(data.note ?? ''),
    expenseItems: expenseItems.map((item) => ({
      ...item,
      note: String(item.note ?? ''),
      attachments: item.attachments.map((attachment) => ({
        ...attachment,
        url: typeof attachment.url === 'string' ? attachment.url : '',
        accessMode: 'public',
      })) as AttachmentMeta[],
    })),
    totalAmountKurus: Number(data.totalAmountKurus ?? 0),
    currency: 'TRY',
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

function planForDosya(plan: QueryPlan): QueryPlan {
  if (plan.mode === 'client' || plan.mode === 'case') {
    if (plan.from || plan.to) {
      return { mode: 'date', from: plan.from, to: plan.to };
    }
    return { mode: 'recent' };
  }
  return plan;
}

function constraintsFor(_dosyaId: string, plan: QueryPlan, cursor: ExpenseCursor | null): QueryConstraint[] {
  const effective = planForDosya(plan);
  const constraints: QueryConstraint[] = [];
  if (effective.mode === 'date') {
    if (effective.from) {
      constraints.push(where('expenseDate', '>=', effective.from));
    }
    if (effective.to) {
      constraints.push(where('expenseDate', '<=', effective.to));
    }
  }
  for (const field of orderFields(effective)) {
    const direction = field === 'expenseDate' || field === 'createdAt' ? 'desc' : 'asc';
    constraints.push(orderBy(field, direction));
  }
  constraints.push(limit(PAGE_SIZE));
  if (cursor) {
    constraints.push(startAfter(...cursorValues(effective, cursor)));
  }
  return constraints;
}

export async function listExpenses(
  uid: string,
  dosyaId: string,
  plan: QueryPlan,
  cursor: ExpenseCursor | null,
): Promise<ExpensePage> {
  const dosya = await assertDosyaAccess(uid, dosyaId);
  const snapshot = await getDocsFromServer(query(expenseCollection(dosyaId), ...constraintsFor(dosyaId, plan, cursor)));
  recordDocumentReads(snapshot.size);
  const items = snapshot.docs
    .filter((document) => !isSoftDeleted(document.data()))
    .map((document) => mergeExpenseFromDosya(document.id, dosyaId, dosya, document.data()));
  const last = snapshot.docs[snapshot.docs.length - 1];
  return {
    items,
    nextCursor: snapshot.size < PAGE_SIZE || !last ? null : cursorFromRaw(dosya, last.id, last.data()),
  };
}

export async function getExpense(uid: string, dosyaId: string, expenseId: string): Promise<Expense> {
  const dosya = await assertDosyaAccess(uid, dosyaId);
  const snapshot = await getDocFromServer(doc(getFirebase().db, 'dosyalar', dosyaId, 'expenses', expenseId));
  recordDocumentReads(1);
  if (!snapshot.exists() || isSoftDeleted(snapshot.data() ?? {})) {
    throw new AppError('Masraf kaydı bulunamadı.', 'app/not-found');
  }
  return mergeExpenseFromDosya(snapshot.id, dosyaId, dosya, snapshot.data() ?? {});
}

export async function saveExpense(dosyaId: string, expense: Expense): Promise<void> {
  const expenseItems = expense.expenseItems.map((item) => ({
    ...item,
    amountKurus: Math.trunc(item.amountKurus),
    attachments: item.attachments.map((attachment) => ({
      ...attachment,
      fileSize: Math.trunc(attachment.fileSize),
    })),
  }));
  await setDoc(doc(getFirebase().db, 'dosyalar', dosyaId, 'expenses', expense.id), {
    ownerId: expense.ownerId,
    userId: expense.userId,
    expenseDate: expense.expenseDate,
    note: expense.note,
    expenseItems,
    totalAmountKurus: Math.trunc(expense.totalAmountKurus),
    currency: expense.currency,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  });
}

export async function deleteExpense(dosyaId: string, expenseId: string): Promise<void> {
  const deletedAt = nowIso();
  await updateDoc(doc(getFirebase().db, 'dosyalar', dosyaId, 'expenses', expenseId), {
    deletedAt,
    updatedAt: deletedAt,
  });
}

function cursorFromRaw(dosya: Dosya, id: string, data: DocumentData): ExpenseCursor {
  const expense = mergeExpenseFromDosya(id, dosya.id, dosya, data);
  return {
    createdAt: expense.createdAt,
    expenseDate: expense.expenseDate,
    clientNameNormalized: expense.clientNameNormalized,
    fileCaseNumberNormalized: expense.fileCaseNumberNormalized,
  };
}
