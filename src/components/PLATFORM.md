# Platform UI

Mobile builds resolve components by platform suffix:

- `Component.ios.tsx` — iOS (SwiftUI / `@expo/ui/swift-ui`)
- `Component.android.tsx` — Android (Jetpack Compose / `@expo/ui/jetpack-compose`)
- `Component.tsx` — web fallback (React Native `View` / `Pressable`)

Import always as `@/components/.../Component` without a suffix. Do not branch on `Platform.OS` inside shared mobile components; add or update the `.ios` / `.android` files instead.

Shared types live in `*.types.ts` (for example `Button.types.ts`, `AddMenuAnchor.types.ts`).
