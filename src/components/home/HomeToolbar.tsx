import { Button, Text } from '@expo/ui';
import { View } from 'react-native';

import { colors } from '@/constants/theme';

export function HomeToolbar({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 12 }}>
      <Text numberOfLines={1} textStyle={{ color: colors.ink, fontSize: 28, fontWeight: '700' }}>
        {title}
      </Text>
      <View style={{ flex: 1 }} />
      <Button variant="text" label="+" onPress={onAdd} />
    </View>
  );
}
