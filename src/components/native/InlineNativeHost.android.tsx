import { Host } from '@expo/ui/jetpack-compose';
import type { ReactNode } from 'react';

import { colors } from '@/constants/theme';

export function InlineNativeHost({ children }: { children: ReactNode }) {
  return (
    <Host matchContents style={{ width: '100%', minHeight: 44 }} colorScheme="light" seedColor={colors.navy}>
      {children}
    </Host>
  );
}
