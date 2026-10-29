import type { Dosya } from '@/models/dosya';
import type { ExpenseType } from '@/constants/expenseTypes';
import type { Expense, ExpenseItem } from '@/models/expense';
import type { ExpenseEntryFormValues, ExpenseFormValues } from '@/schemas/expenseSchema';
import { nowIso } from '@/utils/date';
import { createId } from '@/utils/id';
import { parseTlToKurus, sumKurus, formatAmountInput } from '@/utils/money';
import { AppError } from '@/utils/errors';

export function createEmptyItem(type: ExpenseType = 'yol'): ExpenseEntryFormValues['items'][number] {
  return {
    id: createId(),
    type,
    customType: '',
    amount: '',
    note: '',
    attachments: [],
  };
}

export function createEmptyFormValues(dateIso: string): ExpenseFormValues {
  return {
    expenseDate: dateIso,
    clientName: '',
    debtorName: '',
    enforcementOffice: '',
    fileCaseNumber: '',
    instructionNumber: '',
    note: '',
    items: [createEmptyItem()],
  };
}

export function createEmptyEntryValues(dateIso: string): ExpenseEntryFormValues {
  return {
    expenseDate: dateIso,
    note: '',
    items: [createEmptyItem()],
  };
}

export function expenseToEntryValues(expense: Expense): ExpenseEntryFormValues {
  return {
    expenseDate: expense.expenseDate,
    note: expense.note ?? '',
    items: expense.expenseItems.map((item) => ({
      id: item.id,
      type: item.type.trim() || 'yol',
      customType: item.customType ?? '',
      amount: formatAmountInput(item.amountKurus),
      note: item.note ?? '',
      attachments: item.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        localUri: '',
        status: 'uploaded' as const,
        progress: 1,
        uploaded: attachment,
      })),
    })),
  };
}

export function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    expenseDate: expense.expenseDate,
    clientName: expense.clientName,
    debtorName: expense.debtorName,
    enforcementOffice: expense.enforcementOffice,
    fileCaseNumber: expense.fileCaseNumber,
    instructionNumber: expense.instructionNumber,
    note: expense.note ?? '',
    items: expenseToEntryValues(expense).items,
  };
}

export function formToExpense(input: {
  id: string;
  dosya: Dosya;
  userId: string;
  values: ExpenseEntryFormValues;
  createdAt: string;
  updatedAt?: string;
}): Expense {
  const items: ExpenseItem[] = input.values.items.map((item) => {
    const amountKurus = parseTlToKurus(item.amount);
    if (amountKurus === null) {
      throw new AppError('Masraf tutarı geçersiz.', 'app/validation');
    }
    const attachments = item.attachments.map((attachment) => {
      if (attachment.status !== 'uploaded' || !attachment.uploaded) {
        throw new AppError('Kaydetmeden önce belge yüklemeleri tamamlanmalı.', 'app/upload-pending');
      }
      return attachment.uploaded;
    });
    return {
      id: item.id,
      type: item.type as ExpenseType,
      customType: null,
      amountKurus,
      note: item.note.trim(),
      attachments,
    };
  });
  const totalAmountKurus = sumKurus(items.map((item) => item.amountKurus));
  const dosya = input.dosya;
  return {
    id: input.id,
    dosyaId: dosya.id,
    ownerId: dosya.ownerId,
    userId: input.userId,
    expenseDate: input.values.expenseDate,
    clientName: dosya.clientName,
    clientNameNormalized: dosya.clientNameNormalized,
    debtorName: dosya.debtorName,
    enforcementOffice: dosya.enforcementOffice,
    enforcementOfficeNormalized: dosya.enforcementOfficeNormalized,
    fileCaseNumber: dosya.fileCaseNumber,
    fileCaseNumberNormalized: dosya.fileCaseNumberNormalized,
    instructionNumber: dosya.instructionNumber,
    note: input.values.note.trim(),
    expenseItems: items,
    totalAmountKurus,
    currency: 'TRY',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? nowIso(),
  };
}

export function displayTotalKurus(expense: Pick<Expense, 'expenseItems' | 'totalAmountKurus'>): number {
  return sumKurus(expense.expenseItems.map((item) => item.amountKurus));
}
