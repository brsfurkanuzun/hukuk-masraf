import { useEffect, useState } from 'react';

import { loadUserNames } from '@/services/users/userService';
import { logError } from '@/utils/errors';

export function useAuthorNames(userIds: string[]): Record<string, string> {
  const key = [...new Set(userIds.filter((id) => id.length > 0))].sort().join('\n');
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = key.length > 0 ? key.split('\n') : [];
    if (ids.length === 0) {
      setNames({});
      return;
    }
    let cancelled = false;
    loadUserNames(ids)
      .then((next) => {
        if (!cancelled) {
          setNames(next);
        }
      })
      .catch((error: unknown) => logError('author-names', error));
    return () => {
      cancelled = true;
    };
  }, [key]);

  return names;
}
