import type { ReactNode } from 'react';
import { View } from 'react-native';

export function InlineNativeHost({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}
