import { Button, Toolbar, ToolbarItem } from '@expo/ui/swift-ui';
import type { ReactNode } from 'react';

export function KeyboardDone({ onDone, children }: { onDone: () => void; children: ReactNode }) {
  return (
    <Toolbar>
      {children}
      <Toolbar.Content>
        <ToolbarItem placement="keyboard">
          <Button label="Tamam" onPress={onDone} />
        </ToolbarItem>
      </Toolbar.Content>
    </Toolbar>
  );
}
