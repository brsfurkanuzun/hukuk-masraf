import { useEffect, useState } from 'react';

import { getDocumentReadCount, subscribeDocumentReads } from '@/services/firebase/readCounter';

export function useDocumentReadCount(): number {
  const [count, setCount] = useState(getDocumentReadCount());
  useEffect(() => subscribeDocumentReads(() => setCount(getDocumentReadCount())), []);
  return count;
}
