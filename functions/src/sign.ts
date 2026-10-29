import { createHash } from 'node:crypto';

export function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .filter((key) => params[key] !== '')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

export function isSafeDocumentId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(value);
}

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const PDF_MIME_TYPE = 'application/pdf';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

export function classifyUpload(mimeType: unknown, fileSize: unknown): { resourceType: 'image' | 'raw' } | null {
  if (typeof mimeType !== 'string' || typeof fileSize !== 'number' || !Number.isInteger(fileSize) || fileSize <= 0) {
    return null;
  }
  if (mimeType === PDF_MIME_TYPE && fileSize <= MAX_PDF_BYTES) {
    return { resourceType: 'raw' };
  }
  if (IMAGE_MIME_TYPES.has(mimeType) && fileSize <= MAX_IMAGE_BYTES) {
    return { resourceType: 'image' };
  }
  return null;
}

export function publicIdFor(uid: string, expenseId: string, itemId: string, attachmentId: string): string {
  return `users/${uid}/expenses/${expenseId}/${itemId}/${attachmentId}`;
}

export function ownsPublicId(uid: string, publicId: string): boolean {
  return publicId.startsWith(`users/${uid}/`) && !publicId.includes('..');
}
