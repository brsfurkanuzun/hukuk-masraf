import { Button, SwipeActions } from '@expo/ui/swift-ui';
import type { ReactNode } from 'react';

export function SwipeToDelete({ enabled, onDelete, children }: { enabled: boolean; onDelete: () => void; children: ReactNode }) {
  if (!enabled) {
    return children;
  }
  return (
    <SwipeActions>
      {children}
      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
        <Button role="destructive" label="Sil" onPress={onDelete} />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}
