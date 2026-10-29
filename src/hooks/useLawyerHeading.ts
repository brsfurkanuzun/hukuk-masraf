import { useEffect, useState } from 'react';

import { formatLawyerName, loadUserName } from '@/services/users/userService';
import { logError } from '@/utils/errors';

export function useLawyerHeading(uid: string | undefined, authName: string | null | undefined): string {
  const [heading, setHeading] = useState('AV.');

  useEffect(() => {
    if (!uid) {
      setHeading('AV.');
      return;
    }
    let cancelled = false;
    loadUserName(uid)
      .then((name) => {
        if (cancelled) {
          return;
        }
        const fromProfile = formatLawyerName(name);
        setHeading(fromProfile !== 'AV.' ? fromProfile : formatLawyerName(nameFromAuth(authName)));
      })
      .catch((error: unknown) => logError('user-name', error));
    return () => {
      cancelled = true;
    };
  }, [uid, authName]);

  return heading;
}

function nameFromAuth(value: string | null | undefined) {
  const display = value?.trim() ?? '';
  if (!display || display.includes('@') || !display.includes(' ')) {
    return { firstName: '', lastName: '' };
  }
  const [first = '', ...rest] = display.split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
}
