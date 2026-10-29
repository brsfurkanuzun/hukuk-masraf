import { Host } from '@expo/ui';
import { Image } from '@expo/ui/jetpack-compose';

export function NativePhoto({ uri }: { uri: string }) {
  return (
    <Host style={{ flex: 1 }}>
      <Image source={{ uri }} contentScale="fit" />
    </Host>
  );
}
