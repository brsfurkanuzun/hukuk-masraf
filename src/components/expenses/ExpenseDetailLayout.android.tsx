import { FieldGroup } from '@expo/ui';
import type { ReactNode } from 'react';

export function ExpenseDetailLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <FieldGroup>
      {children}
      {footer}
    </FieldGroup>
  );
}
