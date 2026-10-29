import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';

import { PAGE_SIZE } from '@/constants/limits';
import type { AttachmentMeta, Expense, ExpenseItem } from '@/models/expense';
import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';
import { cursorForPage, type ExpensePage } from '@/services/expenses/cacheUpdates';
import {
  cursorValues,
  orderFields,
  type ExpenseCursor,
  type QueryPlan,
} from '@/services/expenses/queryPlan';
import { prefixUpperBound } from '@/utils/text';
import { AppError } from '@/utils/errors';

function expenseCollection() {
  return collection(getFirebase().db, 'expenses');
}

function asExpense(id: string, data: DocumentData): Expense {
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
    ownerId: data.ownerId,
    userId: typeof data.userId === 'string' && data.userId ? data.userId : data.ownerId,
    expenseDate: data.expenseDate,
    clientName: String(data.clientName ?? ''),
    clientNameNormalized: String(data.clientNameNormalized ?? ''),
    debtorName: String(data.debtorName ?? ''),
    enforcementOffice: String(data.enforcementOffice ?? ''),
    enforcementOfficeNormalized: String(data.enforcementOfficeNormalized ?? ''),
    fileCaseNumber: String(data.fileCaseNumber ?? ''),
    fileCaseNumberNormalized: String(data.fileCaseNumberNormalized ?? ''),
    instructionNumber: String(data.instructionNumber ?? ''),
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

function constraintsFor(uid: string, plan: QueryPlan, cursor: ExpenseCursor | null): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where('ownerId', '==', uid)];
  if (plan.mode === 'client' || plan.mode === 'case') {
    const field = plan.mode === 'client' ? 'clientNameNormalized' : 'fileCaseNumberNormalized';
    constraints.push(where(field, '>=', plan.prefix), where(field, '<=', prefixUpperBound(plan.prefix)));
  }
  if (plan.mode === 'date' || ((plan.mode === 'client' || plan.mode === 'case') && (plan.from || plan.to))) {
    const from = plan.mode === 'date' ? plan.from : plan.from;
    const to = plan.mode === 'date' ? plan.to : plan.to;
    if (from) {
      constraints.push(where('expenseDate', '>=', from));
    }
    if (to) {
      constraints.push(where('expenseDate', '<=', to));
    }
  }
  for (const field of orderFields(plan)) {
    const direction = field === 'clientNameNormalized' || field === 'fileCaseNumberNormalized' ? 'asc' : 'desc';
    constraints.push(orderBy(field, direction));
  }
  constraints.push(limit(PAGE_SIZE));
  if (cursor) {
    constraints.push(startAfter(...cursorValues(plan, cursor)));
  }
  return constraints;
}

export async function listExpenses(uid: string, plan: QueryPlan, cursor: ExpenseCursor | null): Promise<ExpensePage> {
  const snapshot = await getDocsFromServer(query(expenseCollection(), ...constraintsFor(uid, plan, cursor)));
  recordDocumentReads(snapshot.size);
  const items = snapshot.docs.map((document) => asExpense(document.id, document.data()));
  return {
    items,
    nextCursor: cursorForPage(items, PAGE_SIZE),
  };
}

export async function getExpense(uid: string, expenseId: string): Promise<Expense> {
  const snapshot = await getDocFromServer(doc(getFirebase().db, 'expenses', expenseId));
  recordDocumentReads(1);
  if (!snapshot.exists()) {
    throw new AppError('Masraf kaydı bulunamadı.', 'app/not-found');
  }
  const expense = asExpense(snapshot.id, snapshot.data());
  if (expense.ownerId !== uid) {
    throw new AppError('Bu kayıt için yetkiniz yok.', 'app/forbidden');
  }
  return expense;
}

export async function saveExpense(expense: Expense): Promise<void> {
  const { id, ...data } = expense;
  await setDoc(doc(getFirebase().db, 'expenses', id), data);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(getFirebase().db, 'expenses', expenseId));
}
