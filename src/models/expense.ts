import type { ExpenseType } from '@/constants/expenseTypes';

export type AttachmentResourceType = 'image' | 'raw';

export interface AttachmentMeta {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  cloudinaryPublicId: string;
  resourceType: AttachmentResourceType;
  accessMode: 'public';
  url: string;
  uploadedAt: string;
}

export interface ExpenseItem {
  id: string;
  type: ExpenseType;
  customType: string | null;
  amountKurus: number;
  note: string;
  attachments: AttachmentMeta[];
}

export interface Expense {
  id: string;
  ownerId: string;
  userId: string;
  expenseDate: string;
  clientName: string;
  clientNameNormalized: string;
  debtorName: string;
  enforcementOffice: string;
  enforcementOfficeNormalized: string;
  fileCaseNumber: string;
  fileCaseNumberNormalized: string;
  instructionNumber: string;
  note: string;
  expenseItems: ExpenseItem[];
  totalAmountKurus: number;
  currency: 'TRY';
  createdAt: string;
  updatedAt: string;
}

export interface LocalAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  localUri: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  errorMessage?: string;
  uploaded?: AttachmentMeta;
}

export interface SuggestionLists {
  enforcementOffices: string[];
  clientNames: string[];
}

export interface OrphanAsset {
  publicId: string;
  resourceType: AttachmentResourceType;
  expenseId: string;
}
