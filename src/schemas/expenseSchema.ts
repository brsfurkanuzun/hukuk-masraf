import { z } from 'zod';

import {
  MAX_ATTACHMENTS_PER_ITEM,
  MAX_CASE_NUMBER_LENGTH,
  MAX_CUSTOM_TYPE_LENGTH,
  MAX_EXPENSE_ITEMS,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
} from '@/constants/limits';
import type { AttachmentMeta, LocalAttachment } from '@/models/expense';
import { isIsoDate } from '@/utils/date';
import { parseTlToKurus } from '@/utils/money';

const attachmentMetaSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  cloudinaryPublicId: z.string().min(1),
  resourceType: z.enum(['image', 'raw']),
  accessMode: z.literal('public'),
  url: z.string().url(),
  uploadedAt: z.string().min(1),
});

const localAttachmentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  localUri: z.string(),
  status: z.enum(['pending', 'uploading', 'uploaded', 'error']),
  progress: z.number(),
  errorMessage: z.string().optional(),
  uploaded: attachmentMetaSchema.optional(),
});

export const expenseItemFormSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().trim().min(1, 'Masraf türü seçin').max(40, 'Masraf türü çok uzun'),
    customType: z.string().trim().max(MAX_CUSTOM_TYPE_LENGTH, 'Özel masraf türü çok uzun'),
    amount: z.string().trim().min(1, 'Tutar gerekli'),
    note: z.string().trim().max(MAX_NOTE_LENGTH, 'Not en fazla 500 karakter olabilir'),
    attachments: z.array(localAttachmentSchema).max(MAX_ATTACHMENTS_PER_ITEM, 'Bir kaleme en fazla 8 belge eklenebilir'),
  })
  .superRefine((item, ctx) => {
    if (parseTlToKurus(item.amount) === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Geçerli bir tutar girin. Örnek: 1250,50',
      });
    }
  });

export const expenseFormSchema = z
  .object({
    expenseDate: z.string().refine(isIsoDate, 'Geçerli bir tarih seçin'),
    clientName: z.string().trim().min(2, 'Müvekkil en az 2 karakter olmalı').max(MAX_NAME_LENGTH),
    debtorName: z.string().trim().max(MAX_NAME_LENGTH),
    enforcementOffice: z.string().trim().max(MAX_NAME_LENGTH),
    fileCaseNumber: z
      .string()
      .trim()
      .min(1, 'Esas numarası gerekli')
      .max(MAX_CASE_NUMBER_LENGTH, 'Esas numarası çok uzun'),
    instructionNumber: z.string().trim().max(MAX_CASE_NUMBER_LENGTH, 'Talimat numarası çok uzun'),
    note: z.string().trim().max(MAX_NOTE_LENGTH, 'Not en fazla 500 karakter olabilir'),
    items: z
      .array(expenseItemFormSchema)
      .min(1, 'En az bir masraf kalemi ekleyin')
      .max(MAX_EXPENSE_ITEMS, 'En fazla 20 masraf kalemi eklenebilir'),
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export type ExpenseItemFormValues = z.infer<typeof expenseItemFormSchema>;

export function assertAttachmentMeta(value: AttachmentMeta): AttachmentMeta {
  return attachmentMetaSchema.parse(value);
}

export function isLocalAttachment(value: LocalAttachment): boolean {
  return localAttachmentSchema.safeParse(value).success;
}
