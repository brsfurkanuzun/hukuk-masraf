import { Host } from '@expo/ui/swift-ui';
import type { ReactNode } from 'react';

import { colors } from '@/constants/theme';

export function InlineNativeHost({ children }: { children: ReactNode }) {
  return (
    <Host alignment="center" style={{ width: '100%', height: 52 }} colorScheme="light" seedColor={colors.navy}>
      {children}
    </Host>
  );
}
