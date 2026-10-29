import fs from 'node:fs';
import path from 'node:path';

import { QueryClient } from '@tanstack/react-query';

import { parseExpenseTypeCatalog } from '@/constants/expenseTypes';
import { PAGE_SIZE } from '@/constants/limits';
import type { Expense } from '@/models/expense';
import { expenseFormSchema } from '@/schemas/expenseSchema';
import {
  cacheCreatedExpense,
  dedupeExpenses,
  prependExpense,
  removeExpense,
  replaceExpense,
  type ExpensePage,
} from '@/services/expenses/cacheUpdates';
import { addOrphanAssets, removeOrphanAssets } from '@/services/expenses/memoryUpdates';
import { createEmptyFormValues, displayTotalKurus, formToExpense } from '@/services/expenses/mapExpense';
import {
  buildQueryPlan,
  cursorValues,
  expenseMatchesPlan,
  orderFields,
} from '@/services/expenses/queryPlan';
import { todayIsoDate } from '@/utils/date';
import { toUserMessage } from '@/utils/errors';
import { inferMimeType, validateAttachmentFile } from '@/utils/files';
import { formatKurus, liveTotalKurus, parseTlToKurus, sumKurus } from '@/utils/money';
import { createSubmitLock } from '@/utils/submitLock';
import { assertUsername, normalizeUsername } from '@/utils/username';
import { filterSuggestions, namesToAdd, normalizeSearchText, uniqueNames } from '@/utils/text';

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    ownerId: 'user-1',
    userId: 'user-1',
    expenseDate: '2026-10-25',
    clientName: 'Ayşe Yılmaz',
    clientNameNormalized: 'ayşe yılmaz',
    debtorName: 'ABC Ltd.',
    enforcementOffice: 'İstanbul Anadolu İcra Dairesi',
    enforcementOfficeNormalized: 'i̇stanbul anadolu icra dairesi',
    fileCaseNumber: '00012/2024',
    fileCaseNumberNormalized: '00012/2024',
    instructionNumber: '004',
    note: '',
    expenseItems: [
      { id: 'item-1', type: 'yol', customType: null, amountKurus: 125050, note: '', attachments: [] },
      { id: 'item-2', type: 'gida', customType: null, amountKurus: 5000, note: 'Öğle', attachments: [] },
    ],
    totalAmountKurus: 130050,
    currency: 'TRY',
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    ...overrides,
  };
}

describe('money', () => {
  it('parses Turkish lira into kuruş without floating point', () => {
    expect(parseTlToKurus('1.250,50')).toBe(125050);
    expect(parseTlToKurus('10,5')).toBe(1050);
    expect(parseTlToKurus('1.250')).toBe(125000);
    expect(parseTlToKurus('10.50')).toBe(1050);
    expect(parseTlToKurus('0')).toBe(0);
    expect(parseTlToKurus('-1')).toBeNull();
    expect(parseTlToKurus('12,345')).toBeNull();
    expect(sumKurus([125050, 5000])).toBe(130050);
    expect(formatKurus(130050)).toBe('1.300,50 ₺');
    expect(liveTotalKurus(['1.250,50', '', '50'])).toBe(130050);
  });

  it('keeps a local calendar date instead of converting through UTC', () => {
    expect(todayIsoDate(new Date(2026, 9, 25, 1, 30, 0))).toBe('2026-10-25');
  });
});

describe('expense form', () => {
  it('keeps case numbers as text, including leading zeros', () => {
    const parsed = expenseFormSchema.parse({
      ...createEmptyFormValues('2026-10-25'),
      clientName: 'Ayşe Yılmaz',
      fileCaseNumber: '00012/2024',
      items: [{ id: 'item-1234', type: 'yol', customType: '', amount: '10,50', note: '', attachments: [] }],
    });
    expect(parsed.fileCaseNumber).toBe('00012/2024');
    expect(typeof parsed.fileCaseNumber).toBe('string');
  });

  it('keeps an empty note and a catalog type, and rejects an empty type or a negative amount', () => {
    const base = createEmptyFormValues('2026-10-25');
    const emptyNote = expenseFormSchema.safeParse({
      ...base,
      clientName: 'Ayşe',
      fileCaseNumber: '1',
      note: '   ',
      items: [{ id: 'item-1234', type: 'konaklama', customType: '', amount: '10', note: '', attachments: [] }],
    });
    const catalogType = expenseFormSchema.safeParse({
      ...base,
      clientName: 'Ayşe',
      fileCaseNumber: '1',
      items: [{ id: 'item-1234', type: 'posta', customType: '', amount: '10', note: '', attachments: [] }],
    });
    const emptyType = expenseFormSchema.safeParse({
      ...base,
      clientName: 'Ayşe',
      fileCaseNumber: '1',
      items: [{ id: 'item-1234', type: ' ', customType: '', amount: '10', note: '', attachments: [] }],
    });
    const negative = expenseFormSchema.safeParse({
      ...base,
      clientName: 'Ayşe',
      fileCaseNumber: '1',
      items: [{ id: 'item-1234', type: 'yol', customType: '', amount: '-5', note: '', attachments: [] }],
    });
    expect(emptyNote.success).toBe(true);
    if (emptyNote.success) {
      expect(emptyNote.data.note).toBe('');
    }
    expect(catalogType.success).toBe(true);
    expect(emptyType.success).toBe(false);
    expect(negative.success).toBe(false);
  });

  it('stores a total that matches the item amounts', () => {
    const values = expenseFormSchema.parse({
      ...createEmptyFormValues('2026-10-25'),
      clientName: 'Ayşe Yılmaz',
      enforcementOffice: 'İstanbul Anadolu İcra Dairesi',
      fileCaseNumber: '00012/2024',
      note: 'Öğle yemeği',
      items: [
        { id: 'item-1234', type: 'yol', customType: '', amount: '1.250,50', note: 'Akaryakıt', attachments: [] },
        { id: 'item-5678', type: 'gida', customType: '', amount: '50,00', note: '', attachments: [] },
      ],
    });
    const record = formToExpense({
      id: 'expense-1234',
      ownerId: 'user-1',
      values,
      createdAt: '2026-10-25T10:00:00.000Z',
      updatedAt: '2026-10-25T10:00:00.000Z',
    });
    expect(record.userId).toBe('user-1');
    expect(record.fileCaseNumber).toBe('00012/2024');
    expect(record.totalAmountKurus).toBe(displayTotalKurus(record));
    expect(record.totalAmountKurus).toBe(130050);
    expect(record.note).toBe('Öğle yemeği');
    expect(record.expenseItems[0]?.note).toBe('Akaryakıt');
    expect(record.expenseItems[1]?.note).toBe('');
    expect(record.expenseItems[1]?.type).toBe('gida');
    expect(record.expenseItems[1]?.customType).toBeNull();
    expect(record.clientNameNormalized).toBe(normalizeSearchText('Ayşe Yılmaz'));
  });
});

describe('queries and cache', () => {
  it('builds bounded plans and does not search on a single character', () => {
    expect(buildQueryPlan({ searchField: 'client', searchText: 'a', dateFrom: null, dateTo: null }).mode).toBe('recent');
    const clientPlan = buildQueryPlan({ searchField: 'client', searchText: 'İst', dateFrom: '2026-01-01', dateTo: '2026-10-25' });
    expect(clientPlan.mode).toBe('client');
    if (clientPlan.mode === 'client') {
      expect(clientPlan.prefix).toBe('ist');
      expect(orderFields(clientPlan)).toEqual(['clientNameNormalized', 'expenseDate']);
    }
    const recent = buildQueryPlan({ searchField: 'case', searchText: '', dateFrom: null, dateTo: null });
    expect(orderFields(recent)).toEqual(['createdAt']);
    expect(cursorValues(recent, {
      createdAt: '2026-10-25T10:00:00.000Z',
      expenseDate: '2026-10-25',
      clientNameNormalized: 'a',
      fileCaseNumberNormalized: '1',
    })).toEqual(['2026-10-25T10:00:00.000Z']);
    expect(PAGE_SIZE).toBe(20);
  });

  it('updates only the matching cached page and does not duplicate a record', () => {
    const first = expense();
    const page: ExpensePage = { items: [first], nextCursor: null };
    const current = { pages: [page], pageParams: [null] };
    const added = expense({ id: 'expense-2', clientNameNormalized: 'ayşe yılmaz' });
    const prepended = prependExpense(current, added, { mode: 'recent' });
    expect(prepended?.pages[0]?.items.map((item) => item.id)).toEqual(['expense-2', 'expense-1']);
    const again = prependExpense(prepended, added, { mode: 'recent' });
    expect(again?.pages[0]?.items.filter((item) => item.id === 'expense-2')).toHaveLength(1);
    const outside = prependExpense(current, added, { mode: 'client', prefix: 'mehmet', from: null, to: null });
    expect(outside).toBe(current);
    const replaced = replaceExpense(current, expense({ clientName: 'Yeni' }), { mode: 'recent' });
    expect(replaced?.pages[0]?.items[0]?.clientName).toBe('Yeni');
    expect(removeExpense(current, 'expense-1')?.pages[0]?.items).toHaveLength(0);
    expect(dedupeExpenses([first, first])).toHaveLength(1);
    expect(expenseMatchesPlan(first, { mode: 'case', prefix: '00012', from: null, to: null })).toBe(true);
  });

  it('writes a new expense into the list cache without a refetch helper', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } },
    });
    const record = expense();
    client.setQueryData(['expenses', 'user-1', 'list', { mode: 'recent' }], {
      pages: [{ items: [], nextCursor: null }],
      pageParams: [null],
    });
    cacheCreatedExpense(client, record);
    const cached = client.getQueryData<{ pages: ExpensePage[] }>(['expenses', 'user-1', 'list', { mode: 'recent' }]);
    expect(cached?.pages[0]?.items[0]?.id).toBe('expense-1');
    expect(client.getQueryData(['expense', 'user-1', 'expense-1'])).toMatchObject({ id: 'expense-1' });
  });
});

describe('username', () => {
  it('normalizes a username and rejects a short one', () => {
    expect(normalizeUsername('  Alp.Demir ')).toBe('alp.demir');
    expect(normalizeUsername('İCRA')).toBe('icra');
    expect(assertUsername('ayse.yilmaz')).toBe('ayse.yilmaz');
    expect(() => assertUsername('a')).toThrow('2–32');
    expect(() => assertUsername('..')).toThrow('2–32');
  });
});

describe('files, suggestions and rules', () => {
  it('validates mime type and size', () => {
    expect(inferMimeType('makbuz.PDF', null)).toBe('application/pdf');
    expect(validateAttachmentFile('image/jpeg', 1024)).toBeNull();
    expect(validateAttachmentFile('image/gif', 1024)).toContain('JPEG');
    expect(validateAttachmentFile('application/pdf', 16 * 1024 * 1024)).toContain('15 MB');
  });

  it('reads expense type options from a catalog document', () => {
    expect(
      parseExpenseTypeCatalog({
        items: [
          { value: ' yol ', label: ' Yol ücreti ' },
          { value: 'yol', label: 'Tekrar' },
          { label: 'Harç' },
          '  Gıda  ',
          { value: '', label: 'Boş' },
        ],
      }),
    ).toEqual([
      { value: 'yol', label: 'Yol ücreti' },
      { value: 'Harç', label: 'Harç' },
      { value: 'Gıda', label: 'Gıda' },
    ]);
    expect(parseExpenseTypeCatalog({ types: ['Posta'] })).toEqual([{ value: 'Posta', label: 'Posta' }]);
    expect(parseExpenseTypeCatalog(null)).toEqual([]);
  });

  it('deduplicates suggestion names in memory', () => {
    expect(uniqueNames([' İstanbul Anadolu ', 'istanbul anadolu', 'Ankara'])).toEqual(['İstanbul Anadolu', 'Ankara']);
    expect(namesToAdd(['İstanbul Anadolu'], ['istanbul anadolu', 'Ankara'])).toEqual(['Ankara']);
    expect(filterSuggestions(['İstanbul Anadolu İcra'], 'anadolu')).toEqual(['İstanbul Anadolu İcra']);
  });

  it('tracks orphan uploads until they are linked or deleted', () => {
    const first = addOrphanAssets([], [{ publicId: 'a', resourceType: 'image', expenseId: 'e1' }]);
    const second = addOrphanAssets(first, [{ publicId: 'a', resourceType: 'raw', expenseId: 'e1' }]);
    expect(second).toHaveLength(1);
    expect(second[0]?.resourceType).toBe('raw');
    expect(removeOrphanAssets(second, ['a'])).toEqual([]);
  });

  it('prevents a second submit while the first lock is held', () => {
    const lock = createSubmitLock();
    expect(lock.tryLock()).toBe(true);
    expect(lock.tryLock()).toBe(false);
    lock.unlock();
    expect(lock.tryLock()).toBe(true);
  });

  it('does not publish a public Firestore rule', () => {
    const rules = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');
    const indexes = fs.readFileSync(path.join(__dirname, '../../firestore.indexes.json'), 'utf8');
    expect(rules).not.toMatch(/allow\s+read\s*,\s*write\s*:\s*if\s+true/);
    expect(rules).toContain('resource.data.ownerId == request.auth.uid');
    expect(rules).toContain("request.resource.data.ownerId == resource.data.ownerId");
    expect(rules).toContain('att.url.size() <= 2048');
    expect(rules).toContain('att.fileSize <= 15728640');
    expect(rules).toContain("match /catalog/{docId}");
    expect(rules).toContain("docId == 'expenseTypes'");
    expect(rules).toContain("match /usernames/{usernameId}");
    expect(rules).toContain('allow list: if false');
    expect(rules).toContain("'note'");
    expect(indexes).toContain('clientNameNormalized');
    expect(indexes).toContain('fileCaseNumberNormalized');
  });

  it('maps a missing Cloud Function to the private-upload message', () => {
    expect(toUserMessage({ code: 'functions/not-found' })).toContain('Cloudinary ayarı eksik');
    expect(toUserMessage({ code: 'auth/invalid-credential' })).toBe('Kullanıcı adı veya şifre hatalı.');
  });
});
