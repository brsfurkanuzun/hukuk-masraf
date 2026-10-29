import { Image } from 'expo-image';

export function NativePhoto({ uri }: { uri: string }) {
  return <Image source={{ uri }} style={{ flex: 1 }} contentFit="contain" accessibilityLabel="Fotoğraf önizleme" />;
}
