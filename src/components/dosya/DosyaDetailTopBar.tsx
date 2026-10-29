import { Text, View } from 'react-native';

import type { AddMenuItem } from '@/components/common/AddMenuAnchor.types';
import { AppBackButton } from '@/components/common/AppBackButton';
import { DosyaAddMenuButton } from '@/components/dosya/DosyaAddMenuButton';
import { dosyaDetailStyles as styles } from '@/components/dosya/dosyaDetailStyles';

export function DosyaDetailTopBar({ title, addMenuItems, onBack }: { title: string; addMenuItems: AddMenuItem[]; onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <AppBackButton onPress={onBack} />
      <Text style={styles.topTitle} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.topAction}>
        <DosyaAddMenuButton items={addMenuItems} />
      </View>
    </View>
  );
}
