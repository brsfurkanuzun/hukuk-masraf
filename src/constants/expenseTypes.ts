export const EXPENSE_TYPE_VALUES = ['yol', 'gida', 'konaklama'] as const;

export type ExpenseType = string;

export interface ExpenseTypeOption {
  value: ExpenseType;
  label: string;
}

export const EXPENSE_TYPE_OPTIONS: ExpenseTypeOption[] = [
  { value: 'yol', label: 'Yol' },
  { value: 'gida', label: 'Gıda' },
  { value: 'konaklama', label: 'Konaklama' },
];

const MAX_EXPENSE_TYPES = 40;
const MAX_EXPENSE_TYPE_LENGTH = 40;

export function parseExpenseTypeCatalog(data: unknown): ExpenseTypeOption[] {
  if (!data || typeof data !== 'object') {
    return [];
  }
  const record = data as Record<string, unknown>;
  const raw = Array.isArray(record.items) ? record.items : Array.isArray(record.types) ? record.types : [];
  const options: ExpenseTypeOption[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (options.length >= MAX_EXPENSE_TYPES) {
      break;
    }
    const option = normalizeExpenseType(entry);
    if (!option || seen.has(option.value)) {
      continue;
    }
    seen.add(option.value);
    options.push(option);
  }
  return options;
}

function normalizeExpenseType(entry: unknown): ExpenseTypeOption | null {
  if (typeof entry === 'string') {
    const label = entry.trim();
    if (!label || label.length > MAX_EXPENSE_TYPE_LENGTH) {
      return null;
    }
    return { value: label, label };
  }
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const record = entry as Record<string, unknown>;
  const label = typeof record.label === 'string' ? record.label.trim() : '';
  const value = typeof record.value === 'string' ? record.value.trim() : label;
  if (!value || !label || value.length > MAX_EXPENSE_TYPE_LENGTH || label.length > MAX_EXPENSE_TYPE_LENGTH) {
    return null;
  }
  return { value, label };
}

export function withCurrentExpenseType(options: readonly ExpenseTypeOption[], value: string): ExpenseTypeOption[] {
  if (!value || options.some((option) => option.value === value)) {
    return [...options];
  }
  return [...options, { value, label: expenseTypeLabel(value, null, options) }];
}

const LEGACY_TYPE_LABELS: Record<string, string> = {
  posta: 'Posta gideri',
  tebligat: 'Tebligat gideri',
  harc: 'Harç',
  bilirkisi: 'Bilirkişi ücreti',
  kesif: 'Keşif gideri',
  dosya: 'Dosya masrafı',
  diger: 'Diğer',
};

export function isExpenseType(value: string, options: readonly ExpenseTypeOption[] = EXPENSE_TYPE_OPTIONS): value is ExpenseType {
  return options.some((option) => option.value === value);
}

export function expenseTypeLabel(type: string, customType?: string | null, options: readonly ExpenseTypeOption[] = EXPENSE_TYPE_OPTIONS): string {
  const current = options.find((option) => option.value === type)?.label ?? EXPENSE_TYPE_OPTIONS.find((option) => option.value === type)?.label;
  if (current) {
    return current;
  }
  const custom = customType?.trim();
  if (type === 'diger' && custom) {
    return custom;
  }
  return LEGACY_TYPE_LABELS[type] ?? type;
}
