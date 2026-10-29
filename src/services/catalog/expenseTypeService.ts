import { doc, getDocFromServer } from 'firebase/firestore';

import { EXPENSE_TYPE_OPTIONS, parseExpenseTypeCatalog, type ExpenseTypeOption } from '@/constants/expenseTypes';
import { getFirebase } from '@/services/firebase/config';
import { recordDocumentReads } from '@/services/firebase/readCounter';
import { logError } from '@/utils/errors';

export async function loadExpenseTypes(): Promise<ExpenseTypeOption[]> {
  try {
    const snapshot = await getDocFromServer(doc(getFirebase().db, 'catalog', 'expenseTypes'));
    recordDocumentReads(1);
    if (!snapshot.exists()) {
      return EXPENSE_TYPE_OPTIONS;
    }
    const parsed = parseExpenseTypeCatalog(snapshot.data());
    return parsed.length > 0 ? parsed : EXPENSE_TYPE_OPTIONS;
  } catch (error) {
    logError('expense-types', error);
    return EXPENSE_TYPE_OPTIONS;
  }
}
