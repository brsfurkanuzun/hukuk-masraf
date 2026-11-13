import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

export function FittingList({
  children,
  header,
  footer,
  reserveBottom = 0,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer: ReactNode;
  onRefresh?: () => Promise<void>;
  reserveBottom?: number;
}) {
  return (
    <View style={{ flex: 1, justifyContent: 'flex-start', paddingBottom: reserveBottom }}>
      {header}
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>{children}</ScrollView>
      {footer}
    </View>
  );
}
