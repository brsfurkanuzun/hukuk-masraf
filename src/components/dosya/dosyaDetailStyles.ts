import { colors, radius, space, type as typeScale } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const dosyaDetailStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    minHeight: 44,
  },
  topTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: typeScale.title,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: space.xs,
  },
  topAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: space.xxl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typeScale.section,
    fontWeight: '700',
  },
  sectionMeta: {
    color: colors.faint,
    fontSize: typeScale.small,
    fontWeight: '600',
  },
  list: {
    backgroundColor: colors.surface,
    marginHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  more: {
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  moreLabel: {
    color: colors.navy,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: space.md,
  },
  inlineState: {
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    gap: space.sm,
    alignItems: 'center',
  },
  hint: {
    color: colors.muted,
    fontSize: typeScale.body,
    textAlign: 'center',
  },
  error: {
    color: colors.muted,
    fontSize: typeScale.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typeScale.section,
    fontWeight: '600',
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  retryLabel: {
    color: colors.navy,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
});
