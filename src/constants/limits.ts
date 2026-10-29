export const MAX_EXPENSE_ITEMS = 20;
export const MAX_ATTACHMENTS_PER_ITEM = 8;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const PAGE_SIZE = 20;
export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 400;
export const SUGGESTION_LIMIT = 200;
export const QUERY_STALE_TIME_MS = 5 * 60 * 1000;
export const QUERY_GC_TIME_MS = 30 * 60 * 1000;
export const DELIVERY_URL_TTL_SECONDS = 5 * 60;
export const DELIVERY_URL_STALE_MS = 4 * 60 * 1000;
export const MAX_NAME_LENGTH = 200;
export const MAX_CASE_NUMBER_LENGTH = 100;
export const MAX_CUSTOM_TYPE_LENGTH = 120;
export const MAX_NOTE_LENGTH = 500;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const PDF_MIME_TYPE = 'application/pdf';

export const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, PDF_MIME_TYPE] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
