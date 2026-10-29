import { FieldGroup } from '@expo/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';

export function ExpenseDetailLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <FieldGroup>
      {children}
      <View style={{ alignItems: 'center' }}>{footer}</View>
    </FieldGroup>
  );
}
