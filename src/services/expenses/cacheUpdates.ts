import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';

import type { Expense } from '@/models/expense';
import { cursorFromExpense, expenseMatchesPlan, type ExpenseCursor, type QueryPlan } from '@/services/expenses/queryPlan';

export interface ExpensePage {
  items: Expense[];
  nextCursor: ExpenseCursor | null;
}

export function dedupeExpenses(items: Expense[]): Expense[] {
  const seen = new Set<string>();
  const result: Expense[] = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function prependExpense(
  current: InfiniteData<ExpensePage> | undefined,
  expense: Expense,
  plan: QueryPlan,
): InfiniteData<ExpensePage> | undefined {
  if (!current || !expenseMatchesPlan(expense, plan)) {
    return current;
  }
  const without = removeExpense(current, expense.id) ?? current;
  const [first, ...rest] = without.pages;
  if (!first) {
    return without;
  }
  return {
    ...without,
    pages: [{ ...first, items: [expense, ...first.items] }, ...rest],
  };
}

export function replaceExpense(
  current: InfiniteData<ExpensePage> | undefined,
  expense: Expense,
  plan: QueryPlan,
): InfiniteData<ExpensePage> | undefined {
  if (!current) {
    return current;
  }
  if (!expenseMatchesPlan(expense, plan)) {
    return removeExpense(current, expense.id);
  }
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === expense.id ? expense : item)),
    })),
  };
}

export function removeExpense(
  current: InfiniteData<ExpensePage> | undefined,
  expenseId: string,
): InfiniteData<ExpensePage> | undefined {
  if (!current) {
    return current;
  }
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => item.id !== expenseId),
    })),
  };
}

export function findExpenseInPages(data: InfiniteData<ExpensePage> | undefined, expenseId: string): Expense | undefined {
  return data?.pages.flatMap((page) => page.items).find((item) => item.id === expenseId);
}

export function planFromQueryKey(queryKey: QueryKey): QueryPlan | null {
  const plan = queryKey[3];
  if (!plan || typeof plan !== 'object' || !('mode' in plan)) {
    return null;
  }
  return plan as QueryPlan;
}

export function findExpenseInListCache(queryClient: QueryClient, uid: string, expenseId: string): Expense | undefined {
  const entries = queryClient.getQueriesData<InfiniteData<ExpensePage>>({ queryKey: ['expenses', uid, 'list'] });
  for (const [, data] of entries) {
    const found = findExpenseInPages(data, expenseId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

export function updateExpenseListCaches(
  queryClient: QueryClient,
  uid: string,
  updater: (current: InfiniteData<ExpensePage> | undefined, plan: QueryPlan) => InfiniteData<ExpensePage> | undefined,
): void {
  const entries = queryClient.getQueriesData<InfiniteData<ExpensePage>>({ queryKey: ['expenses', uid, 'list'] });
  for (const [queryKey, data] of entries) {
    const plan = planFromQueryKey(queryKey);
    if (!plan) {
      continue;
    }
    queryClient.setQueryData(queryKey, updater(data, plan));
  }
}

export function cacheCreatedExpense(queryClient: QueryClient, expense: Expense): void {
  queryClient.setQueryData(['expense', expense.ownerId, expense.id], expense);
  updateExpenseListCaches(queryClient, expense.ownerId, (current, plan) => prependExpense(current, expense, plan));
}

export function cacheUpdatedExpense(queryClient: QueryClient, expense: Expense): void {
  queryClient.setQueryData(['expense', expense.ownerId, expense.id], expense);
  updateExpenseListCaches(queryClient, expense.ownerId, (current, plan) => replaceExpense(current, expense, plan));
}

export function cacheDeletedExpense(queryClient: QueryClient, uid: string, expenseId: string): void {
  queryClient.removeQueries({ queryKey: ['expense', uid, expenseId], exact: true });
  updateExpenseListCaches(queryClient, uid, (current) => removeExpense(current, expenseId));
}

export function cursorForPage(items: Expense[], pageSize: number): ExpenseCursor | null {
  if (items.length < pageSize) {
    return null;
  }
  const last = items[items.length - 1];
  return last ? cursorFromExpense(last) : null;
}
