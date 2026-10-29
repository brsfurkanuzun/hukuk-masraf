import type { AttachmentMeta } from '@/models/expense';

export interface Tutanak {
  id: string;
  dosyaId: string;
  ownerId: string;
  userId: string;
  tutanakDate: string;
  content: string;
  attachments: AttachmentMeta[];
  createdAt: string;
  updatedAt: string;
}
