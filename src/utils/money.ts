const MAX_KURUS = 100_000_000_000;

/**
 * Parses a Turkish lira entry into integer kuruş.
 * Comma is the decimal separator. Dots are thousands separators when a comma
 * is present, or when groups of three digits are used.
 */
export function parseTlToKurus(input: string): number | null {
  const compact = input.trim().replace(/\s/g, '');
  if (!compact || compact.startsWith('-') || compact.startsWith('+')) {
    return null;
  }

  let normalized = compact;
  if (compact.includes(',')) {
    if (!/^\d{1,3}(\.\d{3})*,\d{1,2}$|^\d+,\d{1,2}$/.test(compact)) {
      return null;
    }
    normalized = compact.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(compact)) {
    normalized = compact.replace(/\./g, '');
  } else if (!/^\d+(\.\d{1,2})?$/.test(compact)) {
    return null;
  }

  const [whole = '', fraction = ''] = normalized.split('.');
  if (!/^\d+$/.test(whole) || fraction.length > 2) {
    return null;
  }
  const kurus = Number(whole) * 100 + Number((fraction + '00').slice(0, 2));
  if (!Number.isSafeInteger(kurus) || kurus < 0 || kurus > MAX_KURUS) {
    return null;
  }
  return kurus;
}

export function formatAmountInput(kurus: number): string {
  const abs = Math.trunc(Math.abs(kurus));
  const lira = Math.trunc(abs / 100);
  const fraction = abs % 100;
  const grouped = lira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped},${fraction.toString().padStart(2, '0')}`;
}

export function formatKurus(kurus: number): string {
  return `${formatAmountInput(kurus)} ₺`;
}

export function sumKurus(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}

export function liveTotalKurus(amounts: string[]): number {
  return amounts.reduce((total, amount) => {
    if (!amount.trim()) {
      return total;
    }
    const kurus = parseTlToKurus(amount);
    return kurus === null ? total : total + kurus;
  }, 0);
}
