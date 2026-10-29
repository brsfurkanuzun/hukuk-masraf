import type { ReactNode } from 'react';
import { View } from 'react-native';

import { colors } from '@/constants/theme';

export function ScreenHost({ children }: { children: ReactNode; fill?: boolean }) {
  return <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>;
}
