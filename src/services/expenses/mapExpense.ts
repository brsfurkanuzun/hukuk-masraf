import type { ExpenseType } from '@/constants/expenseTypes';
import type { Expense, ExpenseItem } from '@/models/expense';
import type { ExpenseFormValues } from '@/schemas/expenseSchema';
import { nowIso } from '@/utils/date';
import { createId } from '@/utils/id';
import { parseTlToKurus, sumKurus, formatAmountInput } from '@/utils/money';
import { normalizeCaseNumber, normalizeSearchText } from '@/utils/text';
import { AppError } from '@/utils/errors';

export function createEmptyItem(type: ExpenseType = 'yol'): ExpenseFormValues['items'][number] {
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

export function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    expenseDate: expense.expenseDate,
    clientName: expense.clientName,
    debtorName: expense.debtorName,
    enforcementOffice: expense.enforcementOffice,
    fileCaseNumber: expense.fileCaseNumber,
    instructionNumber: expense.instructionNumber,
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

export function formToExpense(input: {
  id: string;
  ownerId: string;
  values: ExpenseFormValues;
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
  const clientName = input.values.clientName.trim();
  const enforcementOffice = input.values.enforcementOffice.trim();
  const fileCaseNumber = input.values.fileCaseNumber.trim();
  return {
    id: input.id,
    ownerId: input.ownerId,
    userId: input.ownerId,
    expenseDate: input.values.expenseDate,
    clientName,
    clientNameNormalized: normalizeSearchText(clientName),
    debtorName: input.values.debtorName.trim(),
    enforcementOffice,
    enforcementOfficeNormalized: normalizeSearchText(enforcementOffice),
    fileCaseNumber,
    fileCaseNumberNormalized: normalizeCaseNumber(fileCaseNumber),
    instructionNumber: input.values.instructionNumber.trim(),
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
