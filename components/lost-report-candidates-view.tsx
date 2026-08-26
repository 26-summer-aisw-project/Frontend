import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner, ICONS } from '@/components/register-ui';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import type {
  LostReportCandidate,
  LostReportCandidatesResponse,
} from '@/src/types/lost-report';

type Props = {
  candidates: LostReportCandidatesResponse;
  error: string | null;
  onBack: () => void;
  onGoHome: () => void;
  onSelectCandidate: (candidate: LostReportCandidate) => void;
};

function scoreColor(
  rank: number,
  colors: ReturnType<typeof useAppColors>,
): string {
  if (rank === 1) {
    return colors.action;
  }
  if (rank <= 3) {
    return colors.bronze700;
  }
  return colors.muted;
}

export function LostReportCandidatesView({
  candidates,
  error,
  onBack,
  onGoHome,
  onSelectCandidate,
}: Props) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const isEmpty = candidates.data.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isEmpty && styles.emptyScrollContent]}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.pine500, colors.pine700]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <Pressable
            accessibilityLabel="뒤로"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={[styles.backButton, { top: Math.max(12, insets.top) }]}>
            <SymbolView name={ICONS.back} size={22} tintColor={colors.heroChrome} />
          </Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>비슷한 습득물 {candidates.data.length}건</Text>
            <Text style={[styles.heroSubtitle, { color: colors.heroSub }]}>
              유사도가 높은 순으로 안내해요
            </Text>
          </View>
        </LinearGradient>

        {error ? (
          <View style={styles.errorBanner}>
            <ErrorBanner title={error} />
          </View>
        ) : null}

        {isEmpty ? (
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyText, { color: colors.ink }]}>아직 분실물이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.stack}>
            {candidates.data.map((candidate) => {
              const percentage = Math.max(0, Math.min(100, candidate.score));
              const accent = scoreColor(candidate.rank, colors);
              return (
                <Pressable
                  key={candidate.candidateId}
                  accessibilityLabel={candidate.publicDescription}
                  accessibilityRole="button"
                  onPress={() => onSelectCandidate(candidate)}
                  style={({ pressed }) => [
                    styles.candidateCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: candidate.rank === 1 ? colors.action : colors.line,
                      shadowColor: colors.shadow,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.rank,
                      {
                        backgroundColor:
                          candidate.rank === 1 ? colors.action : colors.surfaceMuted,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.rankText,
                        { color: candidate.rank === 1 ? '#FFFFFF' : colors.ink2 },
                      ]}>
                      {candidate.rank}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.thumbnail,
                      { backgroundColor: colors.surfaceMuted, borderColor: colors.line },
                    ]}>
                    {candidate.thumbnailUrl ? (
                      <Image source={{ uri: candidate.thumbnailUrl }} style={styles.thumbnailImage} />
                    ) : (
                      <SymbolView name={ICONS.image} size={19} tintColor={colors.muted} />
                    )}
                  </View>
                  <View style={styles.candidateCopy}>
                    <Text style={[styles.candidateId, { color: colors.muted }]}>
                      {candidate.candidateId}
                    </Text>
                    <Text numberOfLines={1} style={[styles.candidateName, { color: colors.ink }]}>
                      {candidate.publicDescription}
                    </Text>
                    <View style={[styles.scoreTrack, { backgroundColor: colors.surfaceMuted }]}>
                      <View
                        style={[
                          styles.scoreFill,
                          { backgroundColor: accent, width: `${percentage}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.scoreText, { color: accent }]}>
                    {Math.round(candidate.score)}%
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {isEmpty ? (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.page, paddingBottom: Math.max(24, insets.bottom + 16) },
          ]}>
          <Pressable
            accessibilityRole="button"
            onPress={onGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.action },
              pressed && styles.pressed,
            ]}>
            <Text style={styles.primaryButtonText}>홈으로</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  emptyScrollContent: { flexGrow: 1, paddingBottom: 110 },
  hero: {
    height: 188,
    overflow: 'hidden',
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF14',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#14403B30',
  },
  backButton: {
    position: 'absolute',
    left: 4,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { position: 'absolute', right: 24, bottom: 30, left: 24, gap: 12 },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubtitle: { fontFamily: appFontFamily, fontSize: 12 },
  stack: { gap: 12, paddingVertical: 16, paddingHorizontal: 16 },
  errorBanner: { paddingTop: 16, paddingHorizontal: 16 },
  candidateCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  rank: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  rankText: { fontFamily: appFontFamily, fontSize: 11, fontWeight: '700' },
  thumbnail: {
    width: 50,
    height: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  thumbnailImage: { width: '100%', height: '100%' },
  candidateCopy: { flex: 1, gap: 4 },
  candidateId: { fontFamily: appFontFamily, fontSize: 11 },
  candidateName: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  scoreTrack: { height: 6, overflow: 'hidden', borderRadius: 3 },
  scoreFill: { height: 6, borderRadius: 3 },
  scoreText: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '800' },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontFamily: appFontFamily, fontSize: 18, fontWeight: '700' },
  footer: { position: 'absolute', right: 0, bottom: 0, left: 0, paddingHorizontal: 16 },
  primaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: { opacity: 0.82 },
});
