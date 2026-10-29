import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AttachmentMeta } from '@/models/expense';
import { type as typeScale } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

export function TutanakImageViewer({ images, onClose }: { images: AttachmentMeta[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [sharing, setSharing] = useState(false);

  async function shareCurrent() {
    const image = images[page];
    if (!image?.url || sharing) {
      return;
    }
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Paylaşılamadı', 'Bu cihazda paylaşım açılamıyor.');
        return;
      }
      const directory = new Directory(Paths.cache, 'previews');
      directory.create({ idempotent: true, intermediates: true });
      const extension = image.mimeType === 'image/png' ? 'png' : 'jpg';
      const file = await File.downloadFileAsync(image.url, new File(directory, `${image.id}.${extension}`), { idempotent: true });
      await Sharing.shareAsync(file.uri, { mimeType: image.mimeType || 'image/jpeg', dialogTitle: image.fileName });
    } catch (error) {
      Alert.alert('Paylaşılamadı', toUserMessage(error));
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent visible>
      <View style={styles.screen}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
        >
          {images.map((image) => (
            <View key={image.id} style={{ width, height }}>
              <Image accessibilityLabel={image.fileName} contentFit="contain" source={{ uri: image.url }} style={styles.image} />
            </View>
          ))}
        </ScrollView>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose} style={[styles.close, { top: insets.top + 8 }]}>
          <Text style={styles.closeLabel}>Kapat</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paylaş"
          disabled={sharing}
          hitSlop={12}
          onPress={() => void shareCurrent()}
          style={[styles.share, { top: insets.top + 8 }, sharing && styles.shareBusy]}
        >
          <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={22} tintColor="#FFFFFF" />
        </Pressable>
        {images.length > 1 ? (
          <Text style={[styles.counter, { top: insets.top + 12 }]}>
            {page + 1} / {images.length}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  image: { width: '100%', height: '100%' },
  close: { position: 'absolute', left: 16, paddingVertical: 8, paddingHorizontal: 4 },
  share: { position: 'absolute', right: 16, paddingVertical: 8, paddingHorizontal: 4 },
  shareBusy: { opacity: 0.45 },
  closeLabel: { color: '#FFFFFF', fontSize: typeScale.body, fontWeight: '600' },
  counter: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: typeScale.body,
    fontWeight: '600',
  },
});
