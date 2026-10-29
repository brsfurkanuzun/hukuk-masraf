import type { ReactNode } from 'react';

export function SwipeToDelete({ children }: { enabled: boolean; onDelete: () => void; children: ReactNode }) {
  return children;
}
