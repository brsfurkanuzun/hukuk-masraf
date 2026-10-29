import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/common/AppBackButton';
import { ErrorState, LoadingState } from '@/components/common/StateViews';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { colors, space, type as typeScale } from '@/constants/theme';
import { useDosya } from '@/hooks/useDosyalar';
import { toUserMessage } from '@/utils/errors';

export default function NewDosyaExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dosyaId: rawDosyaId } = useLocalSearchParams<{ dosyaId: string }>();
  const dosyaId = typeof rawDosyaId === 'string' ? rawDosyaId : '';
  const query = useDosya(dosyaId);
  if (query.isLoading || query.isError || !query.data) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <AppBackButton onPress={() => router.back()} />
          <Text style={styles.topTitle} numberOfLines={1}>
            Yeni Masraf
          </Text>
          <View style={styles.side} />
        </View>
        {query.isLoading ? <LoadingState label="Dosya yükleniyor" /> : <ErrorState message={toUserMessage(query.error)} onRetry={() => void query.refetch()} />}
      </View>
    );
  }
  return <ExpenseForm mode="create" dosya={query.data} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    minHeight: 44,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
    fontSize: typeScale.section,
    fontWeight: '600',
  },
  side: { width: 44 },
});
