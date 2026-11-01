import { Column, RNHostView, Row } from '@expo/ui';
import { weight } from '@expo/ui/jetpack-compose/modifiers';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { TextField } from '@/components/common/TextField';
import { colors, hitSlop } from '@/constants/theme';

/** Android: büyüteç solda, yazı varken sağda temizle (x) düğmesi olan dolgulu yuvarlak arama alanı. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Row
      alignment="center"
      spacing={8}
      style={{ width: '100%', backgroundColor: colors.search, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}
    >
      <RNHostView matchContents style={{ width: 22, height: 22 }}>
        <SymbolView name={{ android: 'search' }} size={22} tintColor={colors.muted} />
      </RNHostView>
      <Column modifiers={[weight(1)]}>
        <TextField
          variant="search"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="search"
          enterKeyHint="search"
          placeholder={placeholder}
        />
      </Column>
      {value ? (
        <RNHostView matchContents style={{ width: 28, height: 28 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
            onPress={() => onChangeText('')}
            hitSlop={hitSlop}
            style={styles.clear}
          >
            <SymbolView name={{ android: 'cancel' }} size={20} tintColor={colors.faint} />
          </Pressable>
        </RNHostView>
      ) : null}
    </Row>
  );
}

const styles = StyleSheet.create({
  clear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
