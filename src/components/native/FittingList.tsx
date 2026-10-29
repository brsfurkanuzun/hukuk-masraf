import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

export function FittingList({
  children,
  header,
  footer,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer: ReactNode;
  onRefresh?: () => Promise<void>;
}) {
  return (
    <View style={{ flex: 1, justifyContent: 'flex-start' }}>
      {header}
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>{children}</ScrollView>
      {footer}
    </View>
  );
}
