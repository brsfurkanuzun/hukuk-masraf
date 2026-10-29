import { Host } from '@expo/ui';
import { Image } from '@expo/ui/swift-ui';

export function NativePhoto({ uri }: { uri: string }) {
  return (
    <Host style={{ flex: 1 }} colorScheme="light">
      <Image uiImage={uri} />
    </Host>
  );
}
