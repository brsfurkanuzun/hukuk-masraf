import { SEARCH_MIN_LENGTH } from '@/constants/limits';
import type { Expense } from '@/models/expense';
import { normalizeCaseNumber, normalizeSearchText } from '@/utils/text';

export type SearchField = 'client' | 'case';

export interface ExpenseFilters {
  searchField: SearchField;
  searchText: string;
  dateFrom: string | null;
  dateTo: string | null;
}

export type QueryPlan =
  | { mode: 'recent' }
  | { mode: 'date'; from: string | null; to: string | null }
  | { mode: 'client'; prefix: string; from: string | null; to: string | null }
  | { mode: 'case'; prefix: string; from: string | null; to: string | null };

export interface ExpenseCursor {
  createdAt: string;
  expenseDate: string;
  clientNameNormalized: string;
  fileCaseNumberNormalized: string;
}

export function emptyFilters(): ExpenseFilters {
  return {
    searchField: 'client',
    searchText: '',
    dateFrom: null,
    dateTo: null,
  };
}

export function buildQueryPlan(filters: ExpenseFilters): QueryPlan {
  const clientPrefix = normalizeSearchText(filters.searchText);
  const casePrefix = normalizeCaseNumber(filters.searchText);
  const prefix = filters.searchField === 'case' ? casePrefix : clientPrefix;
  const from = filters.dateFrom;
  const to = filters.dateTo;
  if (prefix.length >= SEARCH_MIN_LENGTH) {
    return filters.searchField === 'case'
      ? { mode: 'case', prefix, from, to }
      : { mode: 'client', prefix, from, to };
  }
  if (from || to) {
    return { mode: 'date', from, to };
  }
  return { mode: 'recent' };
}

export function orderFields(plan: QueryPlan): string[] {
  if (plan.mode === 'recent') {
    return ['createdAt'];
  }
  if (plan.mode === 'date') {
    return ['expenseDate', 'createdAt'];
  }
  const prefixField = plan.mode === 'client' ? 'clientNameNormalized' : 'fileCaseNumberNormalized';
  if (plan.from || plan.to) {
    return [prefixField, 'expenseDate'];
  }
  return [prefixField, 'createdAt'];
}

export function cursorValues(plan: QueryPlan, cursor: ExpenseCursor): string[] {
  return orderFields(plan).map((field) => {
    if (field === 'createdAt') {
      return cursor.createdAt;
    }
    if (field === 'expenseDate') {
      return cursor.expenseDate;
    }
    if (field === 'clientNameNormalized') {
      return cursor.clientNameNormalized;
    }
    return cursor.fileCaseNumberNormalized;
  });
}

export function cursorFromExpense(expense: Expense): ExpenseCursor {
  return {
    createdAt: expense.createdAt,
    expenseDate: expense.expenseDate,
    clientNameNormalized: expense.clientNameNormalized,
    fileCaseNumberNormalized: expense.fileCaseNumberNormalized,
  };
}

function inDateRange(expenseDate: string, from: string | null, to: string | null): boolean {
  if (from && expenseDate < from) {
    return false;
  }
  if (to && expenseDate > to) {
    return false;
  }
  return true;
}

export function expenseMatchesPlan(expense: Expense, plan: QueryPlan): boolean {
  if (plan.mode === 'recent') {
    return true;
  }
  if (plan.mode === 'date') {
    return inDateRange(expense.expenseDate, plan.from, plan.to);
  }
  const field = plan.mode === 'client' ? expense.clientNameNormalized : expense.fileCaseNumberNormalized;
  if (!field.startsWith(plan.prefix)) {
    return false;
  }
  return inDateRange(expense.expenseDate, plan.from, plan.to);
}
