import type { AddMenuItem } from '@/components/common/AddMenuAnchor';

export type HomeToolbarProps = {
  title: string;
  onAdd?: () => void;
  onNotifications?: () => void;
  hasUnread?: boolean;
  addMenuItems?: AddMenuItem[];
};
