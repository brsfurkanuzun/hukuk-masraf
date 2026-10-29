import { frame, scrollDisabled } from '@expo/ui/swift-ui/modifiers';

export const loginFormModifiers = [scrollDisabled(true), frame({ maxWidth: Infinity }), frame({ height: 320 })];
