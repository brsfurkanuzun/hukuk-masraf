import { httpsCallable } from 'firebase/functions';

import type { AttachmentMeta, AttachmentResourceType } from '@/models/expense';
import { getFirebase } from '@/services/firebase/config';
import { AppError, CLOUDINARY_NOT_CONFIGURED, errorCode } from '@/utils/errors';

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  resourceType: AttachmentResourceType;
  type: 'authenticated';
  overwrite: 'false';
}

interface SignatureRequest {
  expenseId: string;
  itemId: string;
  attachmentId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

function rethrowCallable(error: unknown): never {
  const code = errorCode(error);
  if (code === 'functions/not-found' || code === 'functions/unimplemented' || code === 'functions/unavailable') {
    throw new AppError(CLOUDINARY_NOT_CONFIGURED, code);
  }
  if (code === 'functions/invalid-argument') {
    throw new AppError('Belge türü veya boyutu kabul edilmedi.', code);
  }
  if (code === 'functions/unauthenticated') {
    throw new AppError('Oturum doğrulanamadı. Tekrar giriş yapın.', code);
  }
  throw new AppError('Belge hizmetine ulaşılamadı. Dosya herkese açık yüklenmedi.', code || 'functions/unknown');
}

export async function requestUploadSignature(request: SignatureRequest): Promise<UploadSignature> {
  try {
    const callable = httpsCallable<SignatureRequest, UploadSignature>(getFirebase().functions, 'createUploadSignature');
    const result = await callable(request);
    const data = result.data;
    if (!data.signature || !data.publicId || !data.cloudName || !data.apiKey) {
      throw new AppError(CLOUDINARY_NOT_CONFIGURED, 'functions/invalid-response');
    }
    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    rethrowCallable(error);
  }
}

export async function requestDeliveryUrl(input: {
  publicId: string;
  resourceType: AttachmentResourceType;
}): Promise<{ url: string; expiresAt: number }> {
  try {
    const callable = httpsCallable<typeof input, { url: string; expiresAt: number }>(
      getFirebase().functions,
      'createDeliveryUrl',
    );
    const result = await callable(input);
    if (!result.data.url) {
      throw new AppError('Belge bağlantısı oluşturulamadı.', 'functions/invalid-response');
    }
    return result.data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    rethrowCallable(error);
  }
}

export async function requestAssetDeletion(input: {
  publicId: string;
  resourceType: AttachmentResourceType;
}): Promise<void> {
  try {
    const callable = httpsCallable<typeof input, { ok: boolean }>(getFirebase().functions, 'deleteCloudinaryAsset');
    await callable(input);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    rethrowCallable(error);
  }
}

export function attachmentFromUpload(input: {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  publicId: string;
  resourceType: AttachmentResourceType;
  url: string;
  uploadedAt: string;
}): AttachmentMeta {
  return {
    id: input.id,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    cloudinaryPublicId: input.publicId,
    resourceType: input.resourceType,
    accessMode: 'public',
    url: input.url,
    uploadedAt: input.uploadedAt,
  };
}
