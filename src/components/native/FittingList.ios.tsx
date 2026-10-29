import { List, VStack } from '@expo/ui/swift-ui';
import { frame, onGeometryChange, refreshable, useScrollGeometryChange } from '@expo/ui/swift-ui/modifiers';
import { useState, type ReactNode } from 'react';

function settle(current: number, next: number) {
  const rounded = Math.round(next);
  return current === rounded ? current : rounded;
}

export function FittingList({
  children,
  header,
  footer,
  onRefresh,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer: ReactNode;
  onRefresh?: () => Promise<void>;
}) {
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const geometryModifier = useScrollGeometryChange((geometry) => {
    setContentHeight((current) => settle(current, geometry.contentHeight));
  });
  const available = viewportHeight > 0 ? Math.max(viewportHeight - headerHeight - footerHeight, 0) : 0;
  const listHeight = contentHeight > 0 && available > 0 ? Math.min(contentHeight, available) : available;
  const listFrame =
    listHeight > 0
      ? [frame({ maxWidth: Infinity }), frame({ height: listHeight })]
      : [frame({ maxWidth: Infinity, maxHeight: Infinity })];

  return (
    <VStack
      alignment="center"
      spacing={12}
      modifiers={[
        frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'top' }),
        onGeometryChange((next) => {
          setViewportHeight((current) => settle(current, next.height));
        }),
      ]}
    >
      {header ? (
        <VStack
          modifiers={[
            frame({ maxWidth: Infinity }),
            onGeometryChange((next) => {
              setHeaderHeight((current) => settle(current, next.height));
            }),
          ]}
        >
          {header}
        </VStack>
      ) : null}
      <List modifiers={[...listFrame, ...(onRefresh ? [refreshable(onRefresh)] : []), ...(geometryModifier ? [geometryModifier] : [])]}>{children}</List>
      <VStack
        modifiers={[
          frame({ maxWidth: Infinity }),
          onGeometryChange((next) => {
            setFooterHeight((current) => settle(current, next.height));
          }),
        ]}
      >
        {footer}
      </VStack>
    </VStack>
  );
}
