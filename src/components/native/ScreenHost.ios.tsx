import { Host } from '@expo/ui/swift-ui';
import type { ReactNode } from 'react';

import { colors } from '@/constants/theme';

export function ScreenHost({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  return (
    <Host style={{ flex: 1 }} colorScheme="light" seedColor={colors.navy} useViewportSizeMeasurement={fill}>
      {children}
    </Host>
  );
}
