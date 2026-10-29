import { ALLOWED_IMAGE_MIME_TYPES, ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES, MAX_PDF_BYTES, PDF_MIME_TYPE } from '@/constants/limits';

export function inferMimeType(fileName: string, reported?: string | null): string | null {
  const mime = reported?.toLowerCase().trim();
  if (mime && mime !== 'application/octet-stream') {
    return mime;
  }
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'pdf':
      return PDF_MIME_TYPE;
    default:
      return null;
  }
}

export function validateAttachmentFile(mimeType: string, fileSize: number): string | null {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Yalnızca JPEG, PNG, WEBP, HEIC fotoğraf veya PDF eklenebilir.';
  }
  const max = mimeType === PDF_MIME_TYPE ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return 'Dosya boyutu okunamadı.';
  }
  if (fileSize > max) {
    return mimeType === PDF_MIME_TYPE
      ? 'PDF en fazla 15 MB olabilir.'
      : 'Fotoğraf en fazla 10 MB olabilir.';
  }
  if (mimeType === PDF_MIME_TYPE) {
    return null;
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return 'Bu fotoğraf türü desteklenmiyor.';
  }
  return null;
}

export function resourceTypeForMime(mimeType: string): 'image' | 'raw' {
  return mimeType === PDF_MIME_TYPE ? 'raw' : 'image';
}
