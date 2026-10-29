/** Calendar date in the device timezone, stored as YYYY-MM-DD. */
export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTrDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

export function isoToLocalDate(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return new Date();
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  return todayIsoDate(date);
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = isoToLocalDate(value);
  return toIsoDate(date) === value;
}

export function isDateRangeValid(from: string | null, to: string | null): boolean {
  if (from && !isIsoDate(from)) {
    return false;
  }
  if (to && !isIsoDate(to)) {
    return false;
  }
  if (from && to && from > to) {
    return false;
  }
  return true;
}

export function nowIso(date = new Date()): string {
  return date.toISOString();
}
