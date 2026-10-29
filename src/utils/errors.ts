export class AppError extends Error {
  readonly code: string;

  constructor(message: string, code = 'app/error') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

export const CLOUDINARY_NOT_CONFIGURED =
  'Cloudinary ayarı eksik. .env içine EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ve EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET yazın. API secret yazılmaz.';

export function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return '';
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  const code = errorCode(error);
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Kullanıcı adı veya şifre hatalı.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Ağ bağlantısı kurulamadı.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'E-posta ile giriş Firebase Console üzerinde etkin değil.';
  }
  if (code === 'auth/configuration-not-found' || code === 'app/config') {
    return 'Firebase yapılandırması eksik. .env dosyasını .env.example üzerinden doldurun.';
  }
  if (code.endsWith('permission-denied')) {
    return 'Bu kayıt için yetkiniz yok.';
  }
  if (code.endsWith('failed-precondition')) {
    return 'Firestore sorgusu için indeks gerekli. firestore.indexes.json dosyasını dağıtın.';
  }
  if (code.endsWith('unavailable')) {
    return 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.';
  }
  if (code === 'functions/not-found' || code === 'functions/unimplemented') {
    return CLOUDINARY_NOT_CONFIGURED;
  }
  if (code.endsWith('unauthenticated')) {
    return 'Oturum doğrulanamadı. Tekrar giriş yapın.';
  }
  return 'İşlem tamamlanamadı. Girdiğiniz bilgiler formda duruyor.';
}

export function logError(scope: string, error: unknown): void {
  const code = error instanceof AppError ? error.code : errorCode(error);
  console.error(`[${scope}]`, code || 'unknown');
}
