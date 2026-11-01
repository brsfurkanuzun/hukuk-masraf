import { frame, listRowBackground, listRowInsets, listRowSeparator, type ModifierConfig } from '@expo/ui/swift-ui/modifiers';

/** Liste satırının iç boşluğunu, arka planını ve ayırıcısını kaldırır; içerik kenarlara kadar yayılır. */
export const flushRow: ModifierConfig[] = [
  frame({ maxWidth: Infinity }),
  listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
  listRowBackground('clear'),
  listRowSeparator('hidden'),
];
