import { Box, Column, PullToRefreshBox } from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, height, onSizeChanged, verticalScroll } from '@expo/ui/jetpack-compose/modifiers';
import { useCallback, useState, type ReactNode } from 'react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const available = viewportHeight > 0 ? Math.max(viewportHeight - headerHeight - footerHeight, 0) : 0;
  const listHeight = contentHeight > 0 && available > 0 ? Math.min(contentHeight, available) : available;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) {
      return;
    }
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const scroller = (
    <Box modifiers={[fillMaxWidth(), ...(listHeight > 0 ? [height(listHeight)] : []), verticalScroll()]}>
      <Column
        modifiers={[
          fillMaxWidth(),
          onSizeChanged((size) => {
            setContentHeight((current) => settle(current, size.height));
          }),
        ]}
      >
        {children}
      </Column>
    </Box>
  );

  return (
    <Column
      modifiers={[
        fillMaxSize(),
        onSizeChanged((size) => {
          setViewportHeight((current) => settle(current, size.height));
        }),
      ]}
    >
      {header ? (
        <Box
          modifiers={[
            fillMaxWidth(),
            onSizeChanged((size) => {
              setHeaderHeight((current) => settle(current, size.height));
            }),
          ]}
        >
          {header}
        </Box>
      ) : null}
      {onRefresh ? (
        <PullToRefreshBox
          isRefreshing={isRefreshing}
          onRefresh={() => void handleRefresh()}
          contentAlignment="topCenter"
          modifiers={[fillMaxWidth(), ...(listHeight > 0 ? [height(listHeight)] : [])]}
        >
          {scroller}
        </PullToRefreshBox>
      ) : (
        scroller
      )}
      <Box
        modifiers={[
          fillMaxWidth(),
          onSizeChanged((size) => {
            setFooterHeight((current) => settle(current, size.height));
          }),
        ]}
      >
        {footer}
      </Box>
    </Column>
  );
}
