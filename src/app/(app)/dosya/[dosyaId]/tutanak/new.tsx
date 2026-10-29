import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { TutanakForm } from '@/components/forms/TutanakForm';
import { colors, space, type as typeScale } from '@/constants/theme';
import { useDosya } from '@/hooks/useDosyalar';
import { toUserMessage } from '@/utils/errors';

export default function NewTutanakScreen() {
  const { dosyaId: rawDosyaId } = useLocalSearchParams<{ dosyaId: string }>();
  const dosyaId = typeof rawDosyaId === 'string' ? rawDosyaId : '';
  const query = useDosya(dosyaId);

  if (query.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} />
        <Text style={styles.hint}>Dosya yükleniyor…</Text>
      </View>
    );
  }
  if (query.isError || !query.data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>{toUserMessage(query.error)}</Text>
        <Pressable accessibilityRole="button" onPress={() => void query.refetch()}>
          <Text style={styles.retry}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }
  return <TutanakForm dosya={query.data} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: space.md, padding: space.lg },
  hint: { color: colors.muted, fontSize: typeScale.body, textAlign: 'center' },
  retry: { color: colors.navy, fontSize: typeScale.body, fontWeight: '600' },
});
