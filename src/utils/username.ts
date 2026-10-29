import { AppError } from '@/utils/errors';

const USERNAME_PATTERN = /^[\p{L}\p{N}._-]{2,32}$/u;

export function normalizeUsername(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, '');
}

export function assertUsername(value: string): string {
  const username = normalizeUsername(value);
  if (username === '.' || username === '..' || username.includes('/') || !USERNAME_PATTERN.test(username)) {
    throw new AppError(
      'Kullanıcı adı 2–32 karakter olmalı. Harf, rakam, nokta, alt çizgi veya tire kullanın.',
      'app/username',
    );
  }
  return username;
}
