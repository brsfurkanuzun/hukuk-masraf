import { frame, layoutPriority } from '@expo/ui/swift-ui/modifiers';

export const previewFrameModifiers = [layoutPriority(1), frame({ maxWidth: Infinity, minHeight: 240, maxHeight: Infinity })];
